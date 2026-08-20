from __future__ import annotations

import ckan.plugins.toolkit as tk

DEFAULT_LATITUDE = "ckanext.gztr.default_latitude"
DEFAULT_LONGITUDE = "ckanext.gztr.default_longitude"
DEFAULT_ZOOM = "ckanext.gztr.default_longitude"
MAP_TILE_SERVER = "ckanext.gztr.map_tile_server"

def dataset_publisher_widget_config() -> dict:
    """Returns all relevant configuration entries for the dataset publisher gazetteer widget."""
    config = {}
    config[DEFAULT_LATITUDE] = float(tk.config[DEFAULT_LATITUDE])
    config[DEFAULT_LONGITUDE] = float(tk.config[DEFAULT_LONGITUDE])
    config[DEFAULT_ZOOM] = tk.config[DEFAULT_ZOOM]
    return config

def public_search_widget_config() -> dict:
    """Returns all relevant configuration entries for the public search gazetteer widget."""
    config = {}
    config[DEFAULT_LATITUDE] = float(tk.config[DEFAULT_LATITUDE])
    config[DEFAULT_LONGITUDE] = float(tk.config[DEFAULT_LONGITUDE])
    config[DEFAULT_ZOOM] = tk.config[DEFAULT_ZOOM]
    config[MAP_TILE_SERVER] = tk.config[MAP_TILE_SERVER]
    return config
