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

    # IPackageController
    # def before_dataset_search(self, search_params):
    #     if toolkit.request and toolkit.request.path[0:8] == "/dataset":
    #         search_params.update(
    #             {"fq": "+dataset_type:dataset {}".format(search_params.get("fq"))}
    #         )

    #     # if toolkit.request and toolkit.request.path[0:13] == '/organization':
    #     # search_params.update({
    #     #'fq': '+dataset_type:dataset {}'.format( search_params.get('fq') )
    #     # })

    #     if toolkit.request and toolkit.request.path[0:6] == "/group":
    #         search_params.update(
    #             {"fq": "+dataset_type:dataset {}".format(search_params.get("fq"))}
    #         )

    #     return search_params

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
        try:
            spatial = pkg_dict.get("spatial")

            # spatial = gd.get("spatial")
            # place_keywords = gd.get("place_keywords")

            if spatial:
                geojson = json.loads(spatial)

                def shape_from_geometry(geometry):
                    try:
                        s = shape(geometry)
                        print(f"SHAPE: {shape}")
                    except Exception as e:
                        log.error("{}, not indexing :: {}".format(e, json.dumps(geometry)[:100]))
                        return None

                    return s

                geometry = shape_from_geometry(geojson)
                wkt = geometry.wkt
                print(f"WKT: {wkt}")
                pkg_dict["spatial"] = wkt
                pkg_dict.pop("spatial_full")

            # if place_keywords:
            #     pkg_dict["place_keywords"] = place_keywords.split(",")

        except (json.JSONDecodeError, AttributeError, IndexError, TypeError) as e:
            log.error(f"Error processing gazetteer data: {e}")

        # pkg_dict.pop("data_dict", None)
        # validated_data_dict = json.loads(pkg_dict.get("validated_data_dict", None))
        # validated_data_dict.pop("gazetteer", None)
        # pkg_dict["validated_data_dict"] = json.dumps(validated_data_dict)
        return pkg_dict

    def before_dataset_search(self, search_params):

        # search_backend = self._get_search_backend()
        # fq = search_params.get("fq", None)
        # if fq:
        #     if " statewide:\"true\"" not in search_params["fq"] and " statewide:\"false\"" not in search_params["fq"]:
        #         search_params["fq"] = search_params["fq"] + " -place_keywords:\"Texas\""
        #     if " statewide:\"true\"" in search_params["fq"]:
        #         search_params["fq"] = search_params["fq"].replace(" statewide:\"true\"", "")
        #         search_params["fq"] = search_params["fq"].replace(" -place_keywords:\"Texas\"", "")
        #     if " statewide:\"false\"" in search_params["fq"]:
        #         search_params["fq"] = search_params["fq"].replace(" statewide:\"false\"", " -place_keywords:\"Texas\"")

        input_bbox = search_params.get('extras', {}).get('ext_bbox', None)

        if input_bbox:
            bbox = self.normalize_bbox(input_bbox)

            if not bbox:
                raise SearchError('Wrong bounding box provided')
            # search_params = self.search_params(bbox, search_params)
        return search_params

    def after_dataset_search(self, search_results, search_params):
        # Get user drawn input bounding box value ext_bbox
        bbox = search_params.get('extras', {}).get('ext_bbox', None)
        # If the input bounding box value is provided by the user, normalize it
        if bbox:
            bbox = self.normalize_bbox(bbox)
            if not bbox:
                raise SearchError('Wrong bounding box provided')
            # Instantiate list for filtering datasets based on intersection with the drawn bounding box
            bbox_polygon = shapely.Polygon(((bbox["minx"], bbox["miny"]), (bbox["maxx"], bbox["miny"]), (bbox["maxx"], bbox["maxy"]), (bbox["minx"], bbox["maxy"]), (bbox["minx"], bbox["miny"])))
            filtered_search_results = [result for result in search_results.get("results") if result["spatial"] if shapely.intersection(shapely.from_geojson(result["spatial"]), bbox_polygon)]
            search_results.update(results=filtered_search_results)
            search_results.update(count=len(filtered_search_results))
        return search_results

    def search_params(self, bbox, search_params):

        bbox = self.fit_bbox(bbox)

        if not search_params.get("fq_list"):
            search_params["fq_list"] = []

        spatial_query = "{{!field f=spatial}}Intersects(ENVELOPE({minx}, {maxx}, {maxy}, {miny}))"

        search_params["fq_list"].append(
            spatial_query.format(spatial_field="spatial", **bbox)
        )

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

    def fit_bbox(self, bbox_dict):
        """
        Ensures that all coordinates in a bounding box
        fall within -180, -90, 180, 90 degrees

        Accepts a dict with the following keys:

        {
                "minx": -4.96,
                "miny": 55.70,
                "maxx": -3.78,
                "maxy": 56.43
            }

        """

        def _adjust_longitude(value):
            if value < -180 or value > 180:
                value = value % 360
                if value < -180:
                    value = 360 + value
                elif value > 180:
                    value = -360 + value
            return value

        def _adjust_latitude(value):
            if value < -90 or value > 90:
                value = value % 180
                if value < -90:
                    value = 180 + value
                elif value > 90:
                    value = -180 + value
            return value

        return {
            "minx": _adjust_longitude(bbox_dict["minx"]),
            "maxx": _adjust_longitude(bbox_dict["maxx"]),
            "miny": _adjust_latitude(bbox_dict["miny"]),
            "maxy": _adjust_latitude(bbox_dict["maxy"]),
        }

    # def after_dataset_create(self, context, pkg_dict):
    #     if pkg_dict["type"] != "showcase" and pkg_dict["type"] != "harvest":
    #         groups = []
    #         if isinstance(pkg_dict.get("group", []), list):
    #             groups = pkg_dict.get("group")
    #         else:
    #             groups = json.loads(pkg_dict.get("group"))
    #         if pkg_dict.get("group", []):
    #             for group in groups:
    #                 _add_to_group(context, group, pkg_dict["id"])

    #     _notify_admin(context, pkg_dict)

    # def after_dataset_update(self, context, pkg_dict):
    #     groups = []
    #     if pkg_dict["type"] != "showcase" and pkg_dict["type"] != "harvest":
    #         old_package = toolkit.get_action("package_show")(
    #             context, {"id": pkg_dict["id"]}
    #         )
    #         old_groups = [group.get("name") for group in old_package.get("groups")]
    #         current_groups = json.loads(pkg_dict.get("group", []))
    #         rm_groups = list(set(old_groups) - set(current_groups))
    #         if isinstance(pkg_dict.get("group", []), list):
    #             groups = pkg_dict.get("group")
    #         else:
    #             groups = json.loads(pkg_dict.get("group"))

    #         # if toolkit.get_endpoint()[0] in ['dataset', 'package']:
    #         for group in groups:
    #             _add_to_group(context, group, pkg_dict["id"])
    #         for group in rm_groups:
    #             _remove_from_group(context, group, pkg_dict["id"])

    #     _notify_admin(context, pkg_dict)
