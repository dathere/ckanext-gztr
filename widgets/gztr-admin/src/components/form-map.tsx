/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
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
import { useEffect, useRef, useState } from "react";
import { categories } from "@/components/category-combobox";
import { HomeControl } from "@/components/home-control";
import { Button } from "@/components/ui/button";
import {
  extractDrawnFeaturesFromGeojson,
  getFeatureData,
  initializeFeatureSourceAndLayer,
  toggleOptionInSource,
  zoomToFeatureBounds,
} from "@/lib/state-management";
import { useFormMap } from "@/stores/form-map-store";

const FormMap = ({ layerName }: { layerName?: string }) => {
  // @ts-expect-error
  const mapRef = useRef<MapRef>();
  // @ts-expect-error
  const popupRef = useRef<maplibregl.Popup>();
  const formMap = useFormMap((state) => state.formMap);
  const setFormMap = useFormMap((state) => state.setFormMap);
  const viewState = useFormMap((state) => state.viewState);
  const setViewState = useFormMap((state) => state.setViewState);
  const geojson = useFormMap((state) => state.geojson);
  const setGeojson = useFormMap((state) => state.setGeojson);
  const currentCategory = useFormMap((state) => state.currentCategory);
  const [selectedFeatureName, setSelectedFeatureName] = useState<string>();
  const [selectedFeatureCategory, setSelectedFeatureCategory] =
    useState<string>();
  const [lngLat, setLngLat] = useState<number[]>();
  const features = useFormMap((state) => state.features);
  const selectedFeatures = useFormMap((state) => state.selectedFeatures);
  const setSelectedFeatures = useFormMap((state) => state.setSelectedFeatures);
  const spatialFull = useFormMap((state) => state.spatialFull);
  const setTempSpatialFull = useFormMap((state) => state.setTempSpatialFull);
  const setGm = useFormMap((state) => state.setGm);
  const setDisableApplyButton = useFormMap(
    (state) => state.setDisableApplyButton,
  );

  useEffect(() => {
    if (layerName)
      (async () => {
        const data = await (
          await fetch(`/data/gztr-features/${layerName}.geojson`)
        ).json();
        setGeojson(data);
        if (mapRef) {
          // Add popups for each GeoJSON feature with details and select button
          const map = mapRef.current.getMap();
          map.on("click", "featuresFill", (e) => {
            const renderedFeatures = map.queryRenderedFeatures(
              [e.point.x, e.point.y],
              {
                layers: ["featuresFill"],
              },
            );
            const featureName =
              renderedFeatures.at(0)?.properties[
                // @ts-expect-error
                categories.find((c) => c.label === currentCategory.label)
                  .nameKey
              ];
            setSelectedFeatureName(featureName);
            setLngLat([e.lngLat.lng, e.lngLat.lat]);
            if (popupRef.current) popupRef.current.addTo(map);
          });
        }
      })();
  }, [layerName, setGeojson]);

  useEffect(() => {
    if (mapRef) setFormMap(mapRef);
  }, [mapRef]);

  return (
    <GLMap
      {...viewState}
      id="form-map"
      onLoad={() => {
        if (formMap) {
          const map = formMap.current.getMap();
          const featureSource = map.getSource("featureSource");
          // Initialize geoman
          const gmOptions: GmOptionsPartial = {
            settings: {
              controlsUiEnabledByDefault: false,
            },
          };
          const newGm = new Geoman(map, gmOptions);
          setGm(newGm);
          const drawnFeatures = extractDrawnFeaturesFromGeojson(spatialFull);
          if (!featureSource) {
            map.addSource("featureSource", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                // @ts-expect-error
                features: selectedFeatures
                  ? selectedFeatures.map((f) => {
                      const outputFeature = {
                        type: "Feature",
                        geometry:
                          // @ts-expect-error
                          f.category === "Drawn features"
                            ? // @ts-expect-error
                              drawnFeatures.find(
                                (g) =>
                                  // @ts-expect-error
                                  g.properties.category === f.category &&
                                  // @ts-expect-error
                                  g.properties.value === f.value,
                              ).geometry
                            : // @ts-expect-error
                              getFeatureData(f.value, f.category, features)
                                .geometry,
                        properties: {
                          // @ts-expect-error
                          value: f.value,
                          // @ts-expect-error
                          category: f.category,
                        },
                      };
                      // @ts-expect-error
                      if (f.category === "Drawn features") {
                        // @ts-expect-error
                        outputFeature.id = f.value;
                      }
                      return outputFeature;
                    })
                  : [],
              },
            });
            map.once("gm:loaded", () => {
              setDisableApplyButton(false);
              // Add GM features if drawn features in selectedFeatures from spatialFull
              drawnFeatures.forEach((dF) => {
                // @ts-expect-error
                newGm.features.importGeoJsonFeature(dF);
              });
            });
            // TODO: on done with edit event, update drawn features
            map.on("gm:editend", async (event: GmEditFeatureEditEndEvent) => {
              event.feature.setProperties({
                value: event.feature.id,
                category: "Drawn features",
              });
              const existingSource = map.getSource("featureSource");
              // @ts-expect-error
              const geojsonData = await existingSource?.getData();
              const existingFeatureIndex = geojsonData.features
                ? geojsonData.features.findIndex(
                    (f: any) =>
                      f.properties.value === event.feature.id &&
                      f.properties.category === "Drawn features",
                  )
                : -1;
              if (existingFeatureIndex > -1) {
                const originalFeatureID =
                  geojsonData.features[existingFeatureIndex].id;
                geojsonData.features[existingFeatureIndex] = {
                  type: "Feature",
                  geometry: event.feature.getGeoJson().geometry,
                  properties: {
                    value: originalFeatureID,
                    category: "Drawn features",
                  },
                  id: originalFeatureID,
                };
                // @ts-expect-error
                existingSource.setData(geojsonData);
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
              const newSelectedFeatures = [
                // @ts-expect-error
                ...(await fSource.getData()).features.map((f) => ({
                  value: f.properties.value,
                  category: f.properties.category,
                })),
                { value: drawnFeatureName, category: drawnFeatureCategory },
              ];
              setSelectedFeatures(newSelectedFeatures);
              await toggleOptionInSource(
                drawnFeatureName,
                drawnFeatureCategory,
                formMap,
                features,
                newSelectedFeatures,
                // @ts-expect-error
                drawnGeojson,
              );
              await zoomToFeatureBounds(drawnFeatureName, formMap);
              let featureSource = map.getSource("featureSource");
              if (!featureSource) {
                initializeFeatureSourceAndLayer(map, newSelectedFeatures);
                featureSource = map.getSource("featureSource");
              }
              // @ts-expect-error
              const geojsonData = await featureSource?.getData();
              setTempSpatialFull(geojsonData);
            });
            map.addLayer({
              id: "featureLayer",
              // References the GeoJSON source defined above
              // and does not require a `source-layer`.
              // Filter means do not provide a background fill for feature.properties.category
              // where it is equal to "Drawn features" (since it already has a background fill).
              // See https://maplibre.org/maplibre-style-spec/expressions/#data-expressions for more info.
              filter: ["!=", "Drawn features", ["get", "category"]],
              source: "featureSource",
              type: "fill",
              paint: { "fill-color": "rgba(80, 170, 244, 0.75)" },
            });
            // Show popup on click of already selected features
            map.on("click", "featureLayer", async (e) => {
              // @ts-expect-error
              const featureCategory = e.features[0].properties.category;
              // @ts-expect-error
              const featureName = e.features[0].properties.value;
              // Add popup for currently selected feature layer (drawn and not drawn)
              setSelectedFeatureCategory(featureCategory);
              setSelectedFeatureName(featureName);
              setLngLat([e.lngLat.lng, e.lngLat.lat]);
              if (popupRef.current) popupRef.current.addTo(map);
            });
          }
        }
      }}
      ref={mapRef}
      onMove={(e) => setViewState(e.viewState)}
      initialViewState={{
        latitude: 34.307144,
        longitude: -106.018066,
        zoom: 5,
      }}
      style={{ width: "100%", height: 400, borderRadius: "1rem" }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      <HomeControl />
      <NavigationControl />
      <FullscreenControl />
      <ScaleControl />
      {geojson && (
        <>
          {layerName && (
            <Source id="geojson" type="geojson" data={geojson}>
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
          {selectedFeatureName && lngLat && lngLat.length > 0 && (
            <Popup
              closeOnClick={false}
              longitude={lngLat[0]}
              latitude={lngLat[1]}
              ref={popupRef}
              closeButton={false}
            >
              <div>
                <div className="tw:flex tw:justify-between tw:w-full tw:gap-4">
                  <div className="tw:w-full">
                    <span className="tw:text-xl">
                      <strong>{selectedFeatureName}</strong>
                    </span>
                    {selectedFeatureCategory && (
                      <>
                        <br />
                        <span className="tw:text-md">
                          <strong>Category: {selectedFeatureCategory}</strong>
                        </span>
                      </>
                    )}
                  </div>
                  <Button
                    className="tw:w-4 tw:p-0 tw:m-0 tw:h-fit tw:cursor-pointer tw:rounded-full"
                    variant="ghost"
                    size="icon"
                    onClick={() => popupRef.current.remove()}
                  >
                    <XCircleIcon />
                  </Button>
                </div>
                <Button
                  className="btn btn-light"
                  onClick={async () => {
                    const currentSelectedCategoryLabel = selectedFeatureCategory
                      ? selectedFeatureCategory
                      : currentCategory?.label;
                    let newSelectedFeatures = [...selectedFeatures];
                    const existingValueIndex = selectedFeatures.findIndex(
                      (opt) =>
                        // @ts-expect-error
                        opt.value === selectedFeatureName &&
                        // @ts-expect-error
                        opt.category === currentSelectedCategoryLabel,
                    );
                    if (existingValueIndex > -1)
                      newSelectedFeatures.splice(existingValueIndex, 1);
                    else {
                      // @ts-expect-error
                      newSelectedFeatures = [
                        ...selectedFeatures,
                        {
                          value: selectedFeatureName,
                          category: currentSelectedCategoryLabel,
                        },
                      ];
                    }
                    // @ts-expect-error
                    setSelectedFeatures(newSelectedFeatures);
                    await toggleOptionInSource(
                      selectedFeatureName,
                      // @ts-expect-error
                      currentSelectedCategoryLabel,
                      formMap,
                      features,
                      newSelectedFeatures,
                    );
                    if (existingValueIndex === -1)
                      await zoomToFeatureBounds(selectedFeatureName, formMap);
                    const map = formMap?.current.getMap();
                    // @ts-expect-error
                    const featureSource = map.getSource("featureSource");
                    // @ts-expect-error
                    const geojsonData = await featureSource?.getData();
                    setTempSpatialFull(geojsonData);
                  }}
                >
                  {selectedFeatures.findIndex(
                    (opt) =>
                      // @ts-expect-error
                      opt.value === selectedFeatureName &&
                      // @ts-expect-error
                      (opt.category === currentCategory?.label ||
                        // @ts-expect-error
                        opt.category === selectedFeatureCategory),
                  ) === -1
                    ? "Select"
                    : "Remove"}{" "}
                  this feature
                </Button>
              </div>
            </Popup>
          )}
        </>
      )}
    </GLMap>
  );
};

export { FormMap };
