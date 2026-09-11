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
import type { StacItem } from "stac-ts";
import type { ItemCollection } from "@/App";
import { HomeControl } from "@/components/home-control";
import { Button } from "@/components/ui/button";
import { getItemCollectionFromAPI, getItemFromAPI } from "@/lib/utils";
import { useFormMap } from "@/stores/form-map-store";
import { ZoomToFeaturesControl } from "@/components/zoom-to-features-control";

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
  const stacCollections = useFormMap((state) => state.stacCollections);
  const itemCollections = useFormMap((state) => state.itemCollections);
  const setItemCollections = useFormMap((state) => state.setItemCollections);
  const currentStacCollection = useFormMap(
    (state) => state.currentStacCollection,
  );
  const setCurrentStacCollection = useFormMap(
    (state) => state.setCurrentStacCollection,
  );
  const tempSpatialFull = useFormMap((state) => state.tempSpatialFull);
  const setTempSpatialFull = useFormMap((state) => state.setTempSpatialFull);
  const setDownloadingCollection = useFormMap(
    (state) => state.setDownloadingCollection,
  );
  const [selectedFeature, setSelectedFeature] = useState<Feature>();
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
      const identifiedCollection = stacCollections?.find(
        (c) => c.id === currentStacCollection?.id,
      );
      if (identifiedCollection) {
        const feature = renderedFeatures.at(0);
        if (feature) {
          // @ts-expect-error
          feature.collection = identifiedCollection.id;
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
      if (currentStacCollection) {
        const itemCollection = itemCollections?.find(
          (iC) => iC.collection_id === currentStacCollection.id,
        );
        if (itemCollection) {
          if (itemCollection.features.length > 0) {
            if (itemCollection.features.at(0)?.geometry) {
              setCurrentCollectionGeoJSON(itemCollection);
            } else {
              // Fetch the entire ItemCollection if a feature's geometry does not exist
              // We make an assumption that all Items in an ItemCollection must have a geometry
              const allItemCollections: ItemCollection[] = [];
              if (itemCollections)
                for (const itemCollection of itemCollections.filter(
                  (iC) => iC.collection_id !== currentStacCollection.id,
                )) {
                  allItemCollections.push(itemCollection);
                }
              const currentItemCollection = await getItemCollectionFromAPI(
                currentStacCollection.id,
              );
              setCurrentCollectionGeoJSON(currentItemCollection);
              allItemCollections.push({
                ...currentItemCollection,
                collection_id: currentStacCollection.id,
              });
              setItemCollections(allItemCollections);
              setDownloadingCollection(undefined);
            }
          }
        } else {
          const allItemCollections: ItemCollection[] = [];
          if (itemCollections)
            for (const itemCollection of itemCollections) {
              allItemCollections.push(itemCollection);
            }
          const currentItemCollection = await getItemCollectionFromAPI(
            currentStacCollection.id,
          );
          setCurrentCollectionGeoJSON(currentItemCollection);
          allItemCollections.push({
            ...currentItemCollection,
            collection_id: currentStacCollection.id,
          });
          setItemCollections(allItemCollections);
        }
      }
      // Enable the popup on click of a geometry on the map
      if (formMap) {
        const map = formMap.current?.getMap();
        if (map) await enablePopup(map);
      }
    })();
  }, [currentStacCollection, setCurrentCollectionGeoJSON]);

  useEffect(() => {
    // @ts-expect-error
    if (mapRef) setFormMap(mapRef);
  }, [mapRef]);

  return (
    <GLMap
      {...viewState}
      id="form-map"
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
            // Show popup on click of already selected features
            map.on("click", "featureLayer", async (e) => {
              // @ts-expect-error
              const collection = e.features[0].collection;
              // Add popup for currently selected feature layer (drawn and not drawn)
              const theCurrentStacCollection = stacCollections?.find(
                (c) => c.id === collection,
              );
              setCurrentStacCollection(theCurrentStacCollection);
              // We assume if we can't find the STAC Collection that this is a drawn feature
              if (!theCurrentStacCollection) {
                // @ts-expect-error
                e.features[0].collection = "Drawn features";
              }
              // @ts-expect-error
              setSelectedFeature(e.features[0]);
              setLngLat([e.lngLat.lng, e.lngLat.lat]);
              if (popupRef.current) popupRef.current.addTo(map);
            });
            // Geoman event handlers
            map.once("gm:loaded", async () => {
              setDisableApplyButton(false);
              // For each drawn feature add as GM feature
              // Add geometry to tempSpatialFull.features (using collections) and use that throughout this
              // Check if geometry in ItemCollections otherwise fetch from Action API
              // Purpose: Display tempSpatialFull feature geometries on the map
              if (tempSpatialFull) {
                const nTSFFeatures = await Promise.all(
                  tempSpatialFull?.features
                    .filter((f) => f.collection !== "Drawn features")
                    .map(async (f) => {
                      const collectionId = f.collection;
                      if (collectionId) {
                        const foundFeature =
                          itemCollections
                            ?.find((iC) => iC.collection_id === collectionId)
                            ?.features.find(
                              (g) => g.id === f.id && g.geometry,
                            ) ?? (await getItemFromAPI(collectionId, f.id));
                        const featureWithGeometry = structuredClone(f);
                        featureWithGeometry.geometry = foundFeature?.geometry;
                        return featureWithGeometry;
                      }
                    })
                    .filter((item) => item !== undefined),
                );
                tempSpatialFull?.features
                  .filter((f) => f.collection === "Drawn features")
                  .forEach((g) => nTSFFeatures.push(g));
                const tempSpatialFullWithGeometry =
                  structuredClone(tempSpatialFull);
                // @ts-expect-error
                tempSpatialFullWithGeometry.features = nTSFFeatures;
                tempSpatialFullWithGeometry?.features?.forEach((dF) => {
                  // TODO: Make only drawn features editable
                  if (dF.geometry)
                    // @ts-expect-error
                    newGm.features.importGeoJsonFeature(dF);
                });
                setTempSpatialFull(tempSpatialFullWithGeometry);
                try {
                  // @ts-expect-error
                  map.fitBounds(turf.bbox(tempSpatialFullWithGeometry));
                } catch {
                  console.error(
                    "Error while attempting to fit map to selected/drawn feature bounding box.",
                  );
                }
              }
            });
            map.on("gm:create", async (event: FeatureCreatedFwdEvent) => {
              // When the user creates a new drawn geospatial feature (polygon)
              // tempSpatialFull should be updated to include this new drawn feature
              // (once tempSpatialFull is updated) The FeatureCombobox should have a new ComboboxChip with the drawn feature's ID/name and a zoom button and a delete button
              // Zoom to the drawn polygon
              // Ensure the map source has this polygon included
              // We need to construct a new STAC Item based on the drawn polygon to add to tempSpatialFull
              // We keep the required info minimal so it may not be fully STAC Item compliant
              const drawnFeature: StacItem = {
                collection: "Drawn features",
                id: event.feature.id.toString(),
                properties: {
                  title: event.feature.id.toString(),
                },
                // We keep geometry since it is a drawn feature
                // @ts-expect-error
                geometry: event.feature._geoJson.geometry,
                links: [],
                type: "Feature",
              };
              // We have to add the drawn feature to the map source featureSource
              const mapFeaturesWithNewDrawnFeature = newGm.features;
              mapFeaturesWithNewDrawnFeature.delete(drawnFeature.id);
              // @ts-expect-error
              mapFeaturesWithNewDrawnFeature.importGeoJsonFeature(drawnFeature);
              // @ts-expect-error
              map.fitBounds(turf.bbox(drawnFeature));
              setTempSpatialFull(
                // @ts-expect-error
                mapFeaturesWithNewDrawnFeature.exportGeoJson(),
              );
            });
            // On done with edit event, update drawn features
            map.on("gm:editend", async (event: GmEditFeatureEditEndEvent) => {
              // @ts-expect-error
              map.fitBounds(turf.bbox(event.feature._geoJson));
              setTempSpatialFull(
                // @ts-expect-error
                newGm.features.exportGeoJson(),
              );
            });
            map.on(
              "gm:globaleditmodetoggled",
              async (event: GlobalEditToggledFwdEvent) => {
                if (event.action === "mode_start") {
                  setDisableApplyButton(true);
                } else if (event.action === "mode_end") {
                  setDisableApplyButton(false);
                }
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
          }
        }
      }}
    >
      <HomeControl />
      {gm?.features.getAll().features.length &&
        gm?.features.getAll().features.length > 0 && (
          <ZoomToFeaturesControl gm={gm} />
        )}
      <NavigationControl />
      <FullscreenControl />
      <ScaleControl />
      {currentCollectionGeoJSON && currentStacCollection && (
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
      {selectedFeature &&
        // @ts-expect-error
        ((selectedFeature.collection === "Drawn features" &&
          tempSpatialFull?.features.find(
            (f) => f?.properties && f.id === selectedFeature.id,
          )) ||
          // @ts-expect-error
          selectedFeature.collection !== "Drawn features") &&
        lngLat &&
        lngLat.length > 0 && (
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
                <div className="tw:w-full">
                  <span className="tw:text-xl">
                    <strong>{selectedFeature.properties.title}</strong>
                  </span>
                  <br />
                  {currentStacCollection && (
                    <span className="tw:text-md">
                      <strong>Collection: {currentStacCollection.title}</strong>
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
                  // Add feature to tempSpatialFull
                  const newTempSpatialFull: ItemCollection = tempSpatialFull
                    ? structuredClone(tempSpatialFull)
                    : {
                        type: "FeatureCollection",
                        features: [],
                        links: [],
                      };
                  const featureToRemove = newTempSpatialFull?.features.find(
                    (f) => f.id === selectedFeature.id.toString(),
                  );
                  // User clicked "Remove this feature"
                  if (featureToRemove) {
                    const featureToRemoveIndex =
                      newTempSpatialFull?.features.findIndex(
                        (f) => f.id === selectedFeature.id.toString(),
                      );
                    // If feature to remove exists in tempSpatialFull (undefined check is required here)
                    if (
                      featureToRemoveIndex !== undefined &&
                      featureToRemoveIndex > -1
                    ) {
                      // Delete feature from tempSpatialFull
                      newTempSpatialFull?.features.splice(
                        featureToRemoveIndex,
                        1,
                      );
                      setTempSpatialFull(newTempSpatialFull);
                      // Delete feature from Geoman features
                      gm?.features.delete(featureToRemove.id);
                    }
                  }
                  // User clicked "Select this feature"
                  else {
                    // TODO: Handle undefined scenarios
                    // Get feature from itemCollections, not the map
                    const stacItem = itemCollections
                      ?.find(
                        (c) =>
                          c.collection_id ===
                          // @ts-expect-error
                          selectedFeature.collection,
                      )
                      ?.features.find(
                        (f) => f.id === selectedFeature.id.toString(),
                      );
                    // @ts-expect-error
                    newTempSpatialFull?.features.push(stacItem);
                    setTempSpatialFull(newTempSpatialFull);
                    // Add feature to Geoman features
                    // @ts-expect-error
                    gm?.features.importGeoJsonFeature(stacItem);
                  }
                }}
              >
                {tempSpatialFull?.features.find(
                  (f) => f.id === selectedFeature.id.toString(),
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
