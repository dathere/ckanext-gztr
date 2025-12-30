import type { GeoJsonShapeFeature } from "@geoman-io/maplibre-geoman-free";
import type { Feature, Map as MapLibreMap } from "maplibre-gl";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import type {
  MultiSelectGroup,
  MultiSelectOption,
} from "@/components/multi-select";

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

export const getFeatureData = (
  name: string,
  category: string,
  features: MultiSelectOption[] | MultiSelectGroup[],
) => {
  return (
    features
      // @ts-expect-error
      .find((g) => g.heading === category)
      // @ts-expect-error
      ?.options.find((h) => h.label === name)
  );
};

export const toggleOptionInSource = async (
  name: string,
  category: string,
  formMap: RefObject<MapRef> | undefined,
  features: MultiSelectOption[] | MultiSelectGroup[],
  selectedFeatures: MultiSelectOption[] | MultiSelectGroup[],
  providedGeojson?: GeoJsonShapeFeature,
) => {
  if (formMap) {
    const map = formMap.current.getMap();
    const existingLayer = map.getLayer("featureLayer");
    const existingSource = map.getSource("featureSource");
    if (existingLayer && existingSource) {
      // @ts-expect-error
      const geojsonData: GeoJSON = await existingSource.getData();
      // Check if feature exist, if so remove, otherwise add
      const existingValueIndex = selectedFeatures.findIndex(
        // @ts-expect-error
        (opt) => opt.value === name && opt.category === category,
      );
      const existingFeatureIndex = geojsonData.features
        ? geojsonData.features.findIndex(
            (f: any) =>
              f.properties.value === name && f.properties.category === category,
          )
        : -1;
      if (existingFeatureIndex > -1) {
        geojsonData.features.splice(existingValueIndex, 1);
        // @ts-expect-error
        existingSource.setData(geojsonData);
      } else {
        const newFeature = {
          type: "Feature",
          geometry:
            category === "Drawn features"
              ? providedGeojson?.geometry
              : getFeatureData(name, category, features).geometry,
          properties: {
            value: name,
            category: category,
          },
        };
        // @ts-expect-error
        if (category === "Drawn features") newFeature.id = name;
        geojsonData.features.push(newFeature);
        // @ts-expect-error
        existingSource.setData(geojsonData);
      }
    }
  }
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
