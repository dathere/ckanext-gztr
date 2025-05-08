import ckan.plugins.toolkit as toolkit

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
