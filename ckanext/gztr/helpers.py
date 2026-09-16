import json
import logging

import ckan.plugins.toolkit as tk

from . import config
from .views import stac_item_show

log = logging.getLogger(__name__)

def gztr_get_public_config():
    return json.dumps({
        "public_search_widget": config.public_search_widget_config()
    })

def gztr_get_geoconnex_config():
    return json.dumps(config.geoconnex_config())

def gztr_geoconnex_enabled():
    return tk.config["ckanext.gztr.geoconnex.enabled"]

def gztr_geoconnex_dataset_jsonld(dataset_metadata: dict[str, any]):
    """Construct Geoconnex-compatible JSON-LD based on a CKAN dataset's /api/3/action/package_show metadata."""
    try:
        namespace = tk.config["ckanext.gztr.geoconnex.namespace"]
        ckan_site_url = tk.config["ckan.site_url"]
        dataset_id = dataset_metadata.get("id")
        dataset_title = dataset_metadata.get("title")
        organization_name = dataset_metadata.get("organization").get("title")
        # Get geoconnex_pid from STAC item lookup, removing the need to store geoconnex_uri in spatial_full
        stac_items = [(feature.get("collection"), feature.get("id")) for feature in json.loads(dataset_metadata.get("spatial_full")).get("features")]
        about = []
        for collection_id, item_id in stac_items:
            if collection_id == "Drawn features":
                continue
            stac_item = stac_item_show(collection_id, item_id).get_json()
            geoconnex_pid = stac_item.get("properties").get("geoconnex_pid")
            if geoconnex_pid:
                about.append({"@id": geoconnex_pid})

        return json.dumps({
            "@context": {
                "@vocab": "https://schema.org/",
                "gsp": "http://www.opengis.net/ont/geosparql#",
            },
            "@id": f"https://geoconnex.us/ckan/{namespace}/{dataset_id}",
            "@type": "Dataset",
            # Human-readable label for the dataset, not the dataset ID
            "name": dataset_title,
            "provider": {
                "@type": "Organization",
                "name": organization_name
            },
            "url": f"{ckan_site_url}/dataset/{dataset_id}",
            # Geoconnex reference URIs
            "about": about
        })
    except Exception:
        log.exception("Error while running gztr_geoconnex_dataset_jsonld helper.")
