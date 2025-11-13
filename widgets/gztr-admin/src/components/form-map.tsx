import GLMap, { Layer, type MapRef, Source } from "react-map-gl/maplibre";
import "@/assets/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { useFormMap } from "@/stores/form-map-store";

const FormMap = ({ layerName }: { layerName?: string }) => {
  // @ts-expect-error
  const mapRef = useRef<MapRef>();
  const setFormMap = useFormMap((state) => state.setFormMap);
  const viewState = useFormMap((state) => state.viewState);
  const setViewState = useFormMap((state) => state.setViewState);
  const geojson = useFormMap((state) => state.geojson);
  const setGeojson = useFormMap((state) => state.setGeojson);

  useEffect(() => {
    if (layerName)
      (async () => {
        const data = await (
          await fetch(`/data/gztr-features/${layerName}.geojson`)
        ).json();
        setGeojson(data);
      })();
  }, [layerName, setGeojson]);

  useEffect(() => {
    if (mapRef) setFormMap(mapRef);
  }, [mapRef]);

  return (
    <GLMap
      {...viewState}
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
      {layerName && geojson && (
        <Source type="geojson" data={geojson}>
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
      {/* TODO: Add each selectedFeatures GeoJSON layer */}
    </GLMap>
  );
};

export { FormMap };
