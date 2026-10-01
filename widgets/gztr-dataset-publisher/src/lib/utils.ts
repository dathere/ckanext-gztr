import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import * as turf from "@turf/turf";
import { type ClassValue, clsx } from "clsx";
import { asyncBufferFromUrl, parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import type { Map as FormMap } from "maplibre-gl";
import type { StacItem } from "stac-ts";
import { twMerge } from "tailwind-merge";
import type { ItemCollection } from "@/App";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const filteredStacItem = (stacItem: StacItem) => {
  return {
    type: "Feature",
    id: stacItem.id,
    collection: stacItem.collection,
    geometry:
      stacItem.collection === "Drawn features" ? stacItem.geometry : null,
    properties: {},
  };
};

export const getItemCollectionFromAPIWithHyparquet = async (
  collectionId: string,
) => {
  try {
    const collectionFileName = `${collectionId}.parquet`;
    const collectionFileURL = `/file/public-download/gztr/${collectionFileName}`;
    const file = await asyncBufferFromUrl({ url: collectionFileURL });
    const data = await parquetReadObjects({
      file,
      compressors,
      geoparquet: true,
    });
    const ckanSiteURL = window.location.origin;
    const stacItems = data.map((row) => {
      const links = [
        {
          href: `${ckanSiteURL}/gztr/stac/collections/${collectionId}/items/${row.id}`,
          rel: "self",
          type: "application/json",
        },
        {
          href: `${ckanSiteURL}/gztr/stac/collections/${collectionId}`,
          rel: "collection",
          type: "application/json",
        },
      ];
      if (typeof row.id === "bigint") {
        row.id = Number(row.id);
      }
      return {
        stac_version: "1.1.0",
        type: "Feature",
        id: row.id,
        collection: collectionId,
        links: links,
        geometry: row.geometry,
        properties: {
          bbox: turf.bbox(row.geometry),
          ...row,
        },
      };
    });
    const stacItemCollection = {
      type: "FeatureCollection",
      features: stacItems,
    };
    return stacItemCollection;
  } catch (e) {
    console.log(e);
  }
};

export const getItemCollectionFromAPIDuckDBWASM = async (
  collectionId: string,
  conn: AsyncDuckDBConnection,
) => {
  try {
    const collectionFileName = `${collectionId}.parquet`;
    const collectionFileURL = `/file/public-download/gztr/${collectionFileName}`;
    await conn.query(`
      CREATE TABLE ${collectionId} AS SELECT * FROM '${window.location.origin}${collectionFileURL}'
    `);
    const rows = await conn.query(`
      SELECT
        * EXCLUDE geometry,
        ST_AsGeoJSON(geometry) AS geometry,
        [ST_XMIN(geometry), ST_YMIN(geometry), ST_XMAX(geometry), ST_YMAX(geometry)] as bbox
      FROM ${collectionId}
      ORDER BY title
    `);
    const stacItems = rows.toArray().map((row) => {
      const rowJSON = row.toJSON();
      const ckanSiteURL = window.location.origin;
      const parsedGeometry = JSON.parse(rowJSON.geometry);
      delete rowJSON.geometry;
      // Convert to normal array
      const parsedBbox = [].slice.call(rowJSON.bbox.data[0].values);
      delete rowJSON.bbox;
      const links = [
        {
          href: `${ckanSiteURL}/gztr/stac/collections/${collectionId}/items/${rowJSON.id}`,
          rel: "self",
          type: "application/json",
        },
        {
          href: `${ckanSiteURL}/gztr/stac/collections/${collectionId}`,
          rel: "collection",
          type: "application/json",
        },
      ];
      return {
        stac_version: "1.1.0",
        type: "Feature",
        id: rowJSON.id,
        collection: collectionId,
        links: links,
        geometry: parsedGeometry,
        properties: {
          bbox: parsedBbox,
          ...rowJSON,
        },
      };
    });
    const stacItemCollection = {
      type: "FeatureCollection",
      features: stacItems,
    };
    return stacItemCollection;
  } catch (e) {
    console.error("Error while attempting to use DuckDB WASM.");
    console.error(e);
  }
  // If DuckDB WASM has an error, resort to default STAC API retrieval which should be slower
  return getItemCollectionFromAPI(collectionId);
};

export const getItemCollectionFromAPI = async (collectionId: string) => {
  const itemCollection = await (
    await fetch(`/gztr/stac/collections/${collectionId}/items`)
  ).json();
  return itemCollection;
};

export const getItemFromAPI = async (collectionId: string, itemId: string) => {
  const item = await (
    await fetch(`/gztr/stac/collections/${collectionId}/items/${itemId}`)
  ).json();
  return item;
};

export const runAddressSearch = async (
  search_query?: string,
  map?: FormMap,
  setAddressSearchResults?: (addressSearchResults: any[]) => void,
) => {
  if (search_query) {
    const nominatimEndpoint = `https://nominatim.openstreetmap.org/search?addressdetails=1&q=${search_query}&format=jsonv2&limit=10`;
    const result = await (
      await fetch(nominatimEndpoint, {
        headers: {
          // TODO: User-Agent based on CKAN instance config
          "User-Agent": "New Mexico Water Data Hub",
        },
        signal: AbortSignal.timeout(5000),
      })
    ).json();
    if (setAddressSearchResults) setAddressSearchResults(result);
    if (result.length > 0 && map) {
      map.flyTo({ center: [result[0].lon, result[0].lat], zoom: 9 });
    }
  }
};

export const simplifyGeojson = (spatialFullGeoJSON: any) => {
  try {
    const features: any[] = spatialFullGeoJSON.features;
    // Simplify further if not less than 30KB (to resolve SOLR indexing issue of 32KB max)
    const MAX_SIZE_FOR_SIMP = 30 * 1000; // 30 KB
    const featureCollection = turf.featureCollection(
      // @ts-expect-error
      features.map((f) => {
        const featureType = f.type;
        let tolerance = 0.0001;
        let simplifiedData = turf.simplify(
          featureType === "Polygon" || f.geometry.type === "Polygon"
            ? turf.polygon(f.geometry.coordinates, f.properties)
            : turf.multiPolygon(f.geometry.coordinates, f.properties),
          { highQuality: true, tolerance },
        );
        while (JSON.stringify(simplifiedData).length > MAX_SIZE_FOR_SIMP) {
          tolerance += 0.001;
          simplifiedData = turf.simplify(
            featureType === "Polygon" || f.geometry.type === "Polygon"
              ? turf.polygon(f.geometry.coordinates, f.properties)
              : turf.multiPolygon(f.geometry.coordinates, f.properties),
            { highQuality: true, tolerance },
          );
        }
        return simplifiedData;
      }),
    );
    if (featureCollection.features && featureCollection.features.length > 1) {
      return turf.union(featureCollection)?.geometry;
    } else if (featureCollection.features.length === 1) {
      return featureCollection.features.at(0)?.geometry;
    }
    return null;
  } catch (e) {
    console.error("Error while simplifying GeoJSON: ", String(e));
  }
};

export const getPlaceKeywordsFromSpatialFull = (
  spatialFull: ItemCollection | undefined,
): string => {
  if (!spatialFull) return "";
  return spatialFull.features
    .filter((f) => f.properties.collection_location !== "Drawn features")
    .map(
      (feature) =>
        `${feature.properties.title} (${feature.properties.collection})`,
    )
    .join(", ");
};
