from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

import ckan.plugins.toolkit as tk
import geopandas as gpd
import sedonadb
from ckan import types
from ckan.lib.io import get_ckan_temp_directory
from ckan.lib.munge import munge_filename
from ckan.logic import ValidationError
from ckan.types import Context

from ..utils import gztr_json_file_as_dict
from ..views import stac_item_show
from . import schema

log = logging.getLogger(__name__)

@tk.validate_action_data(schema.spatial_full_with_geometry)
def gztr_spatial_full_with_geometry(context: types.Context, data_dict: dict[str, Any]) -> dict[str, Any]:
    """Provide the spatial_full value from a CKAN dataset's metadata to attempt filling null geometry values for features that have installed geospatial collections.
    
    :param spatial_full: GeoJSON
    :type spatial_full: str
    """
    try:
        spatial_full = json.loads(data_dict.get("spatial_full"))
        if spatial_full:
            collections = gztr_json_file_as_dict("collections.json")
            for feature in spatial_full["features"]:
                if feature.get("collection") != "Drawn features" and feature.get("geometry") is None and feature.get("collection") in [collection.get("id") for collection in collections if collection.get("id") is not None]:
                    feature["geometry"] = stac_item_show(feature.get("collection"), feature.get("id")).get_json().get("geometry")
        return json.dumps(spatial_full)
    except Exception:
        log.exception("Error while running gztr_spatial_full_with_geometry.")

# @tk.validate_action_data(schema.feature_batch_show)
# def gztr_feature_batch_item_show(context: types.Context, data_dict: dict[str, Any]) -> dict[str, Any]:
#     """Get a STAC ItemCollection of multiple STAC Items which can be from different STAC collections."""
# Takes a list of tuples
# [(collectionID, featureID)]
# or maybe instead a dictionary?
# {
#   collectionID: [featureID, featureID2, ...],
#   collectionID2: [featureID3, featureID4, ...]
# }

# def gztr_spatial_package_show
# Get the selected features data from package_show metadata by providing a package_id

# def gztr_geoconnex_dataset_jsonld
# Provide a dataset ID, get its Geoconnex-compatible JSON-LD
# Used by the bulk loader

# def gztr_geoconnex_location_jsonld
# Provide a collection ID, get its Geoconnex-compatible JSON-LD
# Used by the bulk loader

@tk.validate_action_data(schema.collection_create)
def gztr_collection_create(context: types.Context, data_dict: dict[str, Any]) -> dict[str, Any]:
    """Create a geospatial collection (stored as a GeoParquet file) from an uploaded GeoJSON file.

    Only sysadmins can create geospatial collections.

    For updating a collection, use file_delete from the file management API before running gztr_collection_create: <https://docs.ckan.org/en/latest/api/index.html#module-ckan.logic.action.file>

    :param name: human-readable name of the GeoParquet file, unique per storage.
        Defaults to using the munged filename of upload as the stem, suffixed by .parquet
    :type name: str, optional
    :param upload: content of the file as bytes, file descriptor or uploaded file
    :type upload: bytes | file |
        :py:class:`~werkqeug.datastructures.FileStorage` |
        :py:class:`~ckan.lib.files.Upload`

    :returns: file details.
    """
    tk.check_access("gztr_collection_create", context, data_dict)

    try:
        # Identify the Parquet file name
        upload = data_dict["upload"]
        geojson_filename = data_dict.get("name", upload.filename)
        if not geojson_filename:
            msg = "Name is missing and cannot be deduced from upload"
            raise ValidationError({"upload": [msg]})
        geojson_filename = munge_filename(geojson_filename)
        parquet_filename = Path(geojson_filename).stem + ".parquet"
        # Use Apache SedonaDB to convert from GeoJSON to an optimized GeoParquet
        sd = sedonadb.connect()
        gdf = gpd.read_file(upload, driver="GeoJSON")
        df = sd.create_data_frame(gdf)
        # Store the Parquet output in a temporary file then upload it then delete the temporary file
        ckan_temp_directory = get_ckan_temp_directory()
        temp_parquet_file = ckan_temp_directory + "/" + parquet_filename
        df.to_parquet(temp_parquet_file)
        with open(temp_parquet_file) as tpf:
            result = tk.get_action("file_create")(
                Context(context, ignore_auth=True),
                {"name": parquet_filename, "storage": "gztr", "upload": tpf},
            )
            os.remove(temp_parquet_file)
            return result
    except Exception as e:  # noqa: BLE001
        log.error("Error while running gztr_collection_create")
        log.error(e)
        return { "success": False, "message": "Internal server error, please contact this CKAN instance's system administrators for assistance."}
