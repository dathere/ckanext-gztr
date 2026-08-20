/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
import { ExampleMap } from "@/components/example-map";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "./App.css";
import type { Feature } from "maplibre-gl";
import { useEffect, useState } from "react";
import type { StacCollection, StacItem, StacLink } from "stac-ts";
import { FeatureCombobox } from "@/components/feature-combobox";
import { FormMap } from "@/components/form-map";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  // getPlaceKeywordsFromSpatialFull,
  runAddressSearch,
  simplifyGeojson,
} from "@/lib/utils";
import { useFormMap } from "@/stores/form-map-store";

export type FeatureProperties = {
  id?: string;
  // Actual key is collections[i].properties.label_key or else default expectation is "label"
  label?: string;
};

export type FeatureCollectionExt = {
  type?: string;
  features: Feature[];
  properties: FeatureCollectionProperties;
};

export type FeatureCollectionProperties = {
  // GeoJSON file name without .geojson (e.g. "State" or "NM_Counties"). Undefined when it is from user-"Drawn features".
  location?: string;
  // Human-readable name that shows up in the dropdown (e.g. "Counties" or "Public Water Systems")
  label: string;
  description: string;
  source: {
    description: string;
    url?: string;
  };
  id_key?: string;
  // Key in a `Feature`'s `properties` that has the human-readable label/name (e.g. "NAMELSAD")
  label_key?: string;
  quick_region_label?: string;
};

export type ItemCollection = {
  type: "FeatureCollection";
  features: StacItem[];
  links: StacLink[];
  numberMatched?: number;
  numberReturned?: number;
  collection_id?: string;
};

function App() {
  const [open, setOpen] = useState<boolean>();
  const [openStatewideAlert, setOpenStatewideAlert] = useState<boolean>();
  const [statewideChecked, setStatewideChecked] = useState<boolean>();
  const [searching, setSearching] = useState<boolean>();
  const formMap = useFormMap((state) => state.formMap);
  const setStacCollections = useFormMap((state) => state.setStacCollections);
  const itemCollections = useFormMap((state) => state.itemCollections);
  const setItemCollections = useFormMap((state) => state.setItemCollections);
  const setCurrentStacCollection = useFormMap(
    (state) => state.setCurrentStacCollection,
  );
  const searchValue = useFormMap((state) => state.searchValue);
  const setSearchValue = useFormMap((state) => state.setSearchValue);
  const spatial = useFormMap((state) => state.spatial);
  const setSpatial = useFormMap((state) => state.setSpatial);
  const spatialFull = useFormMap((state) => state.spatialFull);
  const setSpatialFull = useFormMap((state) => state.setSpatialFull);
  const quickRegionGeoJSON = useFormMap((state) => state.quickRegionGeoJSON);
  const tempSpatialFull = useFormMap((state) => state.tempSpatialFull);
  const setTempSpatialFull = useFormMap((state) => state.setTempSpatialFull);
  // const multiSelectRef = useFormMap((state) => state.multiSelectRef);
  const statewideEnabled = useFormMap((state) => state.statewideEnabled);
  const setStatewideEnabled = useFormMap((state) => state.setStatewideEnabled);
  const addressSearchResults = useFormMap(
    (state) => state.addressSearchResults,
  );
  const setAddressSearchResults = useFormMap(
    (state) => state.setAddressSearchResults,
  );
  const gm = useFormMap((state) => state.gm);
  const disableApplyButton = useFormMap((state) => state.disableApplyButton);
  const [fieldsAreInitialized, setFieldsAreInitialized] = useState(false);

  // On first load of the widget (e.g. dataset publisher goes to Add Dataset or Edit Dataset page)
  useEffect(() => {
    (async () => {
      // Get STAC collections metadata
      const stacCollections: StacCollection[] = await (
        await fetch(`/gztr/stac/collections`)
      ).json();
      setStacCollections(stacCollections);
      // Get all Items for each STAC collection
      // TODO: Optimize with only getting necessary ItemCollections instead of all on first page load
      const allItemCollections: ItemCollection[] = [];
      for (const collection of stacCollections) {
        const itemCollection: ItemCollection = await (
          await fetch(`/gztr/stac/collections/${collection.id}/items`)
        ).json();
        allItemCollections.push({
          ...itemCollection,
          collection_id: collection.id,
        });
      }
      setItemCollections(allItemCollections);
    })();
  }, []);

  useEffect(() => {
    // Check quick region extent switch if a collection exists with quick_region_label
    const statewideSwitch = document.querySelector("#statewide-switch");
    if (
      spatialFull?.features.length === 1
      // && spatialFull.features.at(0)?.properties.collection.properties.location ===
      // collections?.find((c) => c.properties.quick_region_label)?.properties
      //   .location
    ) {
      if (statewideSwitch) statewideSwitch.setAttribute("checked", "true");
    }
  }, [spatialFull]);

  useEffect(() => {
    if (!fieldsAreInitialized) setFieldsAreInitialized(true);
    const spatialFullTextbox = document.querySelector(
      "#field-spatial_full",
    ) as HTMLInputElement;
    if (fieldsAreInitialized && spatialFullTextbox)
      spatialFullTextbox.value = spatialFull ? JSON.stringify(spatialFull) : "";
    else if (spatialFullTextbox?.value) {
      setSpatialFull(JSON.parse(spatialFullTextbox?.value));
    }
    // const placeKeywordsTextbox = document.querySelector(
    //   "#field-place_keywords",
    // ) as HTMLInputElement;
    // if (statewideEnabled) {
    // if (placeKeywordsTextbox)
    //   placeKeywordsTextbox.value =
    //     collections?.find((c) => c.properties.quick_region_label)?.properties
    //       .label ?? "";
    // } else {
    // if (placeKeywordsTextbox)
    //   placeKeywordsTextbox.value =
    //     getPlaceKeywordsFromSpatialFull(spatialFull);
    // }
    const spatialTextbox = document.querySelector(
      "#field-spatial",
    ) as HTMLInputElement;
    if (fieldsAreInitialized && spatialTextbox)
      spatialTextbox.value = spatial ? JSON.stringify(spatial) : "";
    else if (spatialTextbox?.value)
      setSpatial(JSON.parse(spatialTextbox.value));
  }, [spatial, spatialFull]);

  return (
    <div className="control-group" data-module="gazetteer">
      <Dialog
        open={open}
        onOpenChange={(o) => {
          // If dialog is being opened
          if (o) {
            // TODO: Identify why spatialFull is undefined here.
            // Set tempSpatialFull to the spatialFull value from the textbox field
            // Also add geometry to each feature based on feature id and collection location
            const spatialFullFeatures = spatialFull?.features;
            if (spatialFullFeatures) {
              const featuresWithGeometry = spatialFullFeatures.map((f) => {
                const identifiedFeature = itemCollections
                  ?.find((iC) => iC.collection_id === f.collection)
                  ?.features.find((cf) => cf.properties.id === f.properties.id);
                const geometry = identifiedFeature?.geometry;
                if (geometry) f.geometry = geometry;
                return f;
              });
              spatialFull.features = featuresWithGeometry;
            }
            setTempSpatialFull(spatialFull);
          }
          // If dialog is being closed
          // IMPORTANT: This else statement does not run when using the Apply button
          else {
            setTempSpatialFull(undefined);
            setCurrentStacCollection(undefined);
          }
          setOpen(o);
        }}
        modal={false}
      >
        <form>
          <DialogTrigger asChild>
            <Button
              disabled={statewideEnabled}
              className="btn btn-primary"
              variant="outline"
              id="filter-click"
            >
              {spatialFull && spatialFull.features.length > 0 ? "Edit" : "Add"}{" "}
              Location Data
            </Button>
          </DialogTrigger>
          <DialogContent className="tw:sm:!max-w-[90%]">
            <DialogHeader>
              <DialogTitle>Add Location Information</DialogTitle>
              <DialogDescription className="tw:text-md">
                Use the tools below to specify the coverage area for this
                dataset on the map.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="flex flex-wrap row gy-2 mx-0 mb-2">
                <div className="px-0 tw:flex tw:justify-between tw:gap-16">
                  <div className="tw:flex tw:gap-1">
                    <Button
                      className="btn btn-primary"
                      id="add-drawn-features-button"
                      onClick={(e) => {
                        if (gm) {
                          const drawIsEnabled = gm.drawEnabled("polygon");
                          gm.toggleDraw("polygon");
                          const editFeaturesButton = document.querySelector(
                            "#edit-drawn-features-button",
                          );
                          if (editFeaturesButton) {
                            editFeaturesButton.toggleAttribute("disabled");
                          }
                          if (drawIsEnabled) {
                            e.currentTarget.innerText = "Draw features";
                            e.currentTarget.classList.replace(
                              "btn-danger",
                              "btn-primary",
                            );
                          } else {
                            e.currentTarget.innerText = "Stop drawing";
                            e.currentTarget.classList.replace(
                              "btn-primary",
                              "btn-danger",
                            );
                          }
                        }
                      }}
                    >
                      Draw features
                    </Button>
                    <Button
                      className="btn btn-primary"
                      id="edit-drawn-features-button"
                      onClick={(e) => {
                        if (gm) {
                          gm.toggleGlobalEditMode();
                          const addFeaturesButton = document.querySelector(
                            "#add-drawn-features-button",
                          );
                          if (addFeaturesButton) {
                            addFeaturesButton.toggleAttribute("disabled");
                          }
                          const button = e.currentTarget;
                          const currentInnerText = button.innerText;
                          if (currentInnerText === "Edit drawn features") {
                            button.innerText = "Stop editing";
                            button.classList.replace(
                              "btn-primary",
                              "btn-danger",
                            );
                          } else {
                            button.innerText = "Edit drawn features";
                            button.classList.replace(
                              "btn-danger",
                              "btn-primary",
                            );
                          }
                        }
                      }}
                    >
                      Edit drawn features
                    </Button>
                  </div>
                  <div className="tw:flex tw:gap-2">
                    <div
                      className="search-address-wrapper"
                      style={{
                        position: "relative",
                        display: "inline-block",
                      }}
                    >
                      <Input
                        className="rounded-2"
                        id="search-address-box"
                        type="text"
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            const map = formMap?.current?.getMap();
                            if (map) {
                              setSearching(true);
                              await runAddressSearch(
                                searchValue,
                                map,
                                setAddressSearchResults,
                              );
                              setSearching(false);
                            }
                          } else {
                            setAddressSearchResults([]);
                          }
                        }}
                        placeholder="Search for an address."
                        style={{ paddingRight: "40px", minWidth: "216px" }}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                      />
                      <Button
                        id="search-address-clear-button"
                        type="button"
                        className="d-none"
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          border: "none",
                          backgroundColor: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        X
                      </Button>
                    </div>
                    <Button
                      className="btn btn-primary"
                      type="button"
                      onClick={async () => {
                        const map = formMap?.current?.getMap();
                        if (map) {
                          setSearching(true);
                          await runAddressSearch(
                            searchValue,
                            map,
                            setAddressSearchResults,
                          );
                          setSearching(false);
                        }
                      }}
                      disabled={!searchValue}
                    >
                      {searching && <Spinner />}
                      Search address
                    </Button>
                    {addressSearchResults.length > 0 && (
                      <div
                        id="search-dropdown"
                        className="dropdown d-inline-flex"
                        style={{ width: "fit-content" }}
                      >
                        <Button
                          className="btn btn-secondary dropdown-toggle"
                          type="button"
                          id="dropdownMenu2"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          View results
                        </Button>
                        <ul
                          id="search-dropdown-list"
                          className="dropdown-menu"
                          // style={{ zIndex: 1001 }}
                          aria-labelledby="dropdownMenu2"
                        >
                          {addressSearchResults.map((address, idx) => (
                            <Button
                              className="tw:w-full tw:justify-start"
                              onClick={() => {
                                if (formMap) {
                                  const map = formMap?.current?.getMap();
                                  map.fitBounds(
                                    [
                                      [address.lon, address.lat],
                                      [address.lon, address.lat],
                                    ],
                                    { zoom: 5 },
                                  );
                                }
                              }}
                              variant="ghost"
                              key={idx}
                            >
                              {address.display_name}
                            </Button>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="tw:grid tw:grid-cols-6 tw:my-2 tw:gap-4">
                <div className="tw:col-span-2 tw:flex tw:flex-col tw:gap-4">
                  <FeatureCombobox />
                </div>
                <div className="tw:col-span-4">
                  <FormMap />
                </div>
              </div>
            </div>
            <DialogFooter>
              <span id="edit-info-button" className="d-none text-danger">
                Click the "Stop Editing Shape" button to continue.
              </span>
              <DialogClose>
                <Button
                  onClick={(e) => {
                    const confirmed = confirm(
                      "Are you sure you want to cancel? If you continue, any new selected features will not be saved.",
                    );
                    if (!confirmed) {
                      e.preventDefault();
                      return;
                    }
                    setTempSpatialFull(undefined);
                  }}
                  className="btn btn-danger"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                className="btn btn-success"
                disabled={disableApplyButton}
                onClick={() => {
                  if (tempSpatialFull) {
                    const newTempSpatialFull = structuredClone(tempSpatialFull);
                    if (tempSpatialFull.features.length > 0) {
                      // Remove geometry from spatialFull, exampleMap uses spatial, geometry added to tempSpatialFull.features
                      // Should not remove geometry from drawn features
                      const featuresNoGeometries =
                        newTempSpatialFull.features.map((f) => {
                          if (
                            // TODO: Fix
                            !(f.collection === "Drawn features")
                          )
                            f.geometry = null;
                          return f;
                        });
                      newTempSpatialFull.features = featuresNoGeometries;
                      setSpatialFull(newTempSpatialFull);
                    } else {
                      setSpatialFull(undefined);
                      setSpatial(undefined);
                    }
                  }
                  setOpen(false);
                  setTempSpatialFull(undefined);
                  setCurrentStacCollection(undefined);
                }}
              >
                {disableApplyButton
                  ? "You must click the Stop button at the top left first"
                  : "Apply"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
      {quickRegionGeoJSON && (
        <div className="form-check form-switch">
          <AlertDialog
            open={openStatewideAlert}
            onOpenChange={setOpenStatewideAlert}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.{" "}
                  {tempSpatialFull && tempSpatialFull.features.length > 0 && (
                    <p>
                      You currently have {tempSpatialFull.features.length}{" "}
                      selected feature
                      {tempSpatialFull.features.length > 1 ? "s" : ""}. If you
                      continue, your selected feature
                      {tempSpatialFull.features.length > 1 ? "s" : ""} will be
                      removed and the statewide extent will be selected instead.
                    </p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="btn btn-danger"
                  onClick={() => setOpenStatewideAlert(false)}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="btn btn-success"
                  onClick={() => {
                    setStatewideEnabled(true);
                    setOpenStatewideAlert(false);
                    setStatewideChecked(true);
                    if (quickRegionGeoJSON) {
                      setSpatialFull(quickRegionGeoJSON);
                      setSpatial(simplifyGeojson(quickRegionGeoJSON));
                    }
                  }}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Input
            className="form-check-input"
            checked={statewideChecked}
            type="checkbox"
            id="statewide-switch"
            onClick={(e) => {
              // @ts-expect-error
              const checked = e.target.checked;
              if (
                tempSpatialFull &&
                tempSpatialFull.features.length > 0 &&
                !statewideEnabled
              ) {
                e.preventDefault();
                setOpenStatewideAlert(true);
              } else {
                setStatewideEnabled(checked);
                setStatewideChecked(checked);
                if (checked && quickRegionGeoJSON) {
                  setSpatialFull(quickRegionGeoJSON);
                  setSpatial(simplifyGeojson(quickRegionGeoJSON));
                } else {
                  setSpatialFull(undefined);
                  setSpatial(undefined);
                }
              }
            }}
          />
          <Label className="form-check-label" htmlFor="statewide-switch">
            Statewide Extent?
          </Label>
        </div>
      )}
      <ExampleMap />
    </div>
  );
}

export default App;
