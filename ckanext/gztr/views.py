from __future__ import annotations

import io
import json
import logging
import tempfile

import ckan.plugins.toolkit as tk
import sedonadb
from ckan.lib.files import get_storage
from ckan.lib.io import get_ckan_temp_directory
from ckan.types import Response
from flask import Blueprint, request
from flask.json import jsonify

from .utils import gztr_get_collection, gztr_json_file_as_dict

log = logging.getLogger(__name__)
bp = Blueprint("gztr", __name__)

@bp.route("/gztr/stac", strict_slashes=False)
def stac() -> Response:
    """Returns a STAC Catalog for the CKAN instance's geospatial data used by ckanext-gztr."""
    try:
        root_catalog = gztr_json_file_as_dict("catalog.json")
    except Exception:
        log.exception("Error while running /gztr/stac endpoint")
        return tk.abort(500, "Internal server error")

    return jsonify(root_catalog)

@bp.route("/gztr/stac/collections", strict_slashes=False)
def stac_collection_list() -> Response:
    """Returns a list of STAC Collections for the CKAN instance's geospatial data used by ckanext-gztr."""
    try:
        collections = gztr_json_file_as_dict("collections.json")
    except Exception:
        log.exception("Error while running /gztr/stac/collections endpoint")
        return tk.abort(500, "Internal server error")

    return jsonify(collections)

@bp.route("/gztr/stac/collections/<collection_id>", strict_slashes=False)
def stac_collection_show(collection_id: str) -> Response:
    """Returns single Collection JSON"""
    try:
        collection = gztr_get_collection(collection_id)
    except Exception:
        log.exception(f"Error while running /gztr/stac/collections/{collection_id} endpoint")
        return tk.abort(500, "Internal server error")

    return jsonify(collection)

@bp.route("/gztr/stac/collections/<collection_id>/items", strict_slashes=False)
def stac_item_list(collection_id: str) -> Response:
    """GeoJSON FeatureCollection-conformant entity of Item objects in collection"""
    try:
        # Read the collection GeoJSON file data from the gztr storage
        gztr_storage = get_storage("gztr")
        # Load {collection_id}.parquet file into Apache SedonaDB dataframe and label the view as collection
        location = f"{collection_id}.parquet"
        parquet_file_info = gztr_storage.analyze(location)
        parquet_file_bytes = gztr_storage.content(parquet_file_info)
        ckan_temp_directory = get_ckan_temp_directory()
        parquet_tempfile = tempfile.NamedTemporaryFile(dir=ckan_temp_directory, suffix=".parquet")  # noqa: SIM115
        with open(parquet_tempfile.name, "wb") as f:
            f.write(parquet_file_bytes)
            f.seek(0)
        with open(parquet_tempfile.name) as f:
            sd = sedonadb.connect()
            df = sd.read_parquet(f.name)
            df.to_view("item")
            buffer = io.BytesIO()
            fields_query_param = request.args.get("fields", None)
            columns_to_query = "*"
            if fields_query_param and "-geometry" in fields_query_param.split(","):
                columns_to_query = ",".join([col for col in df.columns if col != "geometry"])
            df = sd.sql(f"""
            SELECT {columns_to_query}, [ST_XMIN(geometry), ST_YMIN(geometry), ST_XMAX(geometry), ST_YMAX(geometry)] as bbox FROM item
            """)
            df.to_pyogrio(buffer, driver="GeoJSON", geometry_name="geometry" if "geometry" in columns_to_query else None)
            output = io.TextIOWrapper(buffer, encoding="utf-8").read()
            collection_items = json.loads(output)
            del collection_items["name"]
            if collection_items.get("crs"):
                del collection_items["crs"]
            for feature in collection_items["features"]:
                feature["stac_version"] = "1.1.0"
                # The id from original GeoJSON is prioritized by properties.id and if that doesn't exist then id is moved to properties
                feature["id"] = feature["properties"]["id"]
                feature["bbox"] = feature["properties"]["bbox"]
                feature["collection"] = collection_id
                feature["links"] = [
                    {
                        # TODO: id should already be available at the top-level for each Item, not specifically in properties
                        "href": f"http://localhost:5000/gztr/stac/collections/{collection_id}/items/{feature['properties']['id']}",
                        "rel": "self",
                        "type": "application/json"
                    },
                    {
                        "href": f"http://localhost:5000/gztr/stac/collections/{collection_id}",
                        "rel": "collection",
                        "type": "application/json"
                    }
                ]
    except Exception:
        log.exception(f"Error while running /gztr/stac/collections/{collection_id}/items endpoint")
        return tk.abort(500, "Internal server error")

    return jsonify(collection_items)

# Returns single Item (GeoJSON Feature).
@bp.route("/gztr/stac/collections/<collection_id>/items/<item_id>", strict_slashes=False)
def stac_item_show(collection_id: str, item_id: str) -> Response:
    try:
        # Read the collection GeoJSON file data from the gztr storage
        gztr_storage = get_storage("gztr")
        # Load {collection_id}.parquet file into Apache SedonaDB dataframe and label the view as collection
        location = f"{collection_id}.parquet"
        parquet_file_info = gztr_storage.analyze(location)
        parquet_file_bytes = gztr_storage.content(parquet_file_info)
        ckan_temp_directory = get_ckan_temp_directory()
        parquet_tempfile = tempfile.NamedTemporaryFile(dir=ckan_temp_directory, suffix=".parquet")  # noqa: SIM115
        with open(parquet_tempfile.name, "wb") as f:
            f.write(parquet_file_bytes)
            f.seek(0)
        with open(parquet_tempfile.name) as f:
            sd = sedonadb.connect()
            df = sd.read_parquet(f.name)
            df.to_view("item")
            buffer = io.BytesIO()
            df = sd.sql(f"""
            SELECT *, [ST_XMIN(geometry), ST_YMIN(geometry), ST_XMAX(geometry), ST_YMAX(geometry)] as bbox FROM item WHERE item.id = '{item_id}'
            """)
            if df.count() > 1:
                log.error(f"Found more than one feature with the same ID {item_id} when IDs should be unique in Collection with ID {collection_id}.")
                return tk.abort(500, "Internal server error")
            df.to_pyogrio(buffer, driver="GeoJSON")
            output = io.TextIOWrapper(buffer, encoding="utf-8").read()
            item = json.loads(output)["features"][0]
            item["stac_version"] = "1.1.0"
            item["id"] = item["properties"]["id"]
            item["collection"] = collection_id
            item["bbox"] = item["properties"]["bbox"]
            item["links"] = [
                {
                    "href": f"http://localhost:5000/gztr/stac/collections/{collection_id}/items/{item_id}",
                    "rel": "self",
                    "type": "application/json"
                },
                {
                    "href": f"http://localhost:5000/gztr/stac/collections/{collection_id}",
                    "rel": "collection",
                    "type": "application/json"
                }
            ]
    except Exception:
        log.exception(f"Error while running /gztr/stac/collections/{collection_id}/items/{item_id} endpoint")
        return tk.abort(500, "Internal server error")

    return jsonify(item)
