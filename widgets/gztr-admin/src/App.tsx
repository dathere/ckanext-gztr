/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
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
import { runAddressSearch, simplifyGeojson } from "@/lib/utils";
import { useFormMap } from "@/stores/form-map-store";
import { extractFeaturesFromGeojson } from "./lib/state-management";

function App() {
  const [open, setOpen] = useState<boolean>();
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
  const tempSpatialFull = useFormMap((state) => state.tempSpatialFull);
  const setTempSpatialFull = useFormMap((state) => state.setTempSpatialFull);
  const mSRef = useRef<MultiSelectRef>(undefined);
  // const multiSelectRef = useFormMap((state) => state.multiSelectRef);
  const setMultiSelectRef = useFormMap((state) => state.setMultiSelectRef);

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
        const categoryOptions = [];
        for (const feature of geojson.features) {
          const featureName = feature.properties[category.nameKey];
          categoryOptions.push({
            value: featureName,
            label: featureName,
            geometry: feature.geometry,
            category: category.label,
          });
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
    const spatialFullTextbox = document.querySelector(
      "#field-spatial_full",
    ) as HTMLInputElement;
    if (spatialFull) {
      spatialFullTextbox.value = JSON.stringify(spatialFull);
      const placeKeywordsFeatures = extractFeaturesFromGeojson(spatialFull);
      const placeKeywords = placeKeywordsFeatures
        .map((f) =>
          placeKeywordsFeatures.filter((g) => g.value === f.value).length > 1
            ? `${f.value} (${f.category})`
            : f.value,
        )
        .join(", ");
      const placeKeywordsTextbox = document.querySelector(
        "#field-place_keywords",
      ) as HTMLInputElement;
      placeKeywordsTextbox.value = placeKeywords;
    }
    const spatialTextbox = document.querySelector(
      "#field-spatial",
    ) as HTMLInputElement;
    if (spatial) spatialTextbox.value = JSON.stringify(spatial);
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
                    <Button className="btn btn-primary" id="filter-button">
                      Draw Shape
                    </Button>
                    <Button className="btn btn-primary" id="drag-filter-button">
                      Edit Shape
                    </Button>
                    <Button className="btn btn-danger" id="clear-filter-button">
                      Clear All Shapes
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
                            const map = formMap?.current.getMap();
                            if (map) await runAddressSearch(searchValue, map);
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
                        if (map) await runAddressSearch(searchValue, map);
                      }}
                      disabled={!searchValue}
                    >
                      Search address
                    </Button>
                    <div
                      id="search-dropdown"
                      className="dropdown d-inline-flex d-none"
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
                      ></ul>
                    </div>
                    <span id="no-results-text" className="d-none text-danger">
                      No results found.
                    </span>
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
                    // TODO: Add ref to zustand state then use toggleOption in form-map for popup
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
                  onClick={() => {
                    setTempSpatialFull(undefined);
                  }}
                  className="btn btn-danger"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                className="btn btn-success"
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
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
      <div className="form-check form-switch">
        <Input
          className="form-check-input"
          type="checkbox"
          id="statewide-switch"
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
