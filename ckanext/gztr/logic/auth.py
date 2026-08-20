from __future__ import annotations

from typing import Any

import ckan.plugins.toolkit as tk
from ckan.types import Context


def gztr_collection_create(context: Context, data_dict: dict[str, Any]) -> dict[str, Any]:
    """Authorize gztr_collection_create.

    Only administrators are allowed to create geospatial collections.
    """
    # check if user is admin
    is_admin = tk.check_access("sysadmin", context, {})
    if not is_admin:
        return {"success": False, "msg": "Only sysadmins can create items"}

    return {"success": True}
