import json

import ckan.plugins.toolkit as tk
from ckan.lib.files import get_storage


def gztr_json_file_as_dict(file_path: str) -> dict:
    """Get the data from a JSON file from the gztr storage as a Python dictionary"""
    gztr_storage = get_storage("gztr")
    file_info = gztr_storage.analyze(file_path)
    file_bytes = gztr_storage.content(file_info)
    file_str = file_bytes.decode("utf-8").strip()
    file_dict = json.loads(file_str)
    return file_dict

def gztr_get_collection(collection_id: str) -> dict:
    collections = gztr_json_file_as_dict("collections.json")
    collection = next((c for c in collections if c["id"] == collection_id), None)
    if not collection:
        return tk.abort(404, f"Collection with id {collection_id} not found.")
    return collection
