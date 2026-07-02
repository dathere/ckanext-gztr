mod utils;

use crate::utils::get_compose;
use anyhow::Result;
use std::time::Duration;

#[tokio::test]
#[ignore = "Manual tests are long and should be enabled manually."]
async fn test_manual() -> Result<()> {
    let mut compose = get_compose().await?;
    compose.up().await?;

    cliclack::log::info("Sleeping for 300 seconds. Use CKAN within this timeframe.")?;

    tokio::time::sleep(Duration::from_secs(240)).await;
    cliclack::log::info("Stopping in 60 seconds.")?;
    tokio::time::sleep(Duration::from_secs(60)).await;

    Ok(())
}
