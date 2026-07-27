import * as turf from "@turf/turf";
import Fuse from "fuse.js";
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  MapPinnedIcon,
  SearchIcon,
  SearchXIcon,
} from "lucide-react";
import type { Feature } from "maplibre-gl";
import { useState } from "react";
import type { FeatureCollectionExt } from "@/App";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";
import { useFormMap } from "@/stores/form-map-store";
import { Button } from "./ui/button";

export function FeatureCombobox() {
  // Used to ensure the popup dropdown stays at and at the width of the combobox
  const anchor = useComboboxAnchor();
  const [userQuery, setUserQuery] = useState<string>();
  const [openCollapsibles, setOpenCollapsibles] = useState(false);
  const formMap = useFormMap((state) => state.formMap);
  const collections = useFormMap((state) => state.collections);
  const currentCollection = useFormMap((state) => state.currentCollection);
  const setCurrentCollection = useFormMap(
    (state) => state.setCurrentCollection,
  );
  const tempSpatialFull = useFormMap((state) => state.tempSpatialFull);
  const setTempSpatialFull = useFormMap((state) => state.setTempSpatialFull);

  return (
    <Combobox
      // When user query changes
      onInputValueChange={(inputValue) => {
        setUserQuery(inputValue);
        if (inputValue) setOpenCollapsibles(true);
        else setOpenCollapsibles(false);
      }}
      on
      items={collections?.filter((c) => !c.properties.quick_region_label)}
      multiple
      // TODO: Identify scenarios where selected values still persist even after closing and opening the dialog
      value={tempSpatialFull?.features ?? []}
      isItemEqualToValue={(itemValue, value) => {
        return (
          Object.is(itemValue, value) ||
          (itemValue.properties[
            itemValue.properties.collection?.properties.id_key ?? "id"
          ] ===
            value.properties[
              value.properties.collection?.properties.id_key ?? "id"
            ] &&
            itemValue.properties.collection?.properties.location ===
              value.properties.collection?.properties.location)
        );
      }}
      // When user selection changes
      onValueChange={(value) => {
        // Get map layer info; e.g. for adding/removing a darker layer for the selected feature
        const map = formMap?.current?.getMap();
        const featureSource = map?.getSource("featureSource");
        const newTempSpatialFull = {
          type: "FeatureCollection",
          features: value,
          properties: {
            label: "Dataset's geospatial features",
            description:
              "Geospatial features selected by a dataset publisher for a CKAN dataset using the ckanext-gztr CKAN extension.",
            source: {
              // TODO: Get source info from site
              description: window.location.origin,
            },
          },
        };
        setTempSpatialFull(newTempSpatialFull);
        // Add the feature to the MapLibre featureSource Source (which is then highlighted as a selected feature)
        // Remove giant features array to prevent recursion error in Geoman usage
        const nTSFWithoutCollections = structuredClone(newTempSpatialFull);
        nTSFWithoutCollections.features = nTSFWithoutCollections.features.map(
          (f) => {
            delete f.properties.collection.features;
            return f;
          },
        );
        // @ts-expect-error
        featureSource?.setData(nTSFWithoutCollections);
      }}
      // @ts-expect-error
      filter={(collection: FeatureCollectionExt, query) => {
        const featureLabels: string[] = collection.features.map(
          (f) => f.properties[collection.properties.label_key ?? "label"],
        );
        const fuse = new Fuse(featureLabels, { threshold: 0.2 });
        return fuse.search(query).length > 0;
      }}
    >
      <ComboboxChips
        ref={anchor}
        className="tw:w-full tw:max-h-40 tw:overflow-y-scroll tw:flex tw:flex-col tw:flex-nowrap"
      >
        <ComboboxValue>
          <div className="tw:flex tw:gap-2 tw:w-full">
            <InputGroupAddon>
              <MapPinnedIcon />
            </InputGroupAddon>
            <ComboboxChipsInput placeholder="Click here to search and select geospatial features."></ComboboxChipsInput>
            <InputGroupAddon align="inline-end">
              <ChevronDownIcon />
            </InputGroupAddon>
          </div>
          <div className="tw:flex tw:flex-wrap tw:gap-2 tw:w-full">
            {tempSpatialFull?.features.map((feature) => (
              <ComboboxChip className="tw:bg-sky-200" key={feature.id}>
                {
                  feature.properties[
                    feature.properties.collection.properties.label_key ??
                      "label"
                  ]
                }
                <Button
                  className="tw:h-fit tw:has-[>svg]:p-1 tw:[&_svg:not([class*=size-])]:size-3"
                  variant="ghost"
                  onClick={() => {
                    const map = formMap?.current.getMap();
                    if (map) {
                      // @ts-expect-error
                      map.fitBounds(turf.bbox(feature));
                    }
                  }}
                >
                  <SearchIcon className="tw:w-3 tw:h-3" />
                </Button>
              </ComboboxChip>
            ))}
          </div>
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        {/* TODO: Consider some way to add a contact option for the site administrator as this is expected to be an erroneous state. */}
        <ComboboxEmpty>No geospatial features found.</ComboboxEmpty>
        <ComboboxList>
          {/* Refers to the value of the items attribute in <Combobox /> */}
          {(collection: FeatureCollectionExt, index) => (
            <ComboboxGroup
              key={collection.properties.location}
              items={collection.features}
            >
              <Collapsible
                open={openCollapsibles}
                onOpenChange={setOpenCollapsibles}
              >
                <CollapsibleTrigger className="tw:w-full tw:flex tw:justify-between tw:items-center">
                  <ComboboxLabel className="tw:text-md">
                    {collection.properties.label}
                  </ComboboxLabel>
                  <div className="tw:flex tw:items-center">
                    <Button
                      className="tw:w-4 tw:h-4 tw:p-0"
                      onClick={() => {
                        if (currentCollection) setCurrentCollection(undefined);
                        else setCurrentCollection(collection.properties);
                      }}
                      variant="ghost"
                    >
                      {currentCollection?.location ===
                      collection.properties.location ? (
                        <SearchXIcon className="tw:w-4 tw:h-4 tw:mr-1" />
                      ) : (
                        <SearchIcon className="tw:w-4 tw:h-4 tw:mr-1" />
                      )}
                    </Button>
                    <Button variant="ghost" className="tw:w-4 tw:h-4 tw:p-0">
                      <ChevronsUpDownIcon className="tw:w-4 tw:h-4 tw:mr-1" />
                    </Button>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ComboboxCollection>
                    {(feature: Feature) => {
                      const featureLabel: string =
                        feature.properties[
                          collection.properties.label_key ?? "label"
                        ];
                      const fuse = new Fuse([featureLabel], { threshold: 0.2 });
                      if (
                        !userQuery ||
                        (userQuery && fuse.search(userQuery).length > 0)
                      )
                        return (
                          <ComboboxItem
                            className="tw:flex tw:justify-between tw:cursor-pointer"
                            onClick={() => {
                              const map = formMap?.current.getMap();
                              if (map) {
                                // @ts-expect-error
                                map.fitBounds(turf.bbox(feature));
                                setCurrentCollection(collection.properties);
                              }
                            }}
                            key={
                              feature.properties[
                                feature.properties.collection.properties
                                  .id_key ?? "id"
                              ]
                            }
                            value={feature}
                          >
                            {featureLabel}
                            {/* Zoom to feature button (Search magnifying glass icon) */}
                            <Button
                              className="tw:h-fit tw:has-[>svg]:p-1 tw:[&_svg:not([class*=size-])]:size-3"
                              variant="ghost"
                              onClick={(e) => {
                                // Prevent selection, just search
                                e.stopPropagation();
                                const map = formMap?.current.getMap();
                                if (map) {
                                  // @ts-expect-error
                                  map.fitBounds(turf.bbox(feature));
                                  setCurrentCollection(collection.properties);
                                }
                              }}
                            >
                              <SearchIcon className="tw:w-3 tw:h-3" />
                            </Button>
                          </ComboboxItem>
                        );
                    }}
                  </ComboboxCollection>
                </CollapsibleContent>
              </Collapsible>
              {/* <ComboboxLabel>{collection.properties.label}</ComboboxLabel>
              <ComboboxCollection>
                {(feature: Feature) => {
                  // This approach is necessary so that we can refer to the collection location elsewhere such as in the chips
                  const featureWithCollection = feature;
                  featureWithCollection.properties.collection = collection;
                  return (
                    <ComboboxItem
                      key={feature.id}
                      value={featureWithCollection}
                    >
                      {
                        feature.properties[
                        collection.properties.label_key ?? "label"
                        ]
                      }
                    </ComboboxItem>
                  );
                }}
              </ComboboxCollection> */}
              {collections &&
                collections.length > 1 &&
                index < collections.length - 1 && <ComboboxSeparator />}
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
