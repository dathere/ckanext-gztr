import { type ClassValue, clsx } from "clsx";
import type { Map as FormMap } from "maplibre-gl";
import { twMerge } from "tailwind-merge";
import * as Topojson from "topojson";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const runAddressSearch = async (
  search_query?: string,
  map?: FormMap,
) => {
  if (search_query) {
    const nominatimEndpoint = `https://nominatim.openstreetmap.org/search?addressdetails=1&q=${search_query}&format=jsonv2&limit=10`;
    const result = await (
      await fetch(nominatimEndpoint, {
        headers: {
          "User-Agent": "New Mexico Water Data Hub",
        },
        signal: AbortSignal.timeout(5000),
      })
    ).json();
    // TODO: List multiple results user can choose from
    if (result.length > 0 && map) {
      map.flyTo({ center: [result[0].lon, result[0].lat], zoom: 9 });
    }
  }
};

const MAX_SIZE_FOR_SIMPLIFIED_GEOJSON = 30 * 1000; // 30 KB

export const simplifyGeojson = (str: string) => {
  console.log(str);
  try {
    const origGeojson = str;
    // @ts-expect-error
    const firstTopo = Topojson.topology({ simp: origGeojson });
    console.log("FIRSTTOPO:", firstTopo);
    // @ts-expect-error
    const merged = Topojson.merge(firstTopo, firstTopo.objects.simp.geometries);
    console.log("MERGED:", merged);
    return merged;
    const secondTopo = Topojson.topology({ simp: merged });
    console.log("SECONDTOPO:", secondTopo);
    // @ts-expect-error
    const presimplified = Topojson.presimplify(secondTopo);
    console.log("PRESIMPLIFIED:", presimplified);
    const quantile = Topojson.quantile(
      presimplified,
      MAX_SIZE_FOR_SIMPLIFIED_GEOJSON / JSON.stringify(str).length,
    );
    console.log("QUANTILE:", quantile);
    const simplified = Topojson.simplify(presimplified, quantile);
    console.log("SIMPLIFIED:", simplified);
    const outGeojson = Topojson.feature(simplified, "simp");
    console.log("OUTGEOJSON:", outGeojson);
    return outGeojson;
  } catch (e) {
    console.error("Error while simplifying GeoJSON: ", String(e));
  }
};
