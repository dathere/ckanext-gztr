import ckan.plugins.toolkit as toolkit
import ckan.lib.helpers as h
from datetime import datetime, timedelta

def is_composite_field_populated(package_dict, field):
    """"
    This function checks if a composite field populated. Non-composite fields will return True by default.
    """
    composite_presets_list = ['composite']
    field_name = field.get('field_name')

    if (package_dict.get(field_name)
            and field_name != 'spatial_details'
            and field.get('preset') in composite_presets_list):
        subfield_literal_eval = {}
        try:
            subfield_literal_eval = literal_eval(package_dict[field_name])
        except (ValueError, SyntaxError) as e:
            log.debug('Unable to evaluate field {0} in package dictionary: {1}'
                      .format(field_name, package_dict.get(field_name)))

        return is_dict_populated(subfield_literal_eval)

    return True

def scheming_groups_choices(dummy_var="none"):
    """Return a list of groups for scheming choices helper"""
    groups = toolkit.get_action("group_list")({}, {"all_fields": True})

    group_choices = [{
        "value": g["name"], 
        "label": g["display_name"]
    } for g in groups]
    return group_choices

def dynamic_help_text(help_text, field):

    field['help_text'] = help_text
    return field

def is_new(created_date, limit=31, title=None):
    """display a 'new' icon."""
    """ created_date: the date the package was created """
    """ limit: a package must be less than or equal limit days old for the new icon to show """
    """ title: tooltip text for new icon """

    date2 = datetime.now()
    date1 = datetime.strptime(created_date, "%Y-%m-%dT%H:%M:%S.%f")
    timedelta = date2 - date1

    if not title:
        raise Exception("is_new() did not recieve a valid type_ or title")
    return h.snippet(
        "snippets/is_new.html", title=title, age=timedelta.days, limit=limit
    )

def add_tracking_to_dataset(package):
    """Return the dataset with tracking information"""
    if isinstance(package, dict):
        name = package.get("name")
    else:
        name = package

    try:
        result = toolkit.get_action("package_show")(
            {}, {"id": name, "include_tracking": True}
        )

    except:
        # log.error("Error in retrieving dataset tracking summary: {}".format(package))
        result = package
        result["tracking_summary"] = {}
        result["tracking_summary"]["total"] = 0
        result["tracking_summary"]["recent"] = 0

    return result

def dict_list_reduce_with_extras(list_, key, extras, unique=True):
    """Take a list of dicts and create a new one containing just the
    values for the key with unique values if requested."""
    new_list = []
    value_list = []
    for item in list_:
        extra_values = []
        value = item.get(key)
        if not value or (unique and value in value_list):
            continue
        values = [value]
        for extra in extras:
            values.append(item.get(extra))
        new_list.append(values)
        value_list.append(value)
    return new_list
