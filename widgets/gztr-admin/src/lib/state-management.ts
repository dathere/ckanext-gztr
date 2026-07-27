import type { GeoJsonShapeFeature } from "@geoman-io/maplibre-geoman-free";
import type { Feature, Map as MapLibreMap } from "maplibre-gl";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import type { FeatureCollectionExt, FeatureCollectionProperties } from "@/App";

export const extractDrawnFeaturesFromGeojson = (spatialFull: Feature[]) => {
  if (!spatialFull) return [];
  return spatialFull.filter((f) => f.properties.category === "Drawn features");
};

export const toggleOptionInSource = async (
  name: string,
  category: string,
  formMap: RefObject<MapRef> | undefined,
  collections: FeatureCollectionExt[],
  tempSpatialFull: FeatureCollectionExt,
  drawnGeoJSON?: GeoJsonShapeFeature,
) => {
  if (formMap) {
    const map = formMap.current?.getMap();
    const existingLayer = map.getLayer("featureLayer");
    const existingSource = map.getSource("featureSource");
    if (existingLayer && existingSource) {
      // @ts-expect-error
      const geojsonData: GeoJSON = await existingSource.getData();
      // Check if feature exist, if so remove, otherwise add
      const foundFeatureIndex = tempSpatialFull?.features.findIndex(
        (f) =>
          f.properties.label === name &&
          f.properties.collection?.properties.label === category,
      );
      if (foundFeatureIndex > -1) {
        tempSpatialFull?.features.splice(foundFeatureIndex, 1);
        // @ts-expect-error
        existingSource.setData(tempSpatialFull);
      } else {
        if (!(category === "Drawn features")) {
          const collection = collections?.find(
            (c) => c.properties.label === category,
          );
          const collectionLabelKey = collection?.properties.label_key;
          const newFeature = collection?.features.find(
            (f) => f.properties[collectionLabelKey ?? "label"] === name,
          );
          geojsonData.features.push(newFeature);
          // @ts-expect-error
          existingSource.setData(geojsonData);
        } else {
          const newDrawnGeojson = drawnGeoJSON;
          if (newDrawnGeojson) {
            newDrawnGeojson.properties.label = name;
            newDrawnGeojson.properties.collection = {};
            // @ts-expect-error
            newDrawnGeojson.properties.collection.properties = {
                label: "Drawn features",
                description: "Features drawn by the user using ckanext-gztr.",
                source: {
                  description: "CKAN instance",
                },
              };
            geojsonData.features.push(newDrawnGeojson);
          }
          // @ts-expect-error
          existingSource.setData(geojsonData);
        }
      }
    }
  }
};

export const zoomToFeatureBounds = async (
  featureId: string,
  currentCollectionProperties: FeatureCollectionProperties,
  formMap: RefObject<MapRef> | undefined,
  selectedFeatures?: any[],
) => {
  if (formMap) {
    const map = formMap?.current?.getMap();
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
      (f: any) =>
        f.properties[currentCollectionProperties.id_key ?? "id"] === featureId,
    );
    map.addSource(featureId, {
      type: "geojson",
      data: featureGeojson,
    });
    const source = map.getSource(featureId);
    if (source) {
      // @ts-expect-error
      const featureBounds = await source.getBounds();
      if (featureBounds && Object.keys(featureBounds).length > 0)
        map.fitBounds(featureBounds);
      map.removeSource(featureId);
    }
  }
};

export const initializeFeatureSourceAndLayer = (
  map: MapLibreMap,
  selectedFeatures: Feature[],
) => {
  map.addSource("featureSource", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      // @ts-expect-error
      features: selectedFeatures ?? [],
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
