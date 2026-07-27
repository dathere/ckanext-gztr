#![warn(clippy::nursery, clippy::pedantic)]

use anyhow::{Result, bail};
use cliclack::{confirm, intro, multiselect, outro};
use std::{
    io::{BufRead, BufReader},
    path::PathBuf,
    str::FromStr,
};

fn main() -> Result<()> {
    intro("ckanext-gztr E2E test suite")?;

    cliclack::log::info("Checking for environment variables...")?;
    let Ok(docker_compose_path) = std::env::var("DOCKER_COMPOSE_PATH") else {
        bail!("Missing DOCKER_COMPOSE_PATH environment variable.");
    };

    let has_cargo_nextest = duct_sh::sh("cargo nextest --version")
        .stdout_null()
        .run()?
        .status
        .success();

    let mut test_settings_builder = multiselect(
        "Select your test settings. (Press space to select an option and enter to run)",
    )
    .item(
        "nocapture",
        "Print debug information with --nocapture",
        "Adds --nocapture.",
    );

    if has_cargo_nextest {
        test_settings_builder = test_settings_builder.item("nextest", "Use cargo nextest instead of cargo test", "Great looking output. NOTE: When --nocapture is enabled, tests run SERIALLY which is SLOW.");
    }

    test_settings_builder = test_settings_builder.item("filter", "Filter for specific tests", "You'll query tests by name where any test name that contains your query will run. When disabled then we run all tests.");

    // test_settings_builder = test_settings_builder.item("manual", "Run a manual long-lived instance of CKAN.", "Modify the ckan service port first. If you cancel early you'll need to clear the containers and volumes manually.");

    let docker_ps_a_q_output = duct_sh::sh("docker ps -a -q").read()?;
    let docker_volume_ls_output = duct_sh::sh("docker volume ls").read()?;
    let docker_network_ls_output = duct_sh::sh("docker network ls").read()?;
    if !docker_ps_a_q_output.is_empty()
        || !docker_volume_ls_output.is_empty()
        || !docker_network_ls_output.is_empty()
    {
        test_settings_builder = test_settings_builder.item(
            "clear",
            "DANGEROUS: Clear all docker containers, volumes, and networks before running tests",
            "DANGEROUS!",
        );
    }

    let test_settings = test_settings_builder.interact()?;

    if test_settings.contains(&"clear") {
        let confirm_clear = confirm(
            "ARE YOU SURE you want to STOP AND CLEAR ALL CONTAINERS and CLEAR ALL VOLUMES AND (CUSTOM) NETWORKS?",
        )
        .interact()?;
        if confirm_clear {
            if !docker_ps_a_q_output.is_empty() {
                cliclack::log::info("Stopping all containers.")?;
                duct_sh::sh_dangerous(format!(
                    "docker stop {}",
                    docker_ps_a_q_output.replace("\n", " ")
                ))
                .run()?;
                cliclack::log::success("Stopped all containers.")?;
                cliclack::log::info("Removing all containers.")?;
                duct_sh::sh_dangerous(format!(
                    "docker rm {}",
                    docker_ps_a_q_output.replace("\n", " ")
                ))
                .run()?;
                cliclack::log::success("Removed all containers.")?;
            }
            if !docker_volume_ls_output.is_empty() {
                cliclack::log::info("Removing all volumes.")?;
                duct_sh::sh_dangerous("docker volume prune --all -f").run()?;
                cliclack::log::success("Removed all volumes.")?;
            }
            if !docker_network_ls_output.is_empty() {
                cliclack::log::info("Removing all custom networks.")?;
                duct_sh::sh_dangerous("docker network prune -f").run()?;
                cliclack::log::success("Removed all custom networks.")?;
            }
        }
    }

    let test_filter: String = if test_settings.contains(&"filter") {
        cliclack::input("Search for tests to run by name")
        .placeholder("For example if you write storage then all tests with storage in its name will be ran such as test_storage_setup.")
        .validate(|input: &String| {
            if input.is_empty() {
                Err("A test name is required!")
            } else {
                Ok(())
            }
        })
        .interact()?
    } else {
        "".to_string()
    };

    let docker_compose_pathbuf = PathBuf::from_str(&docker_compose_path).unwrap();
    let docker_compose_dir_pathbuf = docker_compose_pathbuf.parent().unwrap();
    #[rustfmt::skip]
    let command = match test_settings {
        t if t.contains(&"nextest") && t.contains(&"nocapture") && t.contains(&"filter") => format!("cargo nextest run --manifest-path=$CARGO_MANIFEST_PATH --release {test_filter} --nocapture"),
        t if t.contains(&"nextest") && t.contains(&"nocapture") => { "cargo nextest run --manifest-path=$CARGO_MANIFEST_PATH --release --nocapture".to_string() },
        t if t.contains(&"nextest") && t.contains(&"filter") => { format!("cargo nextest run --manifest-path=$CARGO_MANIFEST_PATH --release {test_filter}") },
        t if t.contains(&"nextest") => { "cargo nextest run --manifest-path=$CARGO_MANIFEST_PATH --release".to_string() },
        t if t.contains(&"nocapture") && t.contains(&"filter") => format!("cargo test --manifest-path=$CARGO_MANIFEST_PATH --release {test_filter} -- --nocapture"),
        t if t.contains(&"nocapture") => format!("cargo test --manifest-path=$CARGO_MANIFEST_PATH --release -- --nocapture"),
        t if t.contains(&"filter") => { format!("cargo test --manifest-path=$CARGO_MANIFEST_PATH --release {test_filter}") }
        _ => "cargo test --manifest-path=$CARGO_MANIFEST_PATH --release".to_string(),
    };

    cliclack::log::info(format!("Running command: {command}"))?;

    let output = duct_sh::sh_dangerous(command)
        .dir(docker_compose_dir_pathbuf)
        .unchecked()
        .stdout_capture()
        .reader()
        .unwrap();
    for line in BufReader::new(output).lines() {
        println!("{}", line?);
    }

    cliclack::log::success("Ran all tests.")?;

    outro("Take care! 🌳")?;
    Ok(())
}
