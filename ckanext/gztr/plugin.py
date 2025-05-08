import json
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
    def before_dataset_search(self, search_params):
        if toolkit.request and toolkit.request.path[0:8] == "/dataset":
            search_params.update(
                {"fq": "+dataset_type:dataset {}".format(search_params.get("fq"))}
            )

        # if toolkit.request and toolkit.request.path[0:13] == '/organization':
        # search_params.update({
        #'fq': '+dataset_type:dataset {}'.format( search_params.get('fq') )
        # })

        if toolkit.request and toolkit.request.path[0:6] == "/group":
            search_params.update(
                {"fq": "+dataset_type:dataset {}".format(search_params.get("fq"))}
            )

        return search_params

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
        if pkg_dict.get("gazetteer"):
            try:
                gd = json.loads(pkg_dict.pop("gazetteer"))

                spatial_simp = gd.get("spatial_simp")
                place_keywords = gd.get("place_keywords")

                if spatial_simp:
                    geojson = json.loads(spatial_simp)

                    if geojson.get("type") == "Feature":
                        feature = geojson
                    else:
                        feature = geojson.get("features", [{}])[0]

                    geometry = shape(feature.get("geometry", {}))
                    wkt = geometry.wkt
                    pkg_dict["spatial_simp"] = wkt

                if place_keywords:
                    pkg_dict["place_keywords"] = place_keywords.split(",")

            except (json.JSONDecodeError, AttributeError, IndexError, TypeError) as e:
                log.error(f"Error processing gazetteer data: {e}")

        pkg_dict.pop("data_dict", None)
        validated_data_dict = json.loads(pkg_dict.get("validated_data_dict", None))
        validated_data_dict.pop("gazetteer", None)
        pkg_dict["validated_data_dict"] = json.dumps(validated_data_dict)
        return pkg_dict

    def after_dataset_create(self, context, pkg_dict):
        if pkg_dict["type"] != "showcase" and pkg_dict["type"] != "harvest":
            groups = []
            if isinstance(pkg_dict.get("group", []), list):
                groups = pkg_dict.get("group")
            else:
                groups = json.loads(pkg_dict.get("group"))
            if pkg_dict.get("group", []):
                for group in groups:
                    _add_to_group(context, group, pkg_dict["id"])

        _notify_admin(context, pkg_dict)

    def after_dataset_update(self, context, pkg_dict):
        groups = []
        if pkg_dict["type"] != "showcase" and pkg_dict["type"] != "harvest":
            old_package = toolkit.get_action("package_show")(
                context, {"id": pkg_dict["id"]}
            )
            old_groups = [group.get("name") for group in old_package.get("groups")]
            current_groups = json.loads(pkg_dict.get("group", []))
            rm_groups = list(set(old_groups) - set(current_groups))
            if isinstance(pkg_dict.get("group", []), list):
                groups = pkg_dict.get("group")
            else:
                groups = json.loads(pkg_dict.get("group"))

            # if toolkit.get_endpoint()[0] in ['dataset', 'package']:
            for group in groups:
                _add_to_group(context, group, pkg_dict["id"])
            for group in rm_groups:
                _remove_from_group(context, group, pkg_dict["id"])

        _notify_admin(context, pkg_dict)
