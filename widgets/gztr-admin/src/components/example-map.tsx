import GLMap, { Layer, Source } from "react-map-gl/maplibre";
import "@/assets/maplibre-gl.css";
import { useEffect } from "react";
import { useFormMap } from "@/stores/form-map-store";

const ExampleMap = () => {
  const stateGeojson = useFormMap((state) => state.stateGeojson);
  const setStateGeojson = useFormMap((state) => state.setStateGeojson);
  const spatialFull = useFormMap((state) => state.spatialFull);
  const statewideEnabled = useFormMap((state) => state.statewideEnabled);

  useEffect(() => {
    (async () => {
      const data = await (
        await fetch(`/data/gztr-features/NM_State.geojson`)
      ).json();
      setStateGeojson(data);
    })();
  }, []);

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
      {spatialFull && (
        <Source type="geojson" data={spatialFull}>
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
      {statewideEnabled && stateGeojson && (
        <Source type="geojson" data={stateGeojson}>
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
