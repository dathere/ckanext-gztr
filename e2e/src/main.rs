#![warn(clippy::nursery, clippy::pedantic)]

use anyhow::{Result, bail};
use cliclack::{intro, multiselect, outro};
use std::{
    collections::HashSet,
    io::{BufRead, BufReader},
    path::PathBuf,
    str::FromStr,
};

trait VecExt {
    fn multi_contains(&self, values: Vec<&str>) -> bool;
}

impl VecExt for Vec<&str> {
    fn multi_contains(&self, values: Vec<&str>) -> bool {
        let hs: HashSet<&&str> = HashSet::from_iter(self.iter().clone());
        HashSet::from_iter(values.iter()).is_subset(&hs)
    }
}

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

    let test_settings = test_settings_builder.interact()?;

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
        t if t.multi_contains(vec!["nextest", "nocapture", "filter"]) => format!("cargo nextest run --manifest-path=$CARGO_MANIFEST_PATH --release {test_filter} --nocapture"),
        t if t.multi_contains(vec!["nextest", "nocapture"]) => { "cargo nextest run --manifest-path=$CARGO_MANIFEST_PATH --release --nocapture".to_string() },
        t if t.multi_contains(vec!["nextest", "filter"]) => { format!("cargo nextest run --manifest-path=$CARGO_MANIFEST_PATH --release {test_filter}") },
        t if t.multi_contains(vec!["nextest"]) => { "cargo nextest run --manifest-path=$CARGO_MANIFEST_PATH --release".to_string() },
        t if t.multi_contains(vec!["nocapture", "filter"]) => format!("cargo test --manifest-path=$CARGO_MANIFEST_PATH --release {test_filter} -- --nocapture"),
        t if t.multi_contains(vec!["nocapture"]) => format!("cargo test --manifest-path=$CARGO_MANIFEST_PATH --release -- --nocapture"),
        t if t.multi_contains(vec!["filter"]) => { format!("cargo test --manifest-path=$CARGO_MANIFEST_PATH --release {test_filter}") }
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
