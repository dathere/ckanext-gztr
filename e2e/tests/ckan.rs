use anyhow::{Result, bail};
use ckanaction::CKAN;
use testcontainers::compose::DockerCompose;

#[tokio::test]
async fn test_status_show() -> Result<()> {
    let Ok(docker_compose_path) = std::env::var("DOCKER_COMPOSE_PATH") else {
        bail!("The DOCKER_COMPOSE_PATH environment variable might not be set.")
    };
    // Set up new CKAN instance
    let mut compose = DockerCompose::with_local_client(&[docker_compose_path]);
    compose.up().await?;

    let ckan = CKAN::builder().url("http://localhost:5000").build();
    let status_show = ckan.status_show().await?;
    // Verify success is true
    if let Some(success_value) = status_show.get("success") {
        if let Some(success) = success_value.as_bool() {
            assert!(success);
        } else {
            bail!("Received None for status_show.success when running as_bool().");
        }
    } else {
        bail!("Received None for status_show.success.");
    }
    // Verify scheming_datasets and gztr are in the result.extensions array
    let Some(result_value) = status_show.get("result") else {
        bail!("Received None for status_show.result")
    };
    let Some(result) = result_value.as_object() else {
        bail!("Received None for status_show.result as_object()");
    };
    let Some(extensions_value) = result.get("extensions") else {
        bail!("Received None for status_show.result.extensions");
    };
    let Some(extensions) = extensions_value.as_array() else {
        bail!("Received None for status_show.result.extensions as_array()");
    };
    assert!(
        extensions.contains(&serde_json::to_value("scheming_datasets").unwrap())
            && extensions.contains(&serde_json::to_value("gztr").unwrap())
    );
    println!("[GET | http://localhost:5000/api/3/action/status_show]\n{status_show:#?}");

    Ok(())
}

// TODO: Ephemeral volume tests

// TODO: Data directory for filesystem approach test (allows for usage of arbitrary water data hubs)
