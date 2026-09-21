# End-to-end tests for ckanext-gztr

> Note: The end-to-end tests in this directory are considered out of date for now.

This directory contains a Rust project for running tests based on Docker containers.

## Instructions

1. Ensure you have the pre-requisite software installed on your system (we assume you're running on a Debian-based distro):

- [Rust](https://rust-lang.org/tools/install/)
- [Docker](https://www.docker.com/) (and Docker Compose)
- [jaq](https://github.com/01mf02/jaq)

Make sure `cargo`, `docker`, and `jaq` are available from the `PATH` environment variable so that the tests can use them for commands.

2. Clone the `docker-ckan` repo on the `dev/gztr` branch to a separate folder:

```bash
git clone https://github.com/dathere/gztr-docker-demo.git
```

3. Set the environment variable `DOCKER_COMPOSE_PATH` to the absolute path of the `docker-compose.yml` file in `gztr-docker-demo/docker-compose.dev.yml`. Also set `CARGO_MANIFEST_PATH` to the absolute path of the `Cargo.toml` file. For example:

```bash
export DOCKER_COMPOSE_PATH="/home/rzmk/programming/gztr-docker-demo/docker-compose.dev.yml";
export CARGO_MANIFEST_PATH="/home/rzmk/programming/ckanext-gztr/e2e/Cargo.toml"
```

5. Now run the interactive `e2e` suite:

```bash
cargo run --release
```
