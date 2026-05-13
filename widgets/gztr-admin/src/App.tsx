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
import { useEffect, useRef, useState } from "react";
import { CategoryCombobox, categories } from "@/components/category-combobox";
import { FormMap } from "@/components/form-map";
import {
  MultiSelect,
  type MultiSelectGroup,
  type MultiSelectRef,
} from "@/components/multi-select";
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
import { extractFeaturesFromGeojson } from "@/lib/state-management";
import { runAddressSearch, simplifyGeojson } from "@/lib/utils";
import { useFormMap } from "@/stores/form-map-store";

function App() {
  const [open, setOpen] = useState<boolean>();
  const [openStatewideAlert, setOpenStatewideAlert] = useState<boolean>();
  const [statewideChecked, setStatewideChecked] = useState<boolean>();
  const [searching, setSearching] = useState<boolean>();
  const formMap = useFormMap((state) => state.formMap);
  const currentCategory = useFormMap((state) => state.currentCategory);
  const setCurrentCategory = useFormMap((state) => state.setCurrentCategory);
  const features = useFormMap((state) => state.features);
  const setFeatures = useFormMap((state) => state.setFeatures);
  const searchValue = useFormMap((state) => state.searchValue);
  const setSearchValue = useFormMap((state) => state.setSearchValue);
  const selectedFeatures = useFormMap((state) => state.selectedFeatures);
  const setSelectedFeatures = useFormMap((state) => state.setSelectedFeatures);
  const spatial = useFormMap((state) => state.spatial);
  const setSpatial = useFormMap((state) => state.setSpatial);
  const spatialFull = useFormMap((state) => state.spatialFull);
  const setSpatialFull = useFormMap((state) => state.setSpatialFull);
  const stateGeojson = useFormMap((state) => state.stateGeojson);
  const tempSpatialFull = useFormMap((state) => state.tempSpatialFull);
  const setTempSpatialFull = useFormMap((state) => state.setTempSpatialFull);
  const mSRef = useRef<MultiSelectRef>(undefined);
  // const multiSelectRef = useFormMap((state) => state.multiSelectRef);
  const setMultiSelectRef = useFormMap((state) => state.setMultiSelectRef);
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

  useEffect(() => {
    if (mSRef) setMultiSelectRef(mSRef);
  }, [mSRef]);

  useEffect(() => {
    (async () => {
      const featureGroups: MultiSelectGroup[] = [];
      // Store selected category's currentCategory GeoJSON data
      for (const category of categories) {
        const geojson = await (
          await fetch(`/data/gztr-features/${category.value}.geojson`)
        ).json();
        // Store selected category's feature names in features variable
        const categoryOptions: any[] = [];
        for (const feature of geojson.features) {
          const featureName = feature.properties[category.nameKey];
          const featureData: any = {
            value: featureName,
            label: featureName,
            geometry: feature.geometry,
            category: category.label,
          };
          if (feature.properties.pid)
            featureData.pid = feature.properties.pid;
          categoryOptions.push(featureData);
        }
        const categoryFeaturesGroup: MultiSelectGroup = {
          heading: category.label,
          options: categoryOptions
            .filter(
              (o, index, arr) =>
                arr.findIndex(
                  (item) =>
                    JSON.stringify(item.label) === JSON.stringify(o.label),
                ) === index,
            )
            .sort((a, b) => (a.label < b.label ? -1 : 1)),
        };
        featureGroups.push(categoryFeaturesGroup);
      }
      setFeatures(featureGroups);
    })();
  }, []);

  useEffect(() => {
    if (!fieldsAreInitialized) setFieldsAreInitialized(true);
    const spatialFullTextbox = document.querySelector(
      "#field-spatial_full",
    ) as HTMLInputElement;
    if (fieldsAreInitialized)
      spatialFullTextbox.value = spatialFull ? JSON.stringify(spatialFull) : "";
    else if (spatialFullTextbox.value)
      setSpatialFull(JSON.parse(spatialFullTextbox.value));
    const placeKeywordsTextbox = document.querySelector(
      "#field-place_keywords",
    ) as HTMLInputElement;
    if (statewideEnabled) {
      placeKeywordsTextbox.value = "New Mexico";
    } else {
      const placeKeywordsFeatures = extractFeaturesFromGeojson(spatialFull);
      const placeKeywords = placeKeywordsFeatures
        .filter((f) => f.category !== "Drawn features")
        .map((f) =>
          placeKeywordsFeatures.filter((g) => g.value === f.value).length > 1
            ? `${f.value} (${f.category})`
            : f.value,
        )
        .join(", ");
      placeKeywordsTextbox.value = placeKeywords;
    }
    const spatialTextbox = document.querySelector(
      "#field-spatial",
    ) as HTMLInputElement;
    if (fieldsAreInitialized)
      spatialTextbox.value = spatial ? JSON.stringify(spatial) : "";
    else if (spatialTextbox.value) setSpatial(JSON.parse(spatialTextbox.value));
  }, [spatial, spatialFull]);

  return (
    <div className="control-group" data-module="gazetteer">
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (o) {
            setTempSpatialFull(spatialFull);
            const existingFeatures = extractFeaturesFromGeojson(spatialFull);
            // @ts-expect-error
            setSelectedFeatures(existingFeatures);
          }
          // If dialog is being closed
          else {
            setTempSpatialFull(undefined);
            const existingFeatures = extractFeaturesFromGeojson(spatialFull);
            // @ts-expect-error
            setSelectedFeatures(existingFeatures);
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
              {selectedFeatures.length > 0 ? "Edit" : "Add"} Location Data
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
                    {/* <Button
                      className="btn btn-danger"
                      id="clear-filter-button"
                      onClick={async () => {
                        setTempSpatialFull(undefined);
                        setSelectedFeatures([]);
                        if (formMap) {
                          const map = formMap.current.getMap();
                          const featureSource = map.getSource("featureSource");
                          const geojsonData =
                            // @ts-expect-error
                            await featureSource.getData();
                          geojsonData.features = [];
                          // @ts-expect-error
                          featureSource.setData(geojsonData);
                        }
                      }}
                    >
                      Clear all features
                    </Button> */}
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
                            const map = formMap?.current.getMap();
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
                        const map = formMap?.current.getMap();
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
                                  const map = formMap.current.getMap();
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
                  <CategoryCombobox
                    currentCategory={currentCategory}
                    // @ts-expect-error
                    setCurrentCategory={setCurrentCategory}
                  />
                  <MultiSelect
                    // ref={mSRef}
                    className="tw:mt-2"
                    placeholder="Select features for your dataset."
                    options={features}
                    // @ts-expect-error
                    onValueChange={setSelectedFeatures}
                    defaultValue={selectedFeatures}
                    modalPopover={false}
                    autoSize={true}
                    maxCount={100}
                    hideSelectAll={true}
                    gm={gm}
                  />
                </div>
                <div className="tw:col-span-4">
                  <FormMap layerName={currentCategory?.value} />
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
                    const confirmed = confirm("Are you sure you want to cancel? If you continue, any new selected features will not be saved.");
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
                  setSpatialFull(tempSpatialFull);
                  setSpatial(simplifyGeojson(tempSpatialFull));
                  setOpen(false);
                  setTempSpatialFull(undefined);
                  setSelectedFeatures(
                    // @ts-expect-error
                    extractFeaturesFromGeojson(tempSpatialFull),
                  );
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
      <div className="form-check form-switch">
        <AlertDialog
          open={openStatewideAlert}
          onOpenChange={setOpenStatewideAlert}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. You currently have{" "}
                {selectedFeatures.length} selected feature
                {selectedFeatures.length > 1 ? "s" : ""}. If you continue, your
                selected feature{selectedFeatures.length > 1 ? "s" : ""} will be
                removed and the statewide extent will be selected instead.
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
                  setSelectedFeatures([]);
                  setStatewideChecked(true);
                  setSpatialFull(stateGeojson);
                  setSpatial(simplifyGeojson(stateGeojson));
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
            if (selectedFeatures.length > 0 && !statewideEnabled) {
              e.preventDefault();
              setOpenStatewideAlert(true);
            } else {
              setStatewideEnabled(checked);
              setStatewideChecked(checked);
              if (checked) {
                setSpatialFull(stateGeojson);
                setSpatial(simplifyGeojson(stateGeojson));
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
      <ExampleMap />
      {/* <div className="tw:flex tw:flex-wrap tw:gap-2 tw:my-4">
        <div className="tw:grid tw:w-full tw:max-w-md tw:items-center tw:gap-3">
          <Label htmlFor="spatial">Spatial data</Label>
          <Input
            type="text"
            id="spatial"
            value={JSON.stringify(spatial)}
            disabled
            placeholder="Filled in automatically as you select features above."
          />
        </div>
      </div> */}
    </div>
  );
}

export default App;
