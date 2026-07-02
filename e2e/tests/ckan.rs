#![warn(clippy::nursery, clippy::pedantic)]

use anyhow::{Result, bail};
use ckanaction::CKAN;
use std::{env::current_dir, io::Write, path::PathBuf, time::Duration};
use tempfile::NamedTempFile;
use testcontainers::{compose::DockerCompose, core::ExecCommand};

async fn get_compose() -> Result<DockerCompose> {
    let Ok(docker_compose_path) = std::env::var("DOCKER_COMPOSE_PATH") else {
        bail!("The DOCKER_COMPOSE_PATH environment variable might not be set.")
    };
    // Set up new CKAN instance
    let compose = DockerCompose::with_local_client(&[docker_compose_path]).with_build(true);
    Ok(compose)
}

async fn get_service_port(compose: &DockerCompose, service: &str, port: u16) -> Result<u16> {
    Ok(compose
        .service(service)
        .unwrap()
        .get_host_port_ipv4(port)
        .await?)
}

fn assert_str_true(string: String) {
    assert_eq!(string, "true");
}

async fn jaq(command: &'static str, object: &serde_json::Value) -> Result<String> {
    Ok(duct_sh::sh(command)
        .stdin_bytes(serde_json::to_string(object)?)
        .read()?)
}

async fn jaq_dangerous(command: String, object: &serde_json::Value) -> Result<String> {
    Ok(duct_sh::sh_dangerous(command)
        .stdin_bytes(serde_json::to_string(object)?)
        .read()?)
}

#[tokio::test]
async fn test_status_show_success_no_jaq() -> Result<()> {
    let mut compose = get_compose().await?;
    compose.up().await?;
    let ckan_port = get_service_port(&compose, "ckan", 5000).await?;
    let ckan = CKAN::builder()
        .url(format!("http://localhost:{ckan_port}").as_str())
        .build();

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
    println!("[GET | http://localhost:{ckan_port}/api/3/action/status_show]\n{status_show:#?}");

    Ok(())
}

#[tokio::test]
async fn test_status_show_success() -> Result<()> {
    let mut compose = get_compose().await?;
    compose.up().await?;
    let ckan_port = get_service_port(&compose, "ckan", 5000).await?;
    let ckan = CKAN::builder()
        .url(format!("http://localhost:{ckan_port}").as_str())
        .build();

    let status_show = ckan.status_show().await?;
    // Verify success is true
    assert_str_true(jaq("jaq .success", &status_show).await?);

    Ok(())
}

#[tokio::test]
async fn test_status_show_extensions() -> Result<()> {
    let mut compose = get_compose().await?;
    compose.up().await?;
    let ckan_port = get_service_port(&compose, "ckan", 5000).await?;
    let ckan = CKAN::builder()
        .url(format!("http://localhost:{ckan_port}").as_str())
        .build();

    let status_show = ckan.status_show().await?;
    // Verify scheming_datasets and gztr are in the result.extensions array
    for extension in vec!["scheming_datasets", "gztr"].iter() {
        assert_str_true(
            jaq_dangerous(
                format!(r#"jaq '.result.extensions | any(index("{extension}"))'"#),
                &status_show,
            )
            .await?,
        );
    }

    Ok(())
}

#[tokio::test]
async fn test_gztr_storage_dir_exists() -> Result<()> {
    let mut compose = get_compose().await?;
    compose.up().await?;
    let echo_result = String::from_utf8(
        compose
            .service("ckan")
            .unwrap()
            .exec(ExecCommand::new(["env"]))
            .await?
            .stdout_to_vec()
            .await?,
    )?;
    for line in echo_result.lines() {
        if line.starts_with("APP_DIR") {
            let app_dir: Vec<&str> = line.splitn(2, "=").collect();
            let app_dir_path = app_dir.get(1).unwrap();
            let mut gztr_storage_dir = String::from(*app_dir_path);
            gztr_storage_dir.push_str("/data/gztr");
            let output = String::from_utf8(
                compose
                    .service("ckan")
                    .unwrap()
                    .exec(ExecCommand::new(["ls", "-lsa", "/app/data"]))
                    .await?
                    .stdout_to_vec()
                    .await?,
            )?;
            println!("{output}");
        }
    }
    Ok(())
}

#[tokio::test]
async fn test_file_create_fail_no_auth() -> Result<()> {
    let mut compose = get_compose().await?;
    compose.up().await?;
    let ckan_port = get_service_port(&compose, "ckan", 5000).await?;
    let ckan = CKAN::builder()
        .url(format!("http://localhost:{ckan_port}").as_str())
        .build();

    let text = "Here is some text content that should be in the file.";
    let mut file = NamedTempFile::new()?;
    file.write_all(text.as_bytes())?;
    let path_buf = file.path().to_path_buf();
    println!("Temporary file path: {:?}", path_buf);
    // let path_buf = current_dir()?.join("README.md");
    // println!("File path: {:?}", path_buf);
    let response = ckan
        .file_create()
        .storage("gztr".to_string())
        .upload(path_buf)
        .call()
        .await?;

    // Verify success if false
    assert_eq!(jaq("jaq .success", &response).await?, "false");
    // Verify error is of type Authorization Error
    assert_eq!(
        jaq("jaq .error.__type", &response).await?,
        "\"Authorization Error\""
    );
    // Verify error messagee is about files
    assert_eq!(
        jaq("jaq .error.message", &response).await?,
        "\"Access denied: Not allowed to manage files\""
    );

    println!("{response:#?}");

    Ok(())
}

// TODO: file_create success by using newly generated CKAN token from sysadmin user (?)
// Will probably need to execute a ckan command in the ckan service container

// TODO: Ephemeral volume tests
