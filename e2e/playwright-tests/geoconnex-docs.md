# Geoconnex tests

There are a few steps specific to the Geoconnex tests that you need to follow first before running the Geoconnex test suite.

Once NMWDC has its update and everything is done production-wise then we could automate most if not all of these steps.

1. In your `docker-compose.dev.yml` file (e.g. `~/programming/gztrtests/gztr-docker-demo/docker-compose.dev.yml`), comment the line:

```
      - ./gztr-storage:/var/lib/ckan/storage/uploads/gztr
```

And instead add:

```
      - ./gztr-test-storage:/var/lib/ckan/storage/uploads/gztr
```

2. Add a `catalog.json` file and `collections.json` file to `gztr-test-storage`.

`catalog.json`:

```json
{
  "id": "demo",
  "stac_version": "1.1.0",
  "type": "Catalog",
  "title": "Demo STAC API",
  "description": "Geospatial collections used for dataset publishing and search on the demo CKAN instance.",
  "links": [
    {
      "href": "http://localhost:5000/gztr/stac",
      "rel": "self",
      "type": "application/json"
    },
    {
      "href": "http://localhost:5000/gztr/stac",
      "rel": "root",
      "type": "application/json"
    },
    {
      "href": "http://localhost:5000/gztr/stac/collections",
      "rel": "collections",
      "type": "application/json"
    },
    {
      "href": "http://localhost:5000/gztr/stac/collections/nm_state",
      "rel": "child",
      "type": "application/json",
      "title": "New Mexico"
    },
    {
      "href": "http://localhost:5000/gztr/stac/collections/nm_huc8_sub_basins",
      "rel": "child",
      "type": "application/json",
      "title": "HUC8 Sub-Basins"
    }
  ]
}
```

`collections.json`:

```json
[
  {
    "id": "nm_huc8_sub_basins",
    "type": "Collection",
    "stac_version": "1.1.0",
    "title": "HUC8 Sub-Basins",
    "description": "Hydrologic unit code 8 sub-basins intersecting with New Mexico",
    "license": "CC-BY-4.0",
    "links": [
      {
        "href": "http://localhost:5000/gztr/stac",
        "rel": "root",
        "type": "application/json"
      },
      {
        "href": "http://localhost:5000/gztr/stac/collections",
        "rel": "parent",
        "type": "application/json"
      },
      {
        "href": "http://localhost:5000/gztr/stac/collections/nm_huc8_sub_basins",
        "rel": "self",
        "type": "application/json"
      },
      {
        "href": "http://localhost:5000/gztr/stac/collections/nm_huc8_sub_basins/items",
        "rel": "items",
        "type": "application/geo+json"
      }
    ],
    "providers": [
      {
        "description":
        "An agency of the U.S. Department of the Interior. The USGS studies U.S. lands and resources and monitors, analyzes, and predicts Earth\u2019s changing systems while providing data for science.",
        "name": "U.S. Geological Survey",
        "roles": ["producer"],
        "url": "https://usgs.gov"
      },
      {
        "description": "The Internet of Water Coalition is a group of organizations working together with federal, state, and local government partners to build foundational water data infrastructure across the US and create a community of people and organizations using water data to make better decisions.",
        "name": "Internet of Water Coalition",
        "roles": ["licensor"],
        "url": "https://internetofwater.org"
      },
      {
        "description":
        "Operating out of the Lincoln Institute of Land Policy. CGS provides nonprofit geospatial solutions in various sector as a data solutions provider. Hosts the Geoconnex water data knowledge graph and Geoconnex reference collections API.",
        "name": "Center for Geospatial Solutions",
        "roles": ["processor", "licensor", "host"],
        "url": "https://cgsearth.org"
      }
    ]
  }
]
```

3. Add the `nm_huc8_sub_basins.parquet` file to the `gztr-test-storage` directory. Temporarily we provide this file at [mk-sb.dathere.com/storage/v1/object/public/ckanext-gztr-geoconnex/nm_huc8_sub_basins.parquet](https://mk-sb.dathere.com/storage/v1/object/public/ckanext-gztr-geoconnex/nm_huc8_sub_basins.parquet).

4. Run the following to begin the Geoconnex test suite:

```bash
python geoconnex.py
```
