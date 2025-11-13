import GLMap from "react-map-gl/maplibre";
import "@/assets/maplibre-gl.css";

const ExampleMap = () => {
  return (
    <GLMap
      initialViewState={{
        latitude: 34.307144,
        longitude: -106.018066,
        zoom: 5,
      }}
      style={{ width: "100%", height: 400, borderRadius: "1rem" }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    />
  );
};

export { ExampleMap };
