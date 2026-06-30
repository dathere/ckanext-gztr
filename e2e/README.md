# End-to-end tests for ckanext-gztr

This directory contains a Rust project for running tests based on Docker containers.

## Instructions

1. Ensure you have the pre-requisite software installed on your system (we assume you're running on a Debian-based distro):

- [Rust](https://rust-lang.org/tools/install/)
- [Docker](https://www.docker.com/) (and Docker Compose)

2. Clone the `docker-ckan` repo on the `dev/gztr` branch to a separate folder:

```bash
git clone --single-branch --branch dev/gztr https://github.com/dathere/docker-ckan.git
```

3. Make a copy of `ckanext-gztr` within `docker-ckan` so that `docker-ckan/images/ckan/2.11/gztr.Dockerfile` can identify it within the context. For example:

```bash
cp -r ./ckanext-gztr ./docker-ckan/images/ckan/2.11/ckanext-gztr
```

4. Set the environment variable `DOCKER_COMPOSE_PATH` to the absolute path of the `docker-compose.yml` file in `docker-ckan/compose/docker-compose.yml`. Also set `CARGO_MANIFEST_PATH` to the absolute path of the `Cargo.toml` file. For example:

```bash
export DOCKER_COMPOSE_PATH="/home/rzmk/programming/docker-ckan/compose/docker-compose.yml";
export CARGO_MANIFEST_PATH="/home/rzmk/programming/ckanext-gztr/e2e/Cargo.toml"
```

5. Now run the interactive `e2e` suite:

```bash
cargo run --release
```
