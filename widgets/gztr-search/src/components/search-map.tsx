/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import GLMap, {
  Layer,
  type MapRef,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
} from "react-map-gl/maplibre";
import "@/assets/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { useFormMap } from "@/stores/form-map-store";
import "@/assets/maplibre-gl.css";
import { XCircleIcon } from "lucide-react";
import { categories } from "@/components/category-combobox";
import { Button } from "@/components/ui/button";
import { Geoman } from "@geoman-io/maplibre-geoman-free";

const SearchMap = () => {
  const searchMapRef = useRef<MapRef>(undefined);
  const popupRef = useRef<maplibregl.Popup>(undefined);
  const [currentGeojson, setCurrentGeojson] = useState();
  const [selectedFeatureName, setSelectedFeatureName] = useState<string>();
  const [lngLat, setLngLat] = useState<number[]>();
  const currentCategory = useFormMap((state) => state.currentCategory);
  const setGm = useFormMap((state) => state.setGm);

  // TODO: somehow cache GeoJSON files

  useEffect(() => {
    (async () => {
      if (currentCategory) {
        if (popupRef.current) popupRef.current.remove();
        const data = await (
          await fetch(`/data/gztr-features/${currentCategory.value}.geojson`)
        ).json();
        setCurrentGeojson(data);
        if (searchMapRef) {
          // Add popups for each GeoJSON feature with details and select button
          const map = searchMapRef.current?.getMap();
          if (map)
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
      }
    })();
  }, [currentCategory]);

  return (
    <GLMap
      // @ts-expect-error
      ref={searchMapRef}
      onLoad={(e) => {
        const map = e.target;
        const gm = new Geoman(map, {
          settings: {
            controlsUiEnabledByDefault: false,
          },
        });
        setGm(gm);
        map.on("gm:create", (event) => {
          const coordinates = event.feature.getGeoJson().geometry.coordinates;
          // ext_bbox={minx},{miny},{maxx},{maxy}
          // @ts-expect-error
          const minx = coordinates[0][0][0];
          // @ts-expect-error
          const miny = coordinates[0][0][1];
          // @ts-expect-error
          const maxx = coordinates[0][2][0];
          // @ts-expect-error
          const maxy = coordinates[0][2][1];
          const ext_bbox = `${minx},${miny},${maxx},${maxy}`;
          // const default_spatial_query =
          //   "{{!field f=spatial}}Intersects(ENVELOPE({minx}, {maxx}, {maxy}, {miny}))";
          // const fq_list = encodeURIComponent(
          //   "[{{!field f=spatial}}Intersects(ENVELOPE({minx}, {maxx}, {maxy}, {miny}))]",
          // );
          window.location.href = `/dataset?q=&sort=score+desc%2C+metadata_modified+desc&ext_bbox=${encodeURIComponent(ext_bbox)}`;
        });
      }}
      initialViewState={{
        latitude: 34.0,
        longitude: -106.018066,
        zoom: 5,
      }}
      style={{ width: "100%", height: 400, borderRadius: "1rem" }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      <NavigationControl position="top-left" />
      <ScaleControl />
      {currentCategory && currentGeojson && (
        <Source type="geojson" data={currentGeojson}>
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
          // @ts-expect-error
          ref={popupRef}
          closeButton={false}
        >
          <div>
            <div className="tw:flex tw:justify-between tw:w-full tw:gap-4">
              <span className="tw:text-xl">
                <strong>{selectedFeatureName}</strong>
              </span>
              <Button
                className="tw:w-4 tw:p-0 tw:m-0 tw:h-fit tw:cursor-pointer tw:rounded-full"
                variant="ghost"
                size="icon"
                onClick={() => popupRef.current?.remove()}
              >
                <XCircleIcon />
              </Button>
            </div>
          </div>
        </Popup>
      )}
    </GLMap>
  );
};

export { SearchMap };
