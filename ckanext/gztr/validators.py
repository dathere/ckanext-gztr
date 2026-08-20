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
