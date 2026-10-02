#![warn(clippy::nursery, clippy::pedantic)]

pub mod utils;

use anyhow::{Result, bail};
use ckanaction::CKAN;
use std::{io::Write, path::PathBuf};
use tempfile::NamedTempFile;
use testcontainers::core::ExecCommand;
use utils::{
    action_api_endpoint_success, assert_str_true, ckan_container_command, generate_token,
    get_ckan_config_path, get_ckan_service_name, get_compose, get_container_env_var,
    get_service_port, jaq, jaq_dangerous, verify_extensions_installed,
};

#[tokio::test]
async fn test_status_show_success_no_jaq() -> Result<()> {
    let mut compose = get_compose().await?;
    compose.up().await?;
    let ckan_port = get_service_port(&compose, get_ckan_service_name(), 5000).await?;
    let ckan = CKAN::builder()
        .url(format!("http://localhost:{ckan_port}").as_str())
        .build();

    let status_show = ckan.status_show().await?;
    action_api_endpoint_success(&status_show, "status_show").await?;
    verify_extensions_installed(&status_show).await?;
    println!("[GET | http://localhost:{ckan_port}/api/3/action/status_show]\n{status_show:#?}");

    Ok(())
}

#[tokio::test]
async fn test_status_show_success() -> Result<()> {
    let mut compose = get_compose().await?;
    compose.up().await?;
    let ckan_port = get_service_port(&compose, get_ckan_service_name(), 5000).await?;
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
    let ckan_port = get_service_port(&compose, get_ckan_service_name(), 5000).await?;
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
    let mut gztr_storage_dir = get_container_env_var(
        &compose,
        get_ckan_service_name().to_string(),
        "CKAN_STORAGE_PATH".to_string(),
    )
    .await?;
    gztr_storage_dir.push_str("/storage/uploads");
    let output = String::from_utf8(
        compose
            .service(get_ckan_service_name())
            .unwrap()
            .exec(ExecCommand::new([
                "ls",
                "-w",
                "1",
                gztr_storage_dir.as_str(),
            ]))
            .await?
            .stdout_to_vec()
            .await?,
    )?;
    for line in output.lines() {
        if line == "gztr" {
            return Ok(());
        }
    }
    bail!("Could not find gztr storage directory at {gztr_storage_dir}");
}

#[tokio::test]
async fn test_file_create_fail_no_auth() -> Result<()> {
    let mut compose = get_compose().await?;
    compose.up().await?;
    let ckan_port = get_service_port(&compose, get_ckan_service_name(), 5000).await?;
    let ckan = CKAN::builder()
        .url(format!("http://localhost:{ckan_port}").as_str())
        .build();

    let text = "Here is some text content that should be in the file.";
    let mut file = NamedTempFile::new()?;
    file.write_all(text.as_bytes())?;
    let path_buf = file.path().to_path_buf();
    println!("Temporary file path: {:?}", path_buf);
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

#[tokio::test]
async fn test_ckan_help_command_in_container() -> Result<()> {
    let mut compose = get_compose().await?;
    compose.up().await?;
    let output = ckan_container_command(
        &compose,
        [
            "ckan",
            "-c",
            get_ckan_config_path(&compose).await?.as_str(),
            "--help",
        ],
    )
    .await?;
    assert!(output.starts_with("Usage: ckan"));

    Ok(())
}

// file_create success by using newly generated CKAN token from sysadmin user
#[tokio::test]
async fn test_file_create_success_with_sysadmin_auth() -> Result<()> {
    let mut compose = get_compose().await?;
    compose.up().await?;
    let ckan_port = get_service_port(&compose, get_ckan_service_name(), 5000).await?;
    let api_token = generate_token(
        &compose,
        get_container_env_var(
            &compose,
            get_ckan_service_name().to_string(),
            "CKAN_SYSADMIN_NAME".to_string(),
        )
        .await?
        .as_str(),
        "file_token",
    )
    .await?;
    let ckan = CKAN::builder()
        .url(format!("http://localhost:{ckan_port}").as_str())
        .token(api_token)
        .build();

    // Create a new text file and uplad it to the gztr storage
    let text = "Here is some text content that should be in the file.";
    let mut file = NamedTempFile::new()?;
    file.write_all(text.as_bytes())?;
    let path_buf = file.path().to_path_buf();
    let response = ckan
        .file_create()
        .storage("gztr".to_string())
        .upload(path_buf)
        .call()
        .await?;

    // Verify success if false
    assert_eq!(jaq("jaq .success", &response).await?, "true");
    // Verify storage used is gztr
    assert_eq!(jaq("jaq .result.storage", &response).await?, "\"gztr\"");
    // Verify the file can be downloaded publicly without any auth needed
    let file_location = jaq("jaq .result.location", &response).await?;
    duct_sh::sh_dangerous(format!(
        "curl -s http://localhost:{ckan_port}/file/public-download/gztr/{file_location}"
    ))
    .run()?;

    println!("{response:#?}");

    Ok(())
}

#[tokio::test]
async fn test_playwright_basic() -> Result<()> {
    let mut compose = get_compose().await?;
    compose.up().await?;
    let ckan_port = get_service_port(&compose, get_ckan_service_name(), 5000).await?;

    duct_sh::sh("pnpm test playwright/example.spec.ts")
        .env("CKAN_PORT", ckan_port.to_string())
        .run()?;

    Ok(())
}
