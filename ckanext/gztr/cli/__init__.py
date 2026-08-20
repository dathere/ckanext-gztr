from __future__ import annotations

import click

from . import sd

# declare exported members for `cli` blanket. Without `__all__`
# it will register every public function in a module as a CLI command.
__all__ = ["gztr_group"]

# 1. Define the parent CLI entrypoint command group
@click.group("gztr", short_help="ckanext-gztr CLI commands")
def gztr_group():
    """Group of administrative commands for ckanext-gztr."""
    pass

# 2. Add sub-groups/commands
gztr_group.add_command(sd.group, "sd")
