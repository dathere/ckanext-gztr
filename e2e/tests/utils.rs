use anyhow::{Result, bail};
use testcontainers::{compose::DockerCompose, core::ExecCommand};

pub async fn get_compose() -> Result<DockerCompose> {
    let Ok(docker_compose_path) = std::env::var("DOCKER_COMPOSE_PATH") else {
        bail!("The DOCKER_COMPOSE_PATH environment variable might not be set.")
    };
    // Set up new CKAN instance
    let compose = DockerCompose::with_local_client(&[docker_compose_path]).with_build(true);
    Ok(compose)
}

pub async fn get_service_port(compose: &DockerCompose, service: &str, port: u16) -> Result<u16> {
    Ok(compose
        .service(service)
        .unwrap()
        .get_host_port_ipv4(port)
        .await?)
}

pub fn assert_str_true(string: String) {
    assert_eq!(string, "true");
}

pub async fn jaq(command: &'static str, object: &serde_json::Value) -> Result<String> {
    Ok(duct_sh::sh(command)
        .stdin_bytes(serde_json::to_string(object)?)
        .read()?)
}

pub async fn jaq_dangerous(command: String, object: &serde_json::Value) -> Result<String> {
    Ok(duct_sh::sh_dangerous(command)
        .stdin_bytes(serde_json::to_string(object)?)
        .read()?)
}

pub async fn get_env_var(
    compose: &DockerCompose,
    service: String,
    env_var_name: String,
) -> Result<String> {
    let env_output = String::from_utf8(
        compose
            .service(service.as_str())
            .unwrap()
            .exec(ExecCommand::new(["env"]))
            .await?
            .stdout_to_vec()
            .await?,
    )?;
    for line in env_output.lines() {
        if line.starts_with(env_var_name.as_str()) {
            let env_var_vec: Vec<&str> = line.splitn(2, "=").collect();
            let env_var_value = env_var_vec.get(1).unwrap();
            return Ok(env_var_value.to_string());
        }
    }
    bail!("Could not find environment variable.");
}
