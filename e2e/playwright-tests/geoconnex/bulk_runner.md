# bulk_runner (test 2/3)

## User story

This test directly runs the bulk runner from [github.com/dathere/ckan_geoconnex_bulk_runner](https://github.com/dathere/ckan_geoconnex_bulk_runner) in a temporary directory against your local CKAN instance at `http://localhost:5000`. This test is for programmatic access to the Geoconnex-compatible JSON-LD for a CKAN dataset through the CKAN Action API. We've added a new CKAN Action API endpoint with the ckanext-gztr CKAN extension at `/api/3/action/gztr_geoconnex_dataset_jsonld`, which returns the Geoconnex-compatible JSON-LD for a CKAN dataset given its `id`. This API endpoint is currently implemented by accessing it through an HTTP POST request. So long as a CKAN instance allows external origins with its CORS configuration, and/or a credential is provided to bypass a proxy (e.g. the Cloudflare proxy for NMWDC) by providing it in the header, the API endpoint can be called programatically. We verify this API endpoint works by running the bulk runner, which should output the JSON-LD of the CKAN dataset "**Dataset about Rio Grande-Albuquerque HUC8 Sub Basin**" and the bulk runner also validates the JSON-LD output with nabu using `docker run internetofwater/nabu:latest shacl validate (JSON-LD string here)`.

## How this test will work

This will run in your terminal!

1. Clone the bulk runner to a temporary directory.
2. Run the `generate_release` crate in the bulk runner using release mode against your CKAN instance at `http://localhost:5000`.
3. You should see the JSON-LD output for the CKAN dataset along with the nabu Go CLI SHACL validator mentioning "Data conforms to SHACL shape".
