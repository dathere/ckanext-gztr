import type { Feature, Map as MapLibreMap } from "maplibre-gl";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";

type SpatialFull = {
  type: "FeatureCollection";
  features: Feature[];
};

export const extractFeaturesFromGeojson = (spatialFull: SpatialFull) => {
  if (!spatialFull || !("features" in spatialFull)) return [];
  return spatialFull.features.map((feature) => ({
    value: feature.properties.value,
    category: feature.properties.category,
  }));
};

export const extractDrawnFeaturesFromGeojson = (spatialFull: SpatialFull) => {
  if (!spatialFull || !("features" in spatialFull)) return [];
  return spatialFull.features.filter(
    (f) => f.properties.category === "Drawn features",
  );
};

export const zoomToFeatureBounds = async (
  featureId: string,
  formMap: RefObject<MapRef> | undefined,
  selectedFeatures?: any[],
) => {
  if (formMap) {
    const map = formMap?.current.getMap();
    let allFeaturesSource = map.getSource("featureSource");
    if (!allFeaturesSource) {
      initializeFeatureSourceAndLayer(
        map,
        selectedFeatures ? selectedFeatures : [],
      );
      allFeaturesSource = map.getSource("featureSource");
    }
    // @ts-expect-error
    const features = (await allFeaturesSource.getData()).features;
    const featureGeojson = features.find(
      (f: any) => f.properties.value === featureId,
    );
    map.addSource(featureId, {
      type: "geojson",
      data: featureGeojson,
    });
    const source = map.getSource(featureId);
    if (source) {
      // @ts-expect-error
      const featureBounds = await source.getBounds();
      if (featureBounds) map.fitBounds(featureBounds);
      map.removeSource(featureId);
    }
  }
};

export const initializeFeatureSourceAndLayer = (
  map: MapLibreMap,
  selectedFeatures: any[],
) => {
  map.addSource("featureSource", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: selectedFeatures
        ? selectedFeatures.map((f) => ({
            type: "Feature",
            geometry:
              // @ts-expect-error
              getFeatureData(f.value, f.category, features).geometry,
            properties: {
              value: f.value,
              category: f.category,
            },
          }))
        : [],
    },
  });
  map.addLayer({
    id: "featureLayer",
    // References the GeoJSON source defined above
    // and does not require a `source-layer`
    source: "featureSource",
    type: "fill",
    paint: { "fill-color": "rgba(80, 170, 244, 0.75)" },
  });
};
