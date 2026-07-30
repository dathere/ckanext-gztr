import json
import shapely
from shapely.geometry import shape


import ckan.plugins as plugins
import ckan.model as model
import ckan.plugins.toolkit as toolkit

import ckanext.gztr.helpers as gztr_helpers
import ckanext.gztr.storage as gztr_storage
import ckanext.gztr.validators as gztr_validators

import logging

log = logging.getLogger(__name__)


class GZTRPlugin(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IValidators)
    plugins.implements(plugins.IPackageController, inherit=True)
    plugins.implements(plugins.ITemplateHelpers)
    plugins.implements(plugins.IFiles, inherit=True)

    # IConfigurer
    def update_config(self, config_):
        toolkit.add_template_directory(config_, "templates")
        toolkit.add_public_directory(config_, "public")
        toolkit.add_resource("assets", "ckanext-gztr")

    # ITemplateHelpers
    def get_helpers(self):
        return {
            "dict_list_reduce_with_extras": gztr_helpers.dict_list_reduce_with_extras,
            "gztr_is_new": gztr_helpers.is_new,
            "add_tracking_to_dataset": gztr_helpers.add_tracking_to_dataset,
            "is_composite_field_populated": gztr_helpers.is_composite_field_populated,
            "gztr_scheming_groups_choices": gztr_helpers.scheming_groups_choices,
            "dynamic_help_text": gztr_helpers.dynamic_help_text,
        }

    # IFiles
    def files_get_storage_adapters(self):
        if gztr_storage.S3Storage is None:
            return {}

        return {"gztr:s3": gztr_storage.S3Storage}

    # IValidators
    def get_validators(self):
        return {
            "parse_date_range": gztr_validators.parse_date_range,
            "parse_date_range_optional": gztr_validators.parse_date_range_optional,
            "check_end_date": gztr_validators.check_end_date,
            "gazetteer_validator": gztr_validators.gazetteer_validator,
        }

    def before_dataset_index(self, pkg_dict):
        # If dataset has spatial data, add simplified WKT geometry to SOLR index
        try:
            spatial = pkg_dict.get("spatial")

            if spatial:
                geojson = json.loads(spatial)

                def shape_from_geometry(geometry):
                    try:
                        s = shape(geometry)
                    except Exception as e:
                        log.error("{}, not indexing :: {}".format(e, json.dumps(geometry)[:100]))
                        return None

                    return s

                geometry = shape_from_geometry(geojson)
                wkt = geometry.wkt
                # Set dataset's spatial_geom value to WKT geometry in SOLR index (to allow spatial search)
                pkg_dict["spatial_geom"] = wkt
                # Do not index unnecessary GeoJSON geometries
                pkg_dict.pop("spatial")
                pkg_dict.pop("spatial_full")

        except (json.JSONDecodeError, AttributeError, IndexError, TypeError) as e:
            log.error(f"Error processing gazetteer data: {e}")

        return pkg_dict

    def before_dataset_search(self, search_params):
        if not search_params.get("fq_list"):
            search_params["fq_list"] = []

        bbox = search_params.get('extras', {}).get('ext_bbox', None)
        if bbox:
            bbox = self.normalize_bbox(bbox)
            if not bbox:
                raise SearchError('Wrong bounding box provided')
            minx = bbox["minx"]
            maxx = bbox["maxx"]
            maxy = bbox["maxy"]
            miny = bbox["miny"]
            spatial_filter = f"{{!field f=spatial_geom}}Intersects(ENVELOPE({minx}, {maxx}, {maxy}, {miny}))"
            search_params["fq_list"].append(spatial_filter)

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
