import logging
import json
from datetime import datetime as dt

import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
import ckan.lib.navl.dictization_functions as df


log = logging.getLogger(__name__)

h = toolkit.h
Invalid = toolkit.Invalid
missing = df.missing
StopOnError = df.StopOnError


def parse_date_range(key, flattened_data, errors, context):
    if not flattened_data[key]:
        return
    date_range = flattened_data[key]

    try:
        start_date, end_date = date_range.split("-")
        start_date = dt.strptime(start_date.strip(), "%m/%d/%Y")
        end_date = dt.strptime(end_date.strip(), "%m/%d/%Y")
        if start_date > end_date:
            raise Invalid("Start date must be before end date")
    except ValueError as e:
        raise Invalid("Invalid date range")
    flattened_data[("from_date",)] = start_date
    flattened_data[("to_date",)] = end_date


def parse_date_range_optional(key, flattened_data, errors, context):
    extras = flattened_data.get(("__extras",))

    # Determine if the 'No date range' checkbox was checked
    if extras and (key[0] + "_cb" in extras) and extras[key[0] + "_cb"] == "on":
        no_date_range = True
    else:
        no_date_range = False

    if no_date_range == True:
        flattened_data[("date_range",)] = None
        flattened_data[("from_date",)] = None
        flattened_data[("to_date",)] = None
        return

    if flattened_data[("date_range",)] == "" and no_date_range == False:
        raise Invalid(
            'Either a date range must be specified or the "This dataset does not have a date range" box must be checked.'
        )

    if not flattened_data[key]:
        return

    date_range = flattened_data[key]

    try:
        start_date, end_date = date_range.split("-")
        start_date = dt.strptime(start_date.strip(), "%m/%d/%Y")
        end_date = dt.strptime(end_date.strip(), "%m/%d/%Y")
        if start_date > end_date:
            raise Invalid("Start date must be before end date")
    except ValueError as e:
        raise Invalid("Invalid date range")
    flattened_data[("from_date",)] = start_date
    flattened_data[("to_date",)] = end_date


def check_end_date(key, flattened_data, errors, context):
    end_date = flattened_data[key]

    if end_date != "" and flattened_data[("update_type",)] != "automatic":
        raise Invalid(
            '"End Date" should only be specified when "Update Type" is "Automatic" {}'.format(
                end_date
            )
        )


def gazetteer_validator(key, data, errors, context):
    print(f"FLATTENED_DATA: {data}")
    check = True if data[key] == None else False
    print(f"DATAKEY: {data[key]}")
    print(f"CHECK: {check}")

    if data.get(key):
        data[key] = json.dumps(data.get(key))
        return

    gw = data.get(("__extras",))
    if not gw:
        return
    # get the value of the gazetteer fields
    data_dict = {}
    data_dict["spatial"] = gw.get("spatial") or None
    data_dict["spatial_full"] = gw.get("spatial_full") or None
    data_dict["place_keywords"] = gw.get("place_keywords") or None

    data[key] = json.dumps(data_dict)
    return data
