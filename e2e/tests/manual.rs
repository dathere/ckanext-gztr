mod utils;

use crate::utils::get_compose;
use anyhow::Result;
use std::time::Duration;

#[tokio::test]
#[ignore = "Too long, enable manually."]
async fn test_manual() -> Result<()> {

    cliclack::log::info("Starting Docker Compose. This usually takes about 100 seconds...")?;
    let mut compose = get_compose().await?;
    compose.up().await?;

    cliclack::log::success("CKAN should be running now or soon at: http://localhost:5000")?;

    cliclack::log::info(
        "Docker compose started. Sleeping this test for 58 minutes. Use CKAN within this timeframe.",
    )?;

    tokio::time::sleep(Duration::from_mins(58)).await;
    cliclack::log::info("Stopping CKAN compose stack in 120 seconds.")?;
    tokio::time::sleep(Duration::from_secs(120)).await;

    Ok(())
}
