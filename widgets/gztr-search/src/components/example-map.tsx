/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import * as turf from "@turf/turf";
import GLMap, {
  Layer,
  NavigationControl,
  ScaleControl,
  Source,
} from "react-map-gl/maplibre";
import "@/assets/maplibre-gl.css";
import { useState } from "react";
import { useFormMap } from "@/stores/form-map-store";

const ExampleMap = ({ config }: any) => {
  const [bboxGeojson, setBboxGeojson] = useState();
  const spatialFull = useFormMap((state) => state.spatialFull);

  return (
    <GLMap
      initialViewState={{
        latitude: config["ckanext.gztr.default_latitude"] ?? 34.0,
        longitude: config["ckanext.gztr.default_longitude"] ?? -106.018066,
        zoom: config["ckanext.gztr.default_zoom"] ?? 5,
      }}
      style={{ width: "100%", height: 400 }}
      mapStyle={config["ckanext.gztr.map_tile_server"] ?? "https://tiles.openfreemap.org/styles/liberty"}
      onLoad={(e) => {
        const map = e.target;
        // Display drawn bounding box if ext_bbox exists in URL query parameters
        const search = window.location.search;
        const extBboxString = new URLSearchParams(search).get("ext_bbox");
        if (extBboxString) {
          // Make a polygon GeoJSON and set it with state
          const extBbox = extBboxString.split(",");
          // [minX, minY, maxX, maxY]
          // @ts-expect-error
          const bboxPolygon = turf.bboxPolygon(extBbox);
          // @ts-expect-error
          setBboxGeojson(bboxPolygon);
          // @ts-expect-error
          map.fitBounds([
            [extBbox[0], extBbox[1]],
            [extBbox[2], extBbox[3]],
          ]);
        }
      }}
    >
      <NavigationControl position="top-left" />
      <ScaleControl />
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
      {bboxGeojson && (
        <Source type="geojson" data={bboxGeojson}>
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
