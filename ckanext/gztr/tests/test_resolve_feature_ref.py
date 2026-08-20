"""Checks for _resolve_feature_ref against the three spatial_full shapes seen in the wild.

Run standalone (no CKAN needed): python ckanext/gztr/tests/test_resolve_feature_ref.py
"""

import sys
from pathlib import Path


def _load():
    """Import _resolve_feature_ref without dragging in CKAN/sedonadb."""
    src = (Path(__file__).parents[1] / "logic" / "action.py").read_text()
    start = src.index("def _resolve_feature_ref")
    end = src.index("@tk.validate_action_data")
    ns = {"Path": Path, "Any": object}
    exec(compile(src[start:end], "action.py", "exec"), ns)  # noqa: S102
    return ns["_resolve_feature_ref"]


resolve = _load()
IDS = ["nm_state", "nm_counties", "nm_public_water_systems"]


def test_current_shape():
    """What the current gazetteer writes: collection id and id at the top level."""
    f = {"collection": "nm_counties", "id": "31", "geometry": None}
    assert resolve(f, IDS) == ("nm_counties", "31")


def test_legacy_nested_collection():
    """Older gazetteer: whole config.json entry nested under properties.collection."""
    f = {
        "id": 31,
        "properties": {
            "OBJECTID": 31,
            "collection": {"properties": {"location": "nm_counties.geojson", "label": "Counties"}},
        },
    }
    # int id must come back as a string -- stac_item_show compares a quoted SQL literal
    assert resolve(f, IDS) == ("nm_counties", "31")


def test_oldest_shape_has_no_collection_at_all():
    """Oldest gazetteer: bare GeoJSON Feature. Nothing to resolve, and must not raise."""
    f = {"type": "Feature", "properties": {"GEO_ID": "0400000US35"}, "geometry": {"type": "Polygon"}}
    assert resolve(f, IDS) == (None, None)


def test_drawn_features_passes_through():
    """Drawn features carry their own geometry; caller skips them on the sentinel."""
    f = {"collection": "Drawn features", "id": "abc"}
    assert resolve(f, IDS) == ("Drawn features", "abc")


def test_unknown_collection_is_not_looked_up():
    """A collection that is not installed must not reach stac_item_show (it would 500)."""
    f = {"collection": "collection_that_was_deleted", "id": "7"}
    assert resolve(f, IDS) == (None, None)


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in fns:
        fn()
        print(f"  ok  {fn.__name__}")
    print(f"{len(fns)} passed")
    sys.exit(0)
