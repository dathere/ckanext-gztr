/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import GLMap, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
} from "react-map-gl/maplibre";
import "@/assets/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { useFormMap } from "@/stores/form-map-store";
import "@/assets/maplibre-gl.css";
import { Geoman } from "@geoman-io/maplibre-geoman-free";
import { MapPinIcon, XCircleIcon } from "lucide-react";
import type { StacCollection } from "stac-ts";
import { Button } from "@/components/ui/button";

const SearchMap = ({ config }: any) => {
  const popupRef = useRef<maplibregl.Popup>(undefined);
  const [currentGeojson, setCurrentGeojson] = useState();
  const [selectedFeatureName, setSelectedFeatureName] = useState<string>();
  const [lngLat, setLngLat] = useState<number[]>();
  const searchResultMarkerLngLat = useFormMap(
    (state) => state.searchResultMarkerLngLat,
  );
  const currentCollection = useFormMap((state) => state.currentCollection);
  const searchMap = useFormMap((state) => state.searchMap);
  const collections = useFormMap((state) => state.collections);
  const setCollections = useFormMap((state) => state.setCollections);
  const setSearchMap = useFormMap((state) => state.setSearchMap);
  const setGm = useFormMap((state) => state.setGm);

  useEffect(() => {
    (async () => {
      const data: StacCollection[] = await (
        await fetch(`/gztr/stac/collections`)
      ).json();
      // TODO: Sort by title
      const collections = data;
      setCollections(collections);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (currentCollection && collections) {
        if (popupRef.current) popupRef.current.remove();
        // Get FeatureCollection of the specified collection
        const data = (
          await (
            await fetch(`/gztr/stac/collections/${currentCollection.id}/items`)
          ).json()
        );
        setCurrentGeojson(data);
        if (searchMap) {
          // Add popups for each GeoJSON feature with details and select button
          if (searchMap)
            searchMap.on("click", "featuresFill", (e) => {
              const renderedFeatures = searchMap.queryRenderedFeatures(
                [e.point.x, e.point.y],
                {
                  layers: ["featuresFill"],
                },
              );
              // Get the Item's (Feature's) title from its properties
              const featureName = renderedFeatures.at(0)?.properties.title;
              setSelectedFeatureName(featureName);
              setLngLat([e.lngLat.lng, e.lngLat.lat]);
              if (popupRef.current) popupRef.current.addTo(searchMap);
            });
        }
      }
    })();
  }, [currentCollection, collections]);

  return (
    <GLMap
      onLoad={(e) => {
        const map = e.target;
        setSearchMap(map);
        const gm = new Geoman(map, {
          settings: {
            controlsUiEnabledByDefault: false,
          },
        });
        setGm(gm);
        map.on("gm:create", (event) => {
          const coordinates = event.feature.getGeoJson().geometry.coordinates;
          // ext_bbox={minx},{miny},{maxx},{maxy}
          const minx = coordinates[0][0][0];
          const miny = coordinates[0][0][1];
          const maxx = coordinates[0][2][0];
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
        latitude: config["ckanext.gztr.default_latitude"] ?? 34.0,
        longitude: config["ckanext.gztr.default_longitude"] ?? -106.018066,
        zoom: config["ckanext.gztr.default_zoom"] ?? 5,
      }}
      style={{ width: "100%", height: 400, borderRadius: "1rem" }}
      mapStyle={config["ckanext.gztr.map_tile_server"] ?? "https://tiles.openfreemap.org/styles/liberty"}
    >
      <NavigationControl position="top-left" />
      <ScaleControl />
      {currentCollection && currentGeojson && (
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
      {searchResultMarkerLngLat?.lon && searchResultMarkerLngLat?.lat && (
        <Marker
          longitude={searchResultMarkerLngLat.lon}
          latitude={searchResultMarkerLngLat.lat}
        >
          <MapPinIcon fill="#87cefa" />
        </Marker>
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
