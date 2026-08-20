import * as turf from "@turf/turf";
import { type ClassValue, clsx } from "clsx";
import type { Map as FormMap } from "maplibre-gl";
import { twMerge } from "tailwind-merge";
import * as Topojson from "topojson";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const runAddressSearch = async (
  // @ts-expect-error
  config: any,
  search_query?: string,
  map?: FormMap,
  setAddressSearchResults?: (addressSearchResults: any[]) => void,
  setSearchResultMarkerLngLat?: (searchResultMarkerLngLat: any) => void,
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
    if (setSearchResultMarkerLngLat)
      setSearchResultMarkerLngLat({ lon: result[0].lon, lat: result[0].lat });
    if (result.length > 0 && map) {
      map.flyTo({ center: [result[0].lon, result[0].lat], zoom: 9 });
    }
  }
};

export const simplifyGeojson = (str: string) => {
  try {
    const origGeojson = str;
    // @ts-expect-error
    const firstTopo = Topojson.topology({ simp: origGeojson });
    // @ts-expect-error
    const merged = Topojson.merge(firstTopo, firstTopo.objects.simp.geometries);
    // Refer to https://mourner.github.io/simplify-js/ for more details and options info.
    let tolerance = 0.0001;
    let simplifiedData = turf.simplify(merged, {
      highQuality: true,
      tolerance,
    });
    // Simplify further if not less than 30KB (to resolve SOLR indexing issue of 32KB max)
    const MAX_SIZE_FOR_SIMP = 30 * 1000; // 30 KB
    while (String(simplifiedData).length > MAX_SIZE_FOR_SIMP) {
      tolerance += 0.001;
      simplifiedData = turf.simplify(merged, { highQuality: true, tolerance });
    }
    return simplifiedData;
  } catch (e) {
    console.error("Error while simplifying GeoJSON: ", String(e));
  }
};
