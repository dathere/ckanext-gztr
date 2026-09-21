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

4. Replace the value of `ports` in `gztr-docker-demo/docker-compose.dev.yml` to just `"5000"` so that an arbitrary host port can be used for running multiple tests simultaneously and comment out the existing `ports` value:

```yml
    ports:
      # Map the container's port 5000 to a random available port on the host
      - "5000"
    # For serial or manual tests, map the container's port 5000 to host port 5000
      # - "0.0.0.0:${CKAN_PORT_HOST}:5000"
```

5. Now run the interactive `e2e` suite:

```bash
cargo run --release
```
