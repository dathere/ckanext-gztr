# dataset_landing_page_jsonld (test 1/3)

## User story

As a **CKAN dataset publisher**, I can select a geospatial feature using the dataset publisher gazetteer from the ckanext-gztr CKAN extension. If this geospatial feature has `geoconnex_pid` in its `properties`, where `geoconnex_pid` is the URL to a Geoconnex reference feature, then when I publish this CKAN dataset the CKAN dataset's landing page should have embedded in it Geoconnex-compliant JSON-LD.

## How this test will work (watch it live!)

1. Login as a CKAN dataset publisher.
2. Go to the CKAN dataset creation page.
3. Enter the following details in the metadata form about the dataset:

- Title: **Dataset about Rio Grande-Albuquerque HUC8 Sub Basin**
- URL suffix: **dataset-about-rio-grande-albuquerque-huc8-sub-basin**
- Select a geospatial feature using ckanext-gztr's dataset publisher gazetteer:
  - **Rio Grande-Albuquerque HUC8 Sub Basins** [geoconnex.us/ref/hu08/13020203](https://geoconnex.us/ref/hu08/13020203)
4. Publish the CKAN dataset with a random URL as the associated CKAN resource
5. Read the HTML of the CKAN dataset's landing page with the BeautifulSoup4 Python library and find the `<script type="application/ld+json">` element with the JSON-LD as its text value
6. **Run `docker run internetofwater/nabu:latest shacl validate (JSON-LD string here)` to validate the embedded JSON-LD** from the CKAN dataset's landing page, asserting a `0` exit code which means success.

Visit the terminal during/after the test to view the JSON-LD and whether the test ran successfully.
