/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import * as turf from "@turf/turf";
import GLMap, {
  FullscreenControl,
  Layer,
  type MapRef,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
} from "react-map-gl/maplibre";
import "@/assets/maplibre-gl.css";
import {
  type FeatureCreatedFwdEvent,
  Geoman,
  type GlobalDrawToggledFwdEvent,
  type GlobalEditToggledFwdEvent,
  type GmEditFeatureEditEndEvent,
  type GmOptionsPartial,
} from "@geoman-io/maplibre-geoman-free";
import { XCircleIcon } from "lucide-react";
import type { Feature, Map as GLMapType } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import type { FeatureCollectionProperties } from "@/App";
import { HomeControl } from "@/components/home-control";
import { Button } from "@/components/ui/button";
import {
  initializeFeatureSourceAndLayer,
  toggleOptionInSource,
} from "@/lib/state-management";
import { useFormMap } from "@/stores/form-map-store";

const FormMap = () => {
  const mapRef = useRef<MapRef>(undefined);
  const popupRef = useRef<maplibregl.Popup | undefined>(undefined);
  const formMap = useFormMap((state) => state.formMap);
  const setFormMap = useFormMap((state) => state.setFormMap);
  const viewState = useFormMap((state) => state.viewState);
  const setViewState = useFormMap((state) => state.setViewState);
  const currentCollectionGeoJSON = useFormMap(
    (state) => state.currentCollectionGeoJSON,
  );
  const setCurrentCollectionGeoJSON = useFormMap(
    (state) => state.setCurrentCollectionGeoJSON,
  );
  const collections = useFormMap((state) => state.collections);
  const currentCollection = useFormMap((state) => state.currentCollection);
  const tempSpatialFull = useFormMap((state) => state.tempSpatialFull);
  const setTempSpatialFull = useFormMap((state) => state.setTempSpatialFull);
  const [selectedFeature, setSelectedFeature] = useState<Feature>();
  const [selectedFeatureCategory, setSelectedFeatureCategory] =
    useState<FeatureCollectionProperties>();
  const [lngLat, setLngLat] = useState<number[]>();
  const gm = useFormMap((state) => state.gm);
  const setGm = useFormMap((state) => state.setGm);
  const setDisableApplyButton = useFormMap(
    (state) => state.setDisableApplyButton,
  );

  // When the user clicks a feature on the map, identify it and add a popup
  const enablePopup = async (map: GLMapType) => {
    map.on("click", "featuresFill", (e) => {
      const renderedFeatures = map.queryRenderedFeatures(
        [e.point.x, e.point.y],
        {
          layers: ["featuresFill"],
        },
      );
      const identifiedCollection = collections?.find(
        (c) => c.properties.location === currentCollection?.location,
      );
      if (identifiedCollection) {
        const feature = renderedFeatures.at(0);
        if (feature) {
          feature.properties.collection = identifiedCollection;
          // @ts-expect-error
          setSelectedFeature(feature);
          setLngLat([e.lngLat.lng, e.lngLat.lat]);
          if (popupRef.current) popupRef.current.addTo(map);
        }
      }
    });
  };

  useEffect(() => {
    (async () => {
      // Display the currently selected feature collection GeoJSON on the map
      if (currentCollection) {
        const data = await (
          await fetch(
            `/file/public-download/gztr/${currentCollection.location}`,
          )
        ).json();
        setCurrentCollectionGeoJSON(data);
      }
      if (formMap) {
        const map = formMap.current?.getMap();
        if (map) await enablePopup(map);
      }
    })();
  }, [currentCollection, setCurrentCollectionGeoJSON]);

  useEffect(() => {
    // @ts-expect-error
    if (mapRef) setFormMap(mapRef);
  }, [mapRef]);

  return (
    <GLMap
      {...viewState}
      id="form-map"
      onLoad={() => {
        if (formMap) {
          const map = formMap.current?.getMap();
          const featureSource = map.getSource("featureSource");
          // Initialize geoman
          const gmOptions: GmOptionsPartial = {
            settings: {
              controlsUiEnabledByDefault: false,
            },
          };
          const newGm = new Geoman(map, gmOptions);
          setGm(newGm);
          if (!featureSource) {
            map.addSource("featureSource", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                // @ts-expect-error
                features: tempSpatialFull?.features
                  ? tempSpatialFull?.features?.length > 0
                    ? tempSpatialFull.features
                    : []
                  : [],
              },
            });
            map.once("gm:loaded", () => {
              setDisableApplyButton(false);
              // For each drawn feature add as GM feature
              // Add geometry to tempSpatialFull.features (using collections) and use that throughout this
              if (tempSpatialFull) {
              const nTSFFeatures = tempSpatialFull?.features.filter((f) => f.properties.collection.properties.label !== "Drawn features").map((f) => {
                const collection = collections?.find(
                  (c) =>
                    c.properties.location ===
                    f.properties.collection.properties.location,
                );
                const foundFeature = collection?.features.find(
                  (g) =>
                    g.properties[
                      g.properties.collection.properties.id_key ?? "id"
                    ] ===
                    f.properties[
                      f.properties.collection.properties.id_key ?? "id"
                    ],
                );
                const featureWithGeometry = structuredClone(f);
                // @ts-expect-error
                featureWithGeometry.geometry = foundFeature?.geometry;
                return featureWithGeometry;
              });
              const tempSpatialFullWithGeometry = structuredClone(tempSpatialFull);
              tempSpatialFullWithGeometry.features = nTSFFeatures;
              tempSpatialFullWithGeometry?.features?.forEach((dF) => {
                // @ts-expect-error
                newGm.features.importGeoJsonFeature(dF);
              });
              setTempSpatialFull(tempSpatialFullWithGeometry);
              }
              // ?.filter(
              //   (f) =>
              //     f.properties.collection?.properties?.label ===
              //     "Drawn features",
              // )
            });
            // TODO: on done with edit event, update drawn features
            map.on("gm:editend", async (event: GmEditFeatureEditEndEvent) => {
              event.feature.setProperties({
                id: event.feature.id,
                collection: "Drawn features",
              });
              const existingSource = map.getSource("featureSource");
              // @ts-expect-error
              const geojsonData = await existingSource?.getData();
              const existingFeatureIndex = geojsonData.features
                ? geojsonData.features.findIndex(
                    (f: any) =>
                      f.properties.id === event.feature.id &&
                      f.properties.collection === "Drawn features",
                  )
                : -1;
              if (existingFeatureIndex > -1) {
                const originalFeatureID =
                  geojsonData.features[existingFeatureIndex].id;
                geojsonData.features[existingFeatureIndex] = {
                  type: "Feature",
                  geometry: event.feature.getGeoJson().geometry,
                  properties: {
                    id: originalFeatureID,
                    collection: "Drawn features",
                  },
                  id: originalFeatureID,
                };
                // @ts-expect-error
                existingSource?.setData(geojsonData);
              }
            });
            map.on(
              "gm:globaleditmodetoggled",
              async (event: GlobalEditToggledFwdEvent) => {
                if (event.action === "mode_start") {
                  setDisableApplyButton(true);
                } else if (event.action === "mode_end") {
                  setDisableApplyButton(false);
                }
                // const geoJsonData = newGm.features.exportGeoJson();
                const existingFeatures = await event.map
                  // @ts-expect-error
                  .getSource("featureSource")
                  .getData();
                setTempSpatialFull(existingFeatures);
              },
            );
            map.on(
              "gm:globaldrawmodetoggled",
              async (event: GlobalDrawToggledFwdEvent) => {
                if (event.action === "mode_start") {
                  setDisableApplyButton(true);
                } else if (event.action === "mode_end") {
                  setDisableApplyButton(false);
                }
              },
            );
            map.on("gm:create", async (event: FeatureCreatedFwdEvent) => {
              const drawnFeatureId = event.feature.id.toString();
              const drawnGeojson = event.feature._geoJson;
              const drawnFeatureName = drawnFeatureId;
              const drawnFeatureCategory = "Drawn features";
              const fSource = map.getSource("featureSource");
              const newSelectedFeatures: Feature[] = [
                // @ts-expect-error
                ...(await fSource.getData()).features,
                drawnGeojson,
              ];
              await toggleOptionInSource(
                drawnFeatureName,
                drawnFeatureCategory,
                formMap,
                collections!,
                tempSpatialFull!,
                // @ts-expect-error
                drawnGeojson,
              );
              // @ts-expect-error
              map.fitBounds(turf.bbox(drawnGeojson));
              let featureSource = map.getSource("featureSource");
              if (!featureSource) {
                initializeFeatureSourceAndLayer(map, newSelectedFeatures);
                featureSource = map.getSource("featureSource");
              }
              // @ts-expect-error
              const geojsonData = await featureSource?.getData();
              geojsonData.properties = {
                label: "Drawn features",
                description: "Features drawn by the user using ckanext-gztr.",
                source: {
                  description: "CKAN instance",
                },
              };
              geojsonData.features[0].properties.collection = {};
              geojsonData.features[0].properties.collection.properties = geojsonData.properties;
              setTempSpatialFull(geojsonData);
            });
            // Show selected features from spatialFull as map layer
            map.addLayer({
              id: "featureLayer",
              // References the GeoJSON source defined above
              // and does not require a `source-layer`.
              // Filter means do not provide a background fill for feature.properties.category
              // where it is equal to "Drawn features" (since it already has a background fill).
              // See https://maplibre.org/maplibre-style-spec/expressions/#data-expressions for more info.
              filter: ["!=", "Drawn features", ["get", "collection"]],
              source: "featureSource",
              type: "fill",
              paint: { "fill-color": "rgba(80, 140, 244, 0.75)" },
            });
            // Add outline with increased width to existing features
            map.addLayer({
              id: "featureLayerLine",
              filter: ["!=", "Drawn features", ["get", "collection"]],
              source: "featureSource",
              type: "line",
              paint: {
                "line-color": "rgba(80, 100, 244, 0.85)",
                "line-width": 3,
              },
            });
            // Show popup on click of already selected features
            map.on("click", "featureLayer", async (e) => {
              // @ts-expect-error
              if (e.features[0].properties.collection?.features)
                // @ts-expect-error
                delete e.features[0].properties.collection.features;
              // @ts-expect-error
              e.features[0].properties.collection = JSON.parse(
                // @ts-expect-error
                e.features[0].properties.collection,
              );
              // @ts-expect-error
              const collection = e.features[0].properties.collection;
              // Add popup for currently selected feature layer (drawn and not drawn)
              setSelectedFeatureCategory(collection.properties);
              // @ts-expect-error
              setSelectedFeature(e.features[0]);
              setLngLat([e.lngLat.lng, e.lngLat.lat]);
              if (popupRef.current) popupRef.current.addTo(map);
            });
          }
        }
      }}
      // @ts-expect-error
      ref={mapRef}
      onMove={(e) => setViewState(e.viewState)}
      initialViewState={{
        latitude: 34.307144,
        longitude: -106.018066,
        zoom: 5,
      }}
      style={{ width: "100%", height: "60vh", borderRadius: "1rem" }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      <HomeControl />
      <NavigationControl />
      <FullscreenControl />
      <ScaleControl />
      {currentCollectionGeoJSON && currentCollection && (
        <Source id="geojson" type="geojson" data={currentCollectionGeoJSON}>
          <Layer
            id="featuresFill"
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
      {selectedFeature && lngLat && lngLat.length > 0 && (
        <Popup
          closeOnClick={false}
          onClose={() => {
            setSelectedFeatureCategory(undefined);
          }}
          longitude={lngLat[0]}
          latitude={lngLat[1]}
          // @ts-expect-error
          ref={popupRef}
          closeButton={false}
        >
          <div>
            <div className="tw:flex tw:justify-between tw:w-full tw:gap-4">
              <div className="tw:w-full">
                <span className="tw:text-xl">
                  <strong>
                    {
                      selectedFeature.properties[
                        selectedFeature.properties.collection.properties
                          .label_key ?? "label"
                      ]
                    }
                  </strong>
                </span>
                <br />
                {(currentCollection || selectedFeatureCategory) && (
                  <span className="tw:text-md">
                    <strong>
                      Category:{" "}
                      {currentCollection && !selectedFeatureCategory
                        ? currentCollection.label
                        : selectedFeatureCategory?.label}
                    </strong>
                  </span>
                )}
              </div>
              <Button
                className="tw:w-4 tw:p-0 tw:m-0 tw:h-fit tw:cursor-pointer tw:rounded-full"
                variant="ghost"
                size="icon"
                onClick={() => popupRef.current?.remove()}
              >
                <XCircleIcon />
              </Button>
            </div>
            {/* Select/Remove this feature button */}
            <Button
              className="btn btn-light"
              onClick={async () => {
                const featureToRemoveIndex =
                  tempSpatialFull?.features.findIndex(
                    (f) =>
                      f.properties[
                        f.properties.collection.properties.id_key ?? "id"
                      ] ===
                      selectedFeature.properties[
                        selectedFeature.properties.collection.properties
                          .id_key ?? "id"
                      ],
                  );
                // Convert from MapLibre Feature to GeoJSON Feature
                let newSelectedFeatures = tempSpatialFull?.features
                  ? [...structuredClone(tempSpatialFull).features]
                  : [];
                // Get map layer info; e.g. for adding/removing a darker layer for the selected feature
                const map = formMap?.current?.getMap();
                const featureSource = map?.getSource("featureSource");
                // @ts-expect-error
                const geojsonData = await featureSource?.getData();
                // User clicked "Remove this feature"
                // Note: It is important to have !== undefined here for a number
                if (
                  featureToRemoveIndex !== undefined &&
                  featureToRemoveIndex > -1
                ) {
                  const removedFeature = newSelectedFeatures.splice(
                    featureToRemoveIndex,
                    1,
                  );
                  gm?.features.delete(removedFeature[0].id);
                }
                // User clicked "Select this feature"
                else {
                  const selectedFeatureAsGeoJSONFeature = {
                    type: "Feature",
                    id:
                      selectedFeature.id ??
                      selectedFeature.properties[
                        selectedFeature.properties.collection.properties
                          .id_key ?? "id"
                      ],
                    geometry: selectedFeature.geometry,
                    properties: selectedFeature.properties,
                  };
                  const selectedFeatureGeoJSONWithoutCollections =
                    structuredClone(selectedFeatureAsGeoJSONFeature);
                  delete selectedFeatureGeoJSONWithoutCollections.properties
                    .collection.features;
                  // // @ts-expect-error
                  // gm?.features.importGeoJsonFeature(selectedFeatureGeoJSONWithoutCollections);
                  // TODO: Fix issue of selection
                  // @ts-expect-error
                  newSelectedFeatures =
                    tempSpatialFull?.features &&
                    !tempSpatialFull?.features.find(
                      (f) =>
                        f.properties[currentCollection?.id_key ?? "id"] ===
                        selectedFeature.properties[
                          currentCollection?.id_key ?? "id"
                        ],
                    )
                      ? [
                          ...tempSpatialFull.features,
                          selectedFeatureAsGeoJSONFeature,
                        ]
                      : [selectedFeatureAsGeoJSONFeature];
                }
                // setTempSpatialFull(geojsonData);
                if (tempSpatialFull?.features) {
                  const newTempSpatialFull = structuredClone(tempSpatialFull);
                  newTempSpatialFull.features = newSelectedFeatures;
                  setTempSpatialFull(newTempSpatialFull);
                  // Remvoe the feature from the MapLibre featureSource Source (also removes the highlight)
                  // Remove giant features array to prevent recursion error in MapLibre usage
                  const nTSFWithoutCollections =
                    structuredClone(newTempSpatialFull);
                  nTSFWithoutCollections.features =
                    nTSFWithoutCollections.features.map((f) => {
                      delete f.properties.collection.features;
                      return f;
                    });
                  // @ts-expect-error
                  featureSource?.setData(nTSFWithoutCollections);
                } else {
                  const newTempSpatialFull = {
                    type: "FeatureCollection",
                    features: newSelectedFeatures,
                    properties: {
                      label: "Dataset's geospatial features",
                      description:
                        "Geospatial features selected by a dataset publisher for a CKAN dataset using the ckanext-gztr CKAN extension.",
                      source: {
                        // TODO: Get source info from site
                        description: window.location.origin,
                      },
                    },
                  };
                  setTempSpatialFull(newTempSpatialFull);
                  // Add the feature to the MapLibre featureSource Source (which is then highlighted as a selected feature)
                  // Remove giant features array to prevent recursion error in Geoman usage
                  const nTSFWithoutCollections =
                    structuredClone(newTempSpatialFull);
                  nTSFWithoutCollections.features =
                    nTSFWithoutCollections.features.map((f) => {
                      delete f.properties.collection.features;
                      return f;
                    });
                  // @ts-expect-error
                  featureSource?.setData(nTSFWithoutCollections);
                }
              }}
            >
              {tempSpatialFull?.features.find(
                (f) =>
                  f.properties[
                    f.properties.collection.properties.label_key ?? "label"
                  ] ===
                  selectedFeature.properties[
                    selectedFeature.properties.collection.properties
                      .label_key ?? "label"
                  ],
              )
                ? "Remove"
                : "Select"}{" "}
              this feature
            </Button>
          </div>
        </Popup>
      )}
    </GLMap>
  );
};

export { FormMap };
