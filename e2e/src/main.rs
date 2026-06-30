use anyhow::{Result, bail};
use cliclack::{intro, outro};
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

    // let print_debug_statements =
    //     confirm("Print debug statements (println!) from tests?").interact()?;

    cliclack::log::info("Running tests.")?;

    let docker_compose_pathbuf = PathBuf::from_str(&docker_compose_path).unwrap();
    let docker_compose_dir_pathbuf = docker_compose_pathbuf.parent().unwrap();
    let command = "cargo test --manifest-path=$CARGO_MANIFEST_PATH --release";
    // let command = if print_debug_statements {
    //     "cargo test --manifest-path=$CARGO_MANIFEST_PATH --release -- --nocapture"
    // } else {
    //     "cargo test --manifest-path=$CARGO_MANIFEST_PATH --release"
    // };
    let output = duct_sh::sh(command)
        .dir(docker_compose_dir_pathbuf)
        .unchecked()
        .stdout_capture()
        .reader()
        .unwrap();
    for line in BufReader::new(output).lines() {
        println!("{}", line?);
    }

    cliclack::log::success("Ran all tests.")?;

    outro("Have a good day!")?;
    Ok(())
}
