import GLMap, { Layer, Source } from "react-map-gl/maplibre";
import "@/assets/maplibre-gl.css";
import { useEffect } from "react";
import { useFormMap } from "@/stores/form-map-store";

const ExampleMap = () => {
  const collections = useFormMap((state) => state.collections);
  const quickRegionGeoJSON = useFormMap((state) => state.quickRegionGeoJSON);
  const setQuickRegionGeoJSON = useFormMap(
    (state) => state.setQuickRegionGeoJSON,
  );
  const spatial = useFormMap((state) => state.spatial);
  const statewideEnabled = useFormMap((state) => state.statewideEnabled);

  useEffect(() => {
    const quickRegionCategory = collections?.find(
      (c) => c.properties.quick_region_label,
    );
    // TODO: If collections has the data then grab it from there
    if (quickRegionCategory)
      (async () => {
        const data = await (
          await fetch(
            `/file/public-download/gztr/${quickRegionCategory.properties.location}`,
          )
        ).json();
        setQuickRegionGeoJSON(data);
      })();
  }, [collections, setQuickRegionGeoJSON]);

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
      {spatial && (
        <Source type="geojson" data={spatial}>
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
