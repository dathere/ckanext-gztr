import GLMap, { Layer, Source } from "react-map-gl/maplibre";
import "@/assets/maplibre-gl.css";
import { useEffect, useState } from "react";
import type { ItemCollection } from "@/App";
import { useFormMap } from "@/stores/form-map-store";

const ExampleMap = () => {
  const stacCollections = useFormMap((state) => state.stacCollections);
  const itemCollections = useFormMap((state) => state.itemCollections);
  const quickRegionGeoJSON = useFormMap((state) => state.quickRegionGeoJSON);
  const setQuickRegionGeoJSON = useFormMap(
    (state) => state.setQuickRegionGeoJSON,
  );
  const spatialFull = useFormMap((state) => state.spatialFull);
  const statewideEnabled = useFormMap((state) => state.statewideEnabled);
  const [featuresWithGeometries, setFeaturesWithGeometries] = useState<
    ItemCollection | undefined
  >(undefined);

  // Get geometry values from itemCollections for each selected feature
  // Then display all selected and drawn features on the example map
  useEffect(() => {
    const spatialFullWithGeometries = structuredClone(spatialFull);
    if (spatialFullWithGeometries?.features) {
      spatialFullWithGeometries?.features.forEach((f) => {
        const identifiedFeature = itemCollections
          ?.find((iC) => iC.collection_id === f.collection)
          ?.features.find((cf) => cf.id === f.properties.id);
        const geometry = identifiedFeature?.geometry;
        if (geometry) f.geometry = geometry;
      });
      setFeaturesWithGeometries(spatialFullWithGeometries);
    }
  }, [itemCollections, spatialFull]);

  useEffect(() => {
    const quickRegionCollection = stacCollections?.find(
      (c) => c.quick_region_label,
    );
    if (quickRegionCollection)
      setQuickRegionGeoJSON(
        itemCollections?.find(
          (iC) => iC.collection_id === quickRegionCollection.id,
        ),
      );
  }, [stacCollections, setQuickRegionGeoJSON]);

  return (
    <GLMap
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
