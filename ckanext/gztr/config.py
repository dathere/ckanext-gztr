from __future__ import annotations

import ckan.plugins.toolkit as tk


def dataset_publisher_gazetteer_config() -> dict:
    """Returns all relevant configuration entries for the dataset publisher gazetteer."""
    config = {}
    TILES_URL = "ckanext.gztr.dataset_publisher.tiles_url"
    config[TILES_URL] = tk.config.get(TILES_URL)
    DEFAULT_LATITUDE = "ckanext.gztr.dataset_publisher.default_latitude"
    config[DEFAULT_LATITUDE] = float(tk.config.get(DEFAULT_LATITUDE, 34.307144))
    DEFAULT_LONGITUDE = "ckanext.gztr.dataset_publisher.default_longitude"
    config[DEFAULT_LONGITUDE] = float(tk.config.get(DEFAULT_LONGITUDE, -106.018066))
    DEFAULT_ZOOM = "ckanext.gztr.dataset_publisher.default_zoom"
    config[DEFAULT_ZOOM] = int(tk.config.get(DEFAULT_ZOOM, 5))
    MAX_BOUNDS = "ckanext.gztr.dataset_publisher.max_bounds"
    config[MAX_BOUNDS] = tk.config.get(MAX_BOUNDS)
    DISABLE_ADDRESS_SEARCH = "ckanext.gztr.dataset_publisher.disable_address_search"
    if tk.config.get(DISABLE_ADDRESS_SEARCH) == True:
        config[DISABLE_ADDRESS_SEARCH] = True
    else:
        config[DISABLE_ADDRESS_SEARCH] = False
    ENABLE_STAC_COLLECTION_JSON_BUTTON = (
        "ckanext.gztr.dataset_publisher.enable_stac_collection_json_button"
    )
    if tk.config.get(ENABLE_STAC_COLLECTION_JSON_BUTTON) == True:
        config[ENABLE_STAC_COLLECTION_JSON_BUTTON] = True
    else:
        config[ENABLE_STAC_COLLECTION_JSON_BUTTON] = False
    ENABLE_STAC_COLLECTION_DOWNLOAD_BUTTON = (
        "ckanext.gztr.dataset_publisher.enable_stac_collection_download_button"
    )
    if tk.config.get(ENABLE_STAC_COLLECTION_DOWNLOAD_BUTTON) == True:
        config[ENABLE_STAC_COLLECTION_DOWNLOAD_BUTTON] = True
    else:
        config[ENABLE_STAC_COLLECTION_DOWNLOAD_BUTTON] = False
    DISABLE_DRAWN_FEATURES = "ckanext.gztr.dataset_publisher.disable_drawn_features"
    if tk.config.get(DISABLE_DRAWN_FEATURES) == True:
        config[DISABLE_DRAWN_FEATURES] = True
    else:
        config[DISABLE_DRAWN_FEATURES] = False
    DIALOG_MAP_HEIGHT = "ckanext.gztr.dataset_publisher.dialog_map_height"
    config[DIALOG_MAP_HEIGHT] = tk.config.get(DIALOG_MAP_HEIGHT, "60vh")
    DISABLE_DUCKDB_ENGINE = "ckanext.gztr.dataset_publisher.disable_duckdb_engine"
    if tk.config.get(DISABLE_DUCKDB_ENGINE) == True:
        config[DISABLE_DUCKDB_ENGINE] = True
    else:
        config[DISABLE_DUCKDB_ENGINE] = False
    return config


def public_search_gazetteer_config() -> dict:
    """Returns all relevant configuration entries for the public search gazetteer."""
    config = {}
    DEFAULT_LATITUDE = "ckanext.gztr.public_search.default_latitude"
    config[DEFAULT_LATITUDE] = float(tk.config.get(DEFAULT_LATITUDE, 34.0))
    DEFAULT_LONGITUDE = "ckanext.gztr.public_search.default_longitude"
    config[DEFAULT_LONGITUDE] = float(tk.config.get(DEFAULT_LONGITUDE, -106.018066))
    DEFAULT_ZOOM = "ckanext.gztr.public_search.default_zoom"
    config[DEFAULT_ZOOM] = int(tk.config.get(DEFAULT_ZOOM, 5))
    TILES_URL = "ckanext.gztr.public_search.tiles_url"
    config[TILES_URL] = tk.config.get(TILES_URL)

    DISABLE_ADDRESS_SEARCH = "ckanext.gztr.public_search.disable_address_search"
    if tk.config.get(DISABLE_ADDRESS_SEARCH) == True:
        config[DISABLE_ADDRESS_SEARCH] = True
    else:
        config[DISABLE_ADDRESS_SEARCH] = False
    ENABLE_STAC_COLLECTION_JSON_BUTTON = (
        "ckanext.gztr.public_search.enable_stac_collection_json_button"
    )
    if tk.config.get(ENABLE_STAC_COLLECTION_JSON_BUTTON) == True:
        config[ENABLE_STAC_COLLECTION_JSON_BUTTON] = True
    else:
        config[ENABLE_STAC_COLLECTION_JSON_BUTTON] = False
    ENABLE_STAC_COLLECTION_DOWNLOAD_BUTTON = (
        "ckanext.gztr.public_search.enable_stac_collection_download_button"
    )
    if tk.config.get(ENABLE_STAC_COLLECTION_DOWNLOAD_BUTTON) == True:
        config[ENABLE_STAC_COLLECTION_DOWNLOAD_BUTTON] = True
    else:
        config[ENABLE_STAC_COLLECTION_DOWNLOAD_BUTTON] = False
    return config


def public_search_minimap_config() -> dict:
    """Returns all relevant configuration entries for public search result minimaps."""
    config = {}
    TILES_URL = "ckanext.gztr.public_search_minimap.tiles_url"
    config[TILES_URL] = tk.config.get(TILES_URL)
    TILES_TYPE = "ckanext.gztr.public_search_minimap.tiles_type"
    config[TILES_TYPE] = tk.config.get(TILES_TYPE)
    ATTRIBUTION_HTML = "ckanext.gztr.public_search_minimap.attribution_html"
    config[ATTRIBUTION_HTML] = tk.config.get(ATTRIBUTION_HTML)
    MAX_BOUNDS = "ckanext.gztr.public_search_minimap.max_bounds"
    config[MAX_BOUNDS] = tk.config.get(MAX_BOUNDS)
    MAX_ZOOM = "ckanext.gztr.public_search_minimap.max_zoom"
    config[MAX_ZOOM] = int(tk.config.get(MAX_ZOOM)) if tk.config.get(MAX_ZOOM) else 10
    return config


def geoconnex_config() -> dict:
    """Returns all relevant configuration entries for the Geoconnex integration."""
    config = {}
    GEOCONNEX_ENABLED = "ckanext.gztr.geoconnex.enabled"
    if tk.config.get(GEOCONNEX_ENABLED) == True:
        config[GEOCONNEX_ENABLED] = True
    else:
        config[GEOCONNEX_ENABLED] = False
    GEOCONNEX_NAMESPACE = "ckanext.gztr.geoconnex.namespace"
    config[GEOCONNEX_NAMESPACE] = tk.config.get(GEOCONNEX_NAMESPACE)
    GEOCONNEX_ENABLE_DATASET_JSONLD = "ckanext.gztr.geoconnex.enable_dataset_jsonld"
    if tk.config.get(GEOCONNEX_ENABLE_DATASET_JSONLD) == True:
        config[GEOCONNEX_ENABLE_DATASET_JSONLD] = True
    else:
        config[GEOCONNEX_ENABLE_DATASET_JSONLD] = False
    return config
