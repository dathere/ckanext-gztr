use std::io::Write;

use anyhow::Result;
use ckanaction::CKAN;

mod utils;

use tempfile::NamedTempFile;
use utils::{get_ckan_service_name, get_service_port};

use crate::utils::get_override_compose;

// When a dataset publisher publishes a CKAN dataset by filling out the metadata form,
// the corresponding Geoconnex-compatible JSON-LD for the CKAN dataset is constructed and made available
// in the header of the CKAN dataset's landing page when ckanext.gztr.geoconnex.enable_dataset_jsonld is enabled.
#[ignore]
#[tokio::test]
async fn test_user_story_geoconnex_dataset_landing_page_jsonld() -> Result<()> {
    // Enable Geoconnex features with temporary override Docker Compose file
    let override_compose_content = format!(
        r#"
    services:
      ckan-dev:
        ports:
          - "0.0.0.0:5000:5000"
        environment:
          CKAN_PORT_HOST: 5000
          CKAN_SITE_URL: http://localhost:5000
          # == ckanext-gztr | Geoconnex options (more info at https://gztr.dathere.com/docs/geoconnex-integration) ==
          CKANEXT__GZTR__GEOCONNEX__ENABLED: true
          # The namespace that should exist in the namespaces/bulk/ckan directory at https://github.com/internetofwater/geoconnex.us
          CKANEXT__GZTR__GEOCONNEX__NAMESPACE: ckanext_gztr_e2e_test
          # Embeds Geoconnex-compatible JSON-LD within each compatible CKAN dataset's landing page
          CKANEXT__GZTR__GEOCONNEX__ENABLE_DATASET_JSONLD: true
"#
    );
    let mut override_compose_file = NamedTempFile::new()?;
    override_compose_file.write_all(override_compose_content.as_bytes())?;
    let override_compose_path = override_compose_file.path().to_string_lossy().to_string();
    let mut compose = get_override_compose(override_compose_path).await?;
    compose.up().await?;
    let ckan_port = get_service_port(&compose, get_ckan_service_name(), 5000).await?;
    let ckan = CKAN::builder()
        .url(format!("http://localhost:{ckan_port}").as_str())
        .build();
    // TODO: STAC catalog.json and collections.json files should point to this CKAN container's port,
    // so we may need to copy default files from content and then modify the href values.

    // Simulate a dataset publisher filling out the form
    // using the dataset publisher gazetteer to select Geoconnex reference features
    // and publishing the dataset.
    // Verify on CKAN dataset's landing page that the JSON-LD exists.
    // Validate JSON-LD is Geoconnex-compatible by running against nabu SHACL validator tool.
    duct_sh::sh("pnpm testui playwright/geoconnex/dataset_landing_page_jsonld.spec.ts")
        .env("CKAN_PORT", ckan_port.to_string())
        .run()?;
    Ok(())
}
// When a dataset publisher publishes a CKAN dataset by filling out the metadata form,
// the corresponding Geoconnex-compatible JSON-LD for the CKAN dataset can be constructed
// from the /api/3/action/gztr_geoconnex_dataset_jsonld API endpoint which is then
// used by ckan_geoconnex_bulk_runner to load the CKAN dataset into Geoconnex with a newly minted PID.

// When a dataset publisher deletes a CKAN dataset then the output with that CKAN dataset's id
// from the /api/3/action/gztr_geoconnex_dataset_jsonld is erroneous, therefore
// not being included when the API endpoint is ran in ckan_geoconnex_bulk_runner and therefore
// the CKAN dataset is not included in the Geoconnex knowledge graph when ckan_geoconnex_bulk_runner runs.

// When a dataset publisher edits the metadata field for a dataset and uses the dataset publisher gazetteer,
// the dataset publisher can select a reference feature(s) which is in sync with reference features provided by Geoconnex.
// In doing so, the reference feature's Geoconnex URI is added to the Geoconnex-compatible JSON-LD in the about entry
// as part of a list, which can be verified from /api/3/action/gztr_geoconnex_dataset_jsonld.

// When a dataset publisher edits the metadata field for a dataset and uses the dataset publisher gazetteer,
// the dataset publisher can select reference features which are *not* in sync with reference features provided by Geoconnex.
// These could be custom features provided by sysadmins as a STAC collection(s) which can be contributed as location-oriented
// web resources to the Geoconnex knowledge graph from the /api/3/action/gztr_geoconnex_location_jsonld API endpoint.

// When a public user uses the public search gazetteer for a CKAN site then they can select a feature collection that is
// in sync with the Geoconnex reference features at reference.geoconnex.us or any custom feature collections.

// When a dataset publisher explores a STAC item's information popover where the STAC item has `geoconnex_pid` in its
// `properties`, then the dataset publisher can click the Geoconnex URI to open the corresponding Geoconnex reference feature's
// page on reference.geoconnex.us.
