import json
import logging
import os
from typing import Any

import ckan.plugins.toolkit as tk
import shapely
import tomli
from ckan import plugins
from shapely.geometry import shape

import ckanext.gztr.validators as gztr_validators

from .views import stac_item_show

log = logging.getLogger(__name__)

@tk.blanket.actions
@tk.blanket.auth_functions
@tk.blanket.blueprints
@tk.blanket.cli
@tk.blanket.helpers
class GZTRPlugin(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigDeclaration)
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IValidators)
    plugins.implements(plugins.IPackageController, inherit=True)
    plugins.implements(plugins.ITemplateHelpers)

    # IConfigDeclaration
    def declare_config_options(self, declaration: Any, key: Any):
        # 2. Programmatically load standard static declaration file
        here = os.path.dirname(__file__)
        with open(os.path.join(here, "config_declaration.toml"), "rb") as src:
            declaration.load_dict(tomli.load(src))

    # IConfigurer
    def update_config(self, config_):
        tk.add_template_directory(config_, "templates")
        tk.add_public_directory(config_, "public")
        tk.add_resource("assets", "ckanext-gztr")

    # IValidators
    def get_validators(self):
        return {
            # TODO: Check if this is still necessary from TWDH
            "gazetteer_validator": gztr_validators.gazetteer_validator,
        }

    def before_dataset_index(self, pkg_dict):

        def shape_from_geometry(geometry):
            """Attempt to create a Shapely-compatible shape based on a GeoJSON geometry."""
            try:
                s = shape(geometry)
            except Exception:
                log.exception("Error while attempting to convert geometry to Shapely shape.")
                return None

            return s

        try:
            # Try to get a simplified GeoJSON spatial from spatial_full
            spatial_full = pkg_dict.get("spatial_full")
            if spatial_full:
                # Get spatial_full which:
                # - Has null for geometry of selected features
                # - Has a geometry for drawn features (f.category == "Drawn features")
                # Therefore get each selected feature's GeoJSON from STAC
                spatial_full_geojson = json.loads(spatial_full)
                for idx, feature in enumerate(spatial_full_geojson["features"]):
                    if feature["collection"] != "Drawn features" and feature.get("geometry") is None:
                        collection_id = feature["collection"]
                        feature_id = feature["id"]
                        item_geojson = stac_item_show(collection_id, feature_id).get_json()
                        spatial_full_geojson["features"][idx]["geometry"] = item_geojson["geometry"]
                # Convert spatial GeoJSON to simplified WKT
                # Set the field spatial_geom in Solr index to the WKT value (to allow spatial search)
                all_geometries = [shape_from_geometry(feature.get("geometry")) for feature in spatial_full_geojson["features"] if feature.get("geometry")]
                all_geometries_union = shapely.union_all(all_geometries)
                # We attempt to ensure that spatial_geom is a WKT value within 32KB since Solr index has a max field value limit
                tolerance = 0.0001
                simplified_geometry = shapely.simplify(all_geometries_union, tolerance)
                while len(shape_from_geometry(simplified_geometry).wkt) > 30000:
                    tolerance += 0.001
                    simplified_geometry = shapely.simplify(all_geometries_union, tolerance)
                geometry = shape_from_geometry(simplified_geometry)
                wkt = geometry.wkt
                # Set dataset's spatial_geom value to WKT geometry in SOLR index (to allow spatial search)
                pkg_dict["spatial_geom"] = wkt
                # TODO: Add place keywords to index
                # Do not index unnecessary GeoJSON field
                pkg_dict.pop("spatial_full")
        except Exception:
            log.exception("Error processing gazetteer data in before_dataset_index.")

        return pkg_dict

    def before_dataset_search(self, search_params):
        if not search_params.get("fq_list"):
            search_params["fq_list"] = []

        # Add the spatial filter based on spatial_geom and the user's bounding box
        bbox = search_params.get('extras', {}).get('ext_bbox', None)
        if bbox:
            bbox = self.normalize_bbox(bbox)
            if not bbox:
                raise Exception('Wrong bounding box provided')  # noqa: TRY002
            minx = bbox["minx"]
            maxx = bbox["maxx"]
            maxy = bbox["maxy"]
            miny = bbox["miny"]
            spatial_filter = f"{{!field f=spatial_geom}}Intersects(ENVELOPE({minx}, {maxx}, {maxy}, {miny}))"
            search_params["fq_list"].append(spatial_filter)

        # Handle statewide extent toggle
        if search_params.get("fq"):
            if "statewide:\"yes\"" in search_params["fq"]:
                search_params["fq"] = search_params["fq"].replace("statewide:\"yes\"", "")
                search_params["fq_list"].append("+dataset_type:\"dataset\"")
            elif "statewide:\"no\"" in search_params["fq"]:
                search_params["fq"] = search_params["fq"].replace("statewide:\"no\"", "-place_keywords:\"New Mexico\"")
                search_params["fq_list"].append("+dataset_type:\"dataset\"")

        dataset_type = search_params.get('extras', {}).get('dataset_type', None)
        if dataset_type == "dataset":
            search_params["fq_list"].append("+dataset_type:\"dataset\"")

        return search_params

    def normalize_bbox(self, bbox_values):
        """
        Ensures a bbox is expressed in a standard dict

        bbox_values may be:
            a string: "-4.96,55.70,-3.78,56.43"
            or a list [-4.96, 55.70, -3.78, 56.43]
            or a list of strings ["-4.96", "55.70", "-3.78", "56.43"]

        ordered as MinX, MinY, MaxX, MaxY.

        Returns a dict with the keys:

        {
            "minx": -4.96,
            "miny": 55.70,
            "maxx": -3.78,
            "maxy": 56.43
        }

        If there are any problems parsing the input it returns None.
        """

        if isinstance(bbox_values, str):
            bbox_values = bbox_values.split(",")

        if len(bbox_values) != 4:
            return None

        try:
            bbox = {}
            bbox["minx"] = float(bbox_values[0])
            bbox["miny"] = float(bbox_values[1])
            bbox["maxx"] = float(bbox_values[2])
            bbox["maxy"] = float(bbox_values[3])
        except ValueError:
            return None

        return bbox
