import * as turf from "@turf/turf";
import GLMap, { Layer, type MapRef, Source } from "react-map-gl/maplibre";
import "@/assets/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { ItemCollection } from "@/App";
import { useFormMap } from "@/stores/form-map-store";

const ExampleMap = () => {
  const mapRef = useRef<MapRef>(undefined);
  const itemCollections = useFormMap((state) => state.itemCollections);
  const quickRegionGeoJSON = useFormMap((state) => state.quickRegionGeoJSON);
  const spatialFull = useFormMap((state) => state.spatialFull);
  const statewideEnabled = useFormMap((state) => state.statewideEnabled);
  const [featuresWithGeometries, setFeaturesWithGeometries] = useState<
    ItemCollection | undefined
  >(undefined);

  // Get geometry values from itemCollections for each selected feature
  // Then display all selected and drawn features on the example map
  // TODO: (Optimization) Check if geometry exist in itemCollection for each geometry, if not then API action call
  useEffect(() => {
    (async () => {
      if (spatialFull?.features) {
        const spatialFullWithGeometries = JSON.parse(
          (
            await (
              await fetch(`/api/3/action/gztr_spatial_full_with_geometry`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  spatial_full: JSON.stringify(spatialFull),
                }),
              })
            ).json()
          ).result,
        );
        setFeaturesWithGeometries(spatialFullWithGeometries);
        const map = mapRef.current?.getMap();
        if (map) {
          // @ts-expect-error
          map.fitBounds(turf.bbox(spatialFullWithGeometries));
        }
      }
    })();
  }, [itemCollections, spatialFull]);

  useEffect(() => {
    if (!spatialFull) {
      setFeaturesWithGeometries(undefined);
    }
  }, [spatialFull])

  return (
    <GLMap
      // @ts-expect-error
      ref={mapRef}
      initialViewState={{
        latitude: 34.307144,
        longitude: -106.018066,
        zoom: 5,
      }}
      style={{ width: "100%", height: 400, borderRadius: "1rem" }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      {featuresWithGeometries && (
        // @ts-expect-error
        <Source type="geojson" data={featuresWithGeometries}>
          <Layer
            type="fill"
            paint={{ "fill-color": "rgba(102, 170, 238, 0.5)" }}
          />
          <Layer
            type="line"
            paint={{
              "line-color": "rgba(80, 120, 255, 1)",
              "line-width": 1,
            }}
          />
        </Source>
      )}
      {statewideEnabled && quickRegionGeoJSON && (
        <Source type="geojson" data={quickRegionGeoJSON}>
          <Layer
            type="fill"
            paint={{ "fill-color": "rgba(102, 170, 238, 0.5)" }}
          />
          <Layer
            type="line"
            paint={{
              "line-color": "rgba(80, 120, 255, 1)",
              "line-width": 1,
            }}
          />
        </Source>
      )}
    </GLMap>
  );
};

export { ExampleMap };
