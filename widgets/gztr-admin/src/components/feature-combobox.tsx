import Fuse from "fuse.js";
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  FileJsonIcon,
  InfoIcon,
  MapPinnedIcon,
  SearchIcon,
  SearchXIcon,
} from "lucide-react";
import { useState } from "react";
import type { StacItem, StacLink } from "stac-ts";
import type { ItemCollection } from "@/App";
import {
  Code,
  CodeBlock,
  CodeHeader,
} from "@/components/animate-ui/components/animate/code";
import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useFormMap } from "@/stores/form-map-store";
import { CopyButton } from "./animate-ui/components/buttons/copy";

const isValidHttpUrl = (url: string) => {
  try {
    const newUrl = new URL(url);
    return newUrl.protocol === "http:" || newUrl.protocol === "https:";
  } catch (err) {
    return false;
  }
};

export function FeatureCombobox() {
  // Used to ensure the popup dropdown stays at and at the width of the combobox
  const anchor = useComboboxAnchor();
  const [userQuery, setUserQuery] = useState<string>();
  const [openCollapsibles, setOpenCollapsibles] = useState(false);
  const formMap = useFormMap((state) => state.formMap);
  const stacCollections = useFormMap((state) => state.stacCollections);
  const itemCollections = useFormMap((state) => state.itemCollections);
  const currentStacCollection = useFormMap(
    (state) => state.currentStacCollection,
  );
  const setCurrentStacCollection = useFormMap(
    (state) => state.setCurrentStacCollection,
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
      items={itemCollections}
      multiple
      // TODO: Identify scenarios where selected values still persist even after closing and opening the dialog
      value={tempSpatialFull?.features ?? []}
      isItemEqualToValue={(itemValue, value) => {
        return (
          Object.is(itemValue, value) ||
          (itemValue.id === value.id &&
            itemValue.collection === value.collection)
        );
      }}
      // When user selection changes
      onValueChange={(value) => {
        // Get map layer info; e.g. for adding/removing a darker layer for the selected feature
        const map = formMap?.current?.getMap();
        const featureSource = map?.getSource("featureSource");
        const newTempSpatialFull: ItemCollection = {
          type: "FeatureCollection",
          features: value,
          links: [],
        };
        setTempSpatialFull(newTempSpatialFull);
        // Add the feature to the MapLibre featureSource Source (which is then highlighted as a selected feature)
        // Remove giant features array to prevent recursion error in Geoman usage;
        // @ts-expect-error
        featureSource?.setData(newTempSpatialFull);
      }}
      // @ts-expect-error
      filter={(collection: ItemCollection, query) => {
        const featureLabels = collection.features.map(
          (f) => f.properties.title,
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
            {tempSpatialFull?.features.map((feature) => {
              const featureWithoutGeometry = { ...feature, geometry: null };
              const featureStacLink = (feature.links as StacLink[])?.find(
                (link: StacLink) => link.rel === "self",
              )?.href;
              return (
                <ComboboxChip
                  className="tw:bg-sky-200"
                  // @ts-expect-error
                  key={feature.properties.id}
                >
                  {feature.properties.title}
                  <Separator
                    className="tw:bg-muted-foreground"
                    orientation="vertical"
                  />
                  {feature.collection !== "Drawn features" && (
                    <Popover>
                      <PopoverTrigger>
                        <Button
                          className="tw:cursor-pointer tw:h-fit tw:has-[>svg]:p-1 tw:[&_svg:not([class*=size-])]:size-3"
                          variant="ghost"
                        >
                          <InfoIcon className="tw:w-3 tw:h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="right"
                        className="tw:w-full tw:h-full tw:max-w-[65vw] tw:ml-8"
                      >
                        <PopoverHeader>
                          <PopoverTitle className="tw:text-xl">
                            {feature.properties.title}
                          </PopoverTitle>
                          <PopoverDescription>
                            <div className="tw:flex tw:flex-col tw:gap-0">
                              <p className="mb-0">
                                STAC Item ID: {feature.id}{" "}
                                <CopyButton
                                  onClick={(e) => e.stopPropagation()}
                                  className="tw:inline-block tw:w-fit tw:h-fit tw:ml-1"
                                  variant="ghost"
                                  size="xs"
                                  content={feature.id}
                                />
                              </p>
                              <p className="mb-0">
                                STAC Collection ID: {feature.collection}{" "}
                                <CopyButton
                                  onClick={(e) => e.stopPropagation()}
                                  className="tw:inline-block tw:w-fit tw:h-fit tw:ml-1"
                                  variant="ghost"
                                  size="xs"
                                  // @ts-ignore
                                  content={feature.collection}
                                />
                              </p>
                              <p className="mb-0">
                                <strong>Note:</strong> The <code>geometry</code>{" "}
                                value may be set to <code>null</code> in the
                                code block below due to its length. Visit the
                                URL for the full STAC Item data.
                              </p>
                            </div>
                            <Code
                              className="mt-2 tw:w-full tw:h-full tw:max-h-[50vh]"
                              code={JSON.stringify(
                                featureWithoutGeometry,
                                null,
                                2,
                              )}
                            >
                              <CodeHeader icon={FileJsonIcon} copyButton>
                                {featureStacLink &&
                                isValidHttpUrl(featureStacLink) ? (
                                  <a href={featureStacLink}>
                                    {featureStacLink}
                                  </a>
                                ) : (
                                  "Feature GeoJSON (without geometry)"
                                )}
                              </CodeHeader>
                              <CodeBlock lang="json" />
                            </Code>
                          </PopoverDescription>
                        </PopoverHeader>
                      </PopoverContent>
                    </Popover>
                  )}
                  <Button
                    className="tw:h-fit tw:has-[>svg]:p-1 tw:[&_svg:not([class*=size-])]:size-3"
                    variant="ghost"
                    onClick={() => {
                      const map = formMap?.current.getMap();
                      if (map) {
                        try {
                          if (feature.bbox)
                            // @ts-expect-error
                            map.fitBounds(feature.bbox);
                          else if (feature.properties.bbox)
                            // @ts-expect-error
                            map.fitBounds(JSON.parse(feature.properties.bbox));
                        } catch (e) {
                          console.error(
                            "Error while attempting to zoom to feature bounds.",
                          );
                        }
                        setCurrentStacCollection(
                          stacCollections?.find(
                            (c) => c.id === feature.collection,
                          ),
                        );
                      }
                    }}
                  >
                    <SearchIcon className="tw:w-3 tw:h-3" />
                  </Button>
                </ComboboxChip>
              );
            })}
          </div>
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        {/* TODO: Consider some way to add a contact option for the site administrator as this is expected to be an erroneous state. */}
        <ComboboxEmpty>No geospatial features found.</ComboboxEmpty>
        <ComboboxList>
          {/* Refers to the value of the items attribute in <Combobox /> */}
          {(collection: ItemCollection, index) => (
            <ComboboxGroup
              key={collection.collection_id}
              items={collection.features}
            >
              <Collapsible
                open={openCollapsibles}
                onOpenChange={setOpenCollapsibles}
              >
                <CollapsibleTrigger className="tw:w-full tw:flex tw:justify-between tw:items-center">
                  <ComboboxLabel className="tw:text-md">
                    {
                      stacCollections?.find(
                        (c) => c.id === collection.collection_id,
                      )?.title
                    }
                  </ComboboxLabel>
                  <div className="tw:flex tw:items-center">
                    <Button
                      className="tw:w-4 tw:h-4 tw:p-0"
                      onClick={() => {
                        if (currentStacCollection)
                          setCurrentStacCollection(undefined);
                        else
                          setCurrentStacCollection(
                            stacCollections?.find(
                              (c) => c.id === collection.collection_id,
                            ),
                          );
                      }}
                      variant="ghost"
                    >
                      {currentStacCollection?.id ===
                      collection.collection_id ? (
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
                    {(feature: StacItem) => {
                      const featureLabel = feature.properties.title;
                      const fuse = new Fuse([featureLabel], { threshold: 0.2 });
                      const featureWithoutGeometry = {
                        ...feature,
                        geometry: null,
                      };
                      const featureStacLink = (
                        feature.links as StacLink[]
                      )?.find((link: StacLink) => link.rel === "self")?.href;
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
                                map.fitBounds(feature.bbox);
                                setCurrentStacCollection(
                                  stacCollections?.find(
                                    (c) => c.id === collection.collection_id,
                                  ),
                                );
                              }
                            }}
                            // @ts-expect-error
                            key={feature.properties.id}
                            value={feature}
                          >
                            {featureLabel}
                            <div>
                              {/* STAC Item information button */}
                              <Popover>
                                <PopoverTrigger
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    className="tw:cursor-pointer tw:h-fit tw:has-[>svg]:p-1 tw:[&_svg:not([class*=size-])]:size-3"
                                    variant="ghost"
                                  >
                                    <InfoIcon className="tw:w-3 tw:h-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="right"
                                  className="tw:w-full tw:h-full tw:max-w-[65vw] tw:ml-8"
                                >
                                  <PopoverHeader>
                                    <PopoverTitle className="tw:text-xl">
                                      {feature.properties.title}
                                    </PopoverTitle>
                                    <PopoverDescription>
                                      <div className="tw:flex tw:flex-col tw:gap-0">
                                        <p className="mb-0">
                                          STAC Item ID: {feature.id}{" "}
                                          <CopyButton
                                            onClick={(e) => e.stopPropagation()}
                                            className="tw:inline-block tw:w-fit tw:h-fit tw:ml-1"
                                            variant="ghost"
                                            size="xs"
                                            content={feature.id}
                                          />
                                        </p>
                                        <p className="mb-0">
                                          STAC Collection ID:{" "}
                                          {feature.collection}{" "}
                                          <CopyButton
                                            onClick={(e) => e.stopPropagation()}
                                            className="tw:inline-block tw:w-fit tw:h-fit tw:ml-1"
                                            variant="ghost"
                                            size="xs"
                                            // @ts-expect-error
                                            content={feature.collection}
                                          />
                                        </p>
                                        <p className="mb-0">
                                          <strong>Note:</strong> The{" "}
                                          <code>geometry</code> value may be set
                                          to <code>null</code> in the code block
                                          below due to its length. Visit the URL
                                          for the full STAC Item data.
                                        </p>
                                      </div>
                                      <Code
                                        className="mt-2 tw:w-full tw:h-full tw:max-h-[50vh]"
                                        code={JSON.stringify(
                                          featureWithoutGeometry,
                                          null,
                                          2,
                                        )}
                                      >
                                        <CodeHeader
                                          icon={FileJsonIcon}
                                          copyButton
                                        >
                                          {featureStacLink &&
                                          isValidHttpUrl(featureStacLink) ? (
                                            <a href={featureStacLink}>
                                              {featureStacLink}
                                            </a>
                                          ) : (
                                            "Feature GeoJSON (without geometry)"
                                          )}
                                        </CodeHeader>
                                        <CodeBlock lang="json" />
                                      </Code>
                                    </PopoverDescription>
                                  </PopoverHeader>
                                </PopoverContent>
                              </Popover>
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
                                    map.fitBounds(feature.bbox);
                                    setCurrentStacCollection(
                                      stacCollections?.find(
                                        (c) =>
                                          c.id === collection.collection_id,
                                      ),
                                    );
                                  }
                                }}
                              >
                                <SearchIcon className="tw:w-3 tw:h-3" />
                              </Button>
                            </div>
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
              {stacCollections &&
                stacCollections.length > 1 &&
                index < stacCollections.length - 1 && <ComboboxSeparator />}
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
