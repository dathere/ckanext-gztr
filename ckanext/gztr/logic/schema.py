from __future__ import annotations

import ckan.plugins.toolkit as tk
from ckan import types


@tk.validator_args
def feature_show(
    not_empty: types.Validator,
    unicode_safe: types.Validator,
    default: types.ValidatorFactory,
    boolean_validator: types.Validator,
) -> types.Schema:
    return {
        "id": [not_empty, unicode_safe],
        "collection_location": [not_empty, unicode_safe],
        "include_geometry": [default(False), boolean_validator],
    }

@tk.validator_args
def collection_create(
    not_empty: types.Validator,
) -> types.Schema:
    return {
        "upload": [not_empty],
    }

@tk.validator_args
def spatial_full_with_geometry(
    not_empty: types.Validator,
) -> types.Schema:
    return {
        "spatial_full": [not_empty],
    }