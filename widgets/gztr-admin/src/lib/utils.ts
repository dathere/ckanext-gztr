import * as turf from "@turf/turf";
import { type ClassValue, clsx } from "clsx";
import type { Map as FormMap } from "maplibre-gl";
import { twMerge } from "tailwind-merge";
import type { ItemCollection } from "@/App";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
