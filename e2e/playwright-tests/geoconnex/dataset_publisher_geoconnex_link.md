# dataset_publisher_geoconnex_link

## User story

As a dataset publisher, when I'm using the dataset publisher gazetteer and see a geospatial feature that has `geoconnex_pid` in its `properties`, I can click the info icon button for that STAC item and then see a Geoconnex URI that is associated with this geospatial feature in the info popover that appears. I can copy the Geoconnex URI to my clipboard and also click the Geoconnex URL to open the Geoconnex web UI page for that reference feature on reference.geoconnex.us.

## How this test will work (watch it live!)

1. Login as a CKAN dataset publisher.
2. Go to the CKAN dataset creation page.
3. In the metadata form about the dataset, select a geospatial feature using ckanext-gztr's dataset publisher gazetteer. We'll select **Rio Grande-Albuquerque HUC8 Sub Basins**.
4. Click the info icon button for the geospatial feature which displays STAC item information such as the item ID.
5. Find the Geoconnex URI link and copy button. We'll click the Geoconnex URI link [geoconnex.us/ref/hu08/13020203](https://geoconnex.us/ref/hu08/13020203).
6. The corresponding Geoconnex reference feature page should open at reference.geoconnex.us.

Visit the terminal during/after the test to see whether the test ran successfully.
