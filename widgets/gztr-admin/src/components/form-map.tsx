/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import GLMap, {
  FullscreenControl,
  GeolocateControl,
  Layer,
  type MapRef,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
} from "react-map-gl/maplibre";
import "@/assets/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { categories } from "@/components/category-combobox";
import { HomeControl } from "@/components/home-control";
import { Button } from "@/components/ui/button";
import {
  getFeatureData,
  toggleOptionInSource,
  zoomToFeatureBounds,
} from "@/lib/state-management";
// import { renderToStaticMarkup, renderToString } from "react-dom/server";
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
  const [lngLat, setLngLat] = useState<number[]>();
  const features = useFormMap((state) => state.features);
  const selectedFeatures = useFormMap((state) => state.selectedFeatures);
  const setSelectedFeatures = useFormMap((state) => state.setSelectedFeatures);
  const setTempSpatialFull = useFormMap((state) => state.setTempSpatialFull);

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
          if (!featureSource) {
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
                        // @ts-expect-error
                        value: f.value,
                        // @ts-expect-error
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
      <GeolocateControl />
      <ScaleControl />
      {layerName && geojson && (
        <>
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
          {selectedFeatureName && lngLat && lngLat.length > 0 && (
            <Popup
              closeOnClick={false}
              longitude={lngLat[0]}
              latitude={lngLat[1]}
              ref={popupRef}
            >
              <div>
                <p className="tw:text-xl">
                  <strong>{selectedFeatureName}</strong>
                </p>
                <Button
                  className="btn btn-light"
                  onClick={async () => {
                    let newSelectedFeatures = [...selectedFeatures];
                    const existingValueIndex = selectedFeatures.findIndex(
                      (opt) =>
                        // @ts-expect-error
                        opt.value === selectedFeatureName &&
                        // @ts-expect-error
                        opt.category === currentCategory.label,
                    );
                    if (existingValueIndex > -1)
                      newSelectedFeatures.splice(existingValueIndex, 1);
                    else {
                      // @ts-expect-error
                      newSelectedFeatures = [
                        ...selectedFeatures,
                        {
                          value: selectedFeatureName,
                          // @ts-expect-error
                          category: currentCategory.label,
                        },
                      ];
                    }
                    // @ts-expect-error
                    setSelectedFeatures(newSelectedFeatures);
                    await toggleOptionInSource(
                      selectedFeatureName,
                      // @ts-expect-error
                      currentCategory?.label,
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
                      opt.category === currentCategory.label,
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
      {/* TODO: Add each selectedFeatures GeoJSON layer */}
    </GLMap>
  );
};

export { FormMap };
