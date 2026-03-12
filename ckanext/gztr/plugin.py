import json
import shapely
from shapely.geometry import shape


import ckan.plugins as plugins
import ckan.model as model
import ckan.plugins.toolkit as toolkit
from ckan.lib.dictization.model_dictize import extras_list_dictize

import ckanext.gztr.helpers as gztr_helpers
import ckanext.gztr.validators as gztr_validators

import logging

log = logging.getLogger(__name__)


def _add_to_group(context, group_id, pkg_id):
    try:
        group_dict = toolkit.get_action("group_show")(context, {"id": group_id})
    except toolkit.ObjectNotFound as e:
        log.error("Group not found: %s" % group_id)
        raise toolkit.ObjectNotFound
    data_dict = {
        "id": group_dict.get("id"),
        "object": pkg_id,
        "object_type": "package",
        "capacity": "public",
    }
    toolkit.get_action("member_create")(context, data_dict)


def _remove_from_group(context, group_id, pkg_id):
    try:
        group_dict = toolkit.get_action("group_show")(context, {"id": group_id})
    except toolkit.ObjectNotFound as e:
        log.error("Group not found: %s" % group_id)
        raise toolkit.ObjectNotFound
    data_dict = {
        "id": group_dict.get("id"),
        "object": pkg_id,
        "object_type": "package",
        "capacity": "public",
    }
    toolkit.get_action("member_delete")(context, data_dict)


def _notify_admin(context, pkg_dict):
    private = pkg_dict.get("private", True)
    state = pkg_dict.get("state", "draft")
    data_admin_approved = pkg_dict.get("data_admin_approved", False)

    if (not private) and state == "active" and (not data_admin_approved):
        log.info(
            "PROBLEM: Send urgent email to admins that UNAPPROVED DATASET IT PUBLIC"
        )

    elif (private) and state == "active" and (not data_admin_approved):
        log.info("NOTICE: Send email to admins that DATASET IT READY FOR AUDITING")

    log.info(
        "DATASET STATUS: Private: {private}, State: {state}, Approved: {approved}".format(
            private=private, state=state, approved=data_admin_approved
        )
    )


class GZTRPlugin(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IValidators)
    plugins.implements(plugins.IPackageController, inherit=True)
    plugins.implements(plugins.ITemplateHelpers)

    # IConfigurer

    def update_config(self, config_):
        toolkit.add_template_directory(config_, "templates")
        toolkit.add_public_directory(config_, "public")
        toolkit.add_resource("assets", "ckanext-gztr")

        # Danger: The following are overrides of what should be defined in ckan.ini
        #         Defining them here prevents custom schemas defined in ckan.ini from working

        #        config_['scheming.presets'] = """
        # ckanext.scheming:presets.json
        # ckanext.composite:presets.json
        # ckanext.gztr:schemas/presets.yaml
        # """

        #        config_['scheming.dataset_schemas'] = """
        # ckanext.gztr:schemas/dataset.yaml
        # """

        #        config_['scheming.organization_schemas'] = """
        # ckanext.gztr:schemas/organization.yaml
        # """

    def get_helpers(self):
        return {
            "dict_list_reduce_with_extras": gztr_helpers.dict_list_reduce_with_extras,
            "gztr_is_new": gztr_helpers.is_new,
            "add_tracking_to_dataset": gztr_helpers.add_tracking_to_dataset,
            "is_composite_field_populated": gztr_helpers.is_composite_field_populated,
            "gztr_scheming_groups_choices": gztr_helpers.scheming_groups_choices,
            "dynamic_help_text": gztr_helpers.dynamic_help_text,
        }

    # IValidators
    def get_validators(self):
        return {
            "parse_date_range": gztr_validators.parse_date_range,
            "parse_date_range_optional": gztr_validators.parse_date_range_optional,
            "check_end_date": gztr_validators.check_end_date,
            "gazetteer_validator": gztr_validators.gazetteer_validator,
        }

    def after_dataset_show(self, context, pkg_dict):
        if not pkg_dict.get("extras"):
            extras = (
                model.Session.query(model.PackageExtra)
                .filter_by(package_id=context["package"].id)
                .all()
            )
            extras_dict = extras_list_dictize(extras, context)
            if extras_dict:
                for ed in extras_dict:
                    if ed.get("key") == "gazetteer":
                        pkg_dict["gazetteer"] = json.loads(ed.get("value"))

            return pkg_dict

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
