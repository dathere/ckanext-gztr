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

def _resolve_feature_ref(feature: dict[str, Any], collection_ids: list[str]) -> tuple[str | None, str | None]:
    """Work out which STAC Collection and Item a spatial_full feature refers to.

    Current features carry a top-level ``collection`` (the Collection id) and ``id``. Datasets
    saved by earlier versions of the gazetteer instead nest the whole legacy config.json entry
    under ``properties.collection``, identified by its ``location`` (e.g. "nm_counties.geojson"
    -> collection id "nm_counties"). Those features have no geometry of their own, so without
    this mapping they stay geometry-less and every consumer -- the dataset card thumbnail, the
    landing page preview -- ends up with an empty GeoJSON layer.
    """
    collection = feature.get("collection")
    feature_id = feature.get("id")

    if collection is None:
        legacy = (feature.get("properties") or {}).get("collection")
        if isinstance(legacy, dict):
            location = (legacy.get("properties") or legacy).get("location")
            if location:
                collection = Path(location).stem

    if collection is not None and collection not in collection_ids and collection != "Drawn features":
        return None, None

    # stac_item_show compares the id as a quoted SQL literal, so it must be a string.
    return collection, None if feature_id is None else str(feature_id)


@tk.validate_action_data(schema.spatial_full_with_geometry)
def gztr_spatial_full_with_geometry(context: types.Context, data_dict: dict[str, Any]) -> dict[str, Any]:
    """Provide the spatial_full value from a CKAN dataset's metadata to attempt filling null geometry values for features that have installed geospatial collections.
    
    :param spatial_full: GeoJSON
    :type spatial_full: str
    """
    try:
        spatial_full = data_dict.get("spatial_full")
        if spatial_full:
            collections = gztr_json_file_as_dict("collections.json")
            collection_ids = [c.get("id") for c in collections if c.get("id") is not None]
            for feature in spatial_full["features"]:
                if feature.get("geometry") is not None:
                    continue
                collection_id, feature_id = _resolve_feature_ref(feature, collection_ids)
                if collection_id is None or collection_id == "Drawn features" or feature_id is None:
                    continue
                feature["geometry"] = stac_item_show(collection_id, feature_id).get_json().get("geometry")
        return json.dumps(spatial_full)
    except Exception:
        log.exception("Error while running gztr_spatial_full_with_geometry.")
        return None

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
