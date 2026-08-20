import json

from . import config


def gztr_get_public_config():
    return json.dumps({
        "public_search_widget": config.public_search_widget_config()
    })
