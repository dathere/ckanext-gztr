# ckanext-gztr

This extension adds **interactive gazetteer maps** when adding a new dataset to a CKAN instance and searching for datasets by location.

Visit [gztr.dathere.com](https://gztr.dathere.com) to learn how to install, use, and customize ckanext-gztr for your CKAN instance.

## Features

### Associate CKAN datasets with map features

Users can select a geographic feature(s) or draw polygons to associate a dataset with the selected feature(s).

![ckanext-gztr demo](https://github.com/user-attachments/assets/8b8041b2-2faf-4bd9-9b67-b3e1868b3148)

List of primary features in the data curator gazetteer:

- Interactive gazetteer map using MapLibre GL JS
- Zoom in/out functionality and zoom to "home"
- Draw and edit polygons as custom features
- Preview preset features on the map and select/deselect a feature by clicking the feature on the map followed by a popup
- Search and have the map "fly to" an address or view more results and "fly to" them
- "Fly to" your selected features by clicking on the feature label's magnifying glass or remove the feature with the X icon

### Filter by location by drawing a bounding box

Public users can then search for relevant datasets by location by drawing a bounding box on a public interactive map.

![public-bounding-box-search-demo](https://github.com/user-attachments/assets/8277fb04-199e-44f3-ace8-049eb2904a67)

List of primary features in the public user gazetteer:

- Interactive gazetteer map using MapLibre GL J
- Draw a bounding box on the map to filter datasets by location (based on geospatial intersection between drawn bounding box and simplified dataset GeoJSON)
- Search and have the map "fly to" an address or view more results and "fly to" them
- Preview preset features on the map and click a feature to view a popup with more information about that feature
- Mini map on the datasets page which can show the user's drawn bounding box along with a "Clear" button when a user has drawn a bounding box
