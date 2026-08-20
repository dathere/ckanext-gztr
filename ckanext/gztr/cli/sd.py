from __future__ import annotations

import click
import geopandas as gpd
import sedonadb


@click.group("sd", short_help="SedonaDB operations")
def group():
    pass

@group.command("convert")
@click.argument("geojson_filepath", type=click.Path(exists=True))
@click.argument("parquet_filepath", type=click.Path(exists=True))
def run_convert(
    geojson_filepath: str,
    parquet_filepath: str
):
    """Generate a GeoParquet file based on the provided GeoJSON file."""
    try:
        sd = sedonadb.connect()
        gdf = gpd.read_file(geojson_filepath, driver="GeoJSON")
        df = sd.create_data_frame(gdf)
        df.to_parquet(parquet_filepath)
    except Exception as e:  # noqa: BLE001
        click.secho("Exception while attempting to generate Parquet file:", fg="red")
        click.secho(e)
    click.secho("Done!", fg="green")
