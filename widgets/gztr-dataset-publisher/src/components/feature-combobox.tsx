/** biome-ignore-all lint/style/noNonNullAssertion: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import * as turf from "@turf/turf";
import Fuse from "fuse.js";
import {
  ArrowBigUpIcon,
  ChevronDownIcon,
  DownloadIcon,
  DropletIcon,
  FileJsonIcon,
  InfoIcon,
  MapPinnedIcon,
  Minimize2Icon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import type { StacItem, StacLink } from "stac-ts";
import type { ItemCollection } from "@/App";
import {
  Code,
  CodeBlock,
  CodeHeader,
} from "@/components/animate-ui/components/animate/code";
import { CopyButton } from "@/components/animate-ui/components/buttons/copy";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFormMap } from "@/stores/form-map-store";

const isValidHttpUrl = (url: string | undefined) => {
  if (!url) return false;
  try {
    const newUrl = new URL(url);
    return newUrl.protocol === "http:" || newUrl.protocol === "https:";
  } catch {
    return false;
  }
};

const CommonStacCollectionInfo = ({
  label,
  value,
  nocopy,
}: {
  label: string;
  value: string;
  nocopy?: boolean;
}) => (
  <p className="mb-0">
    <strong>{label}</strong>: {value}{" "}
    {!nocopy && (
      <CopyButton
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="tw:inline-block tw:w-fit tw:h-fit tw:ml-1"
        variant="ghost"
        size="xs"
        content={value}
      />
    )}
  </p>
);

export const StacItemPopoverContent = ({
  feature,
  geoconnexURI,
  featureWithoutGeometry,
  featureStacLink,
}: {
  feature: StacItem;
  geoconnexURI: string | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: Ease
  featureWithoutGeometry: any;
  featureStacLink: string | undefined;
}) => {
  const [openInfo, setOpenInfo] = useState(false);
  return (
    <PopoverHeader>
      <PopoverTitle className="tw:text-xl tw:flex tw:justify-between mb-0">
        <p className="mb-0">
          {feature.properties.title ? feature.properties.title : <Spinner />}
        </p>
        <div className="tw:flex tw:gap-2 tw:items-center">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <PopoverTrigger>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenInfo(!openInfo);
                  }}
                  variant="ghost"
                  className="py-2 tw:w-4 tw:h-6 rounded-circle"
                >
                  <InfoIcon />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>View detailed item info</TooltipContent>
          </Tooltip>
          <PopoverPrimitive.Close
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              className="py-2 tw:w-4 tw:h-6 rounded-circle"
            >
              <XCircleIcon />
            </Button>
          </PopoverPrimitive.Close>
        </div>
      </PopoverTitle>
      <PopoverDescription>
        <div className="tw:flex tw:flex-col tw:gap-0">
          <p className="mb-0">
            <strong>STAC Item ID</strong>: {feature.id}{" "}
            <CopyButton
              className="tw:inline-block tw:w-fit tw:h-fit tw:ml-1"
              variant="ghost"
              size="xs"
              content={feature.id}
            />
          </p>
          <p className="mb-0">
            <strong>STAC Collection ID</strong>: {feature.collection}{" "}
            <CopyButton
              className="tw:inline-block tw:w-fit tw:h-fit tw:ml-1"
              variant="ghost"
              size="xs"
              // @ts-expect-error
              content={feature.collection}
            />
          </p>
          {geoconnexURI && (
            <p className="mb-0">
              <DropletIcon className="tw:inline-block mb-1 tw:stroke-blue-400 tw:w-4 tw:h-4" />{" "}
              <strong>Geoconnex URI</strong>:{" "}
              <a
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                href={geoconnexURI}
              >
                {geoconnexURI}
              </a>{" "}
              <CopyButton
                className="tw:inline-block tw:w-fit tw:h-fit tw:ml-1"
                variant="ghost"
                size="xs"
                content={geoconnexURI}
              />
            </p>
          )}
          {openInfo && (
            <p className="mb-0">
              <strong>Note:</strong> The <code>geometry</code> value may be set
              to <code>null</code> in the code block below due to its length.
              Visit the URL for the full STAC Item data.
            </p>
          )}
        </div>
        {openInfo && (
          <Code
            className="mt-2 tw:w-full tw:h-full tw:max-h-[50vh]"
            code={JSON.stringify(featureWithoutGeometry, null, 2)}
          >
            <CodeHeader icon={FileJsonIcon} copyButton>
              {featureStacLink && isValidHttpUrl(featureStacLink) ? (
                <a
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  href={featureStacLink}
                >
                  {featureStacLink}
                </a>
              ) : (
                "Feature GeoJSON (without geometry)"
              )}
            </CodeHeader>
            <CodeBlock lang="json" />
          </Code>
        )}
      </PopoverDescription>
    </PopoverHeader>
  );
};

export function FeatureCombobox() {
  // Used to ensure the popup dropdown stays at and at the width of the combobox
  const anchor = useComboboxAnchor();
  const [userQuery, setUserQuery] = useState<string>();
  const [openCollapsibles, setOpenCollapsibles] = useState<string>();
  const formMap = useFormMap((state) => state.formMap);
  const gm = useFormMap((state) => state.gm);
  const stacCollections = useFormMap((state) => state.stacCollections);
  const itemCollections = useFormMap((state) => state.itemCollections);
  const setCurrentStacCollection = useFormMap(
    (state) => state.setCurrentStacCollection,
  );
  const tempSpatialFull = useFormMap((state) => state.tempSpatialFull);
  const setTempSpatialFull = useFormMap((state) => state.setTempSpatialFull);
  const loadingCollections = useFormMap((state) => state.loadingCollections);

  return (
    <Combobox
      // When user query changes
      onInputValueChange={(inputValue) => {
        setUserQuery(inputValue);
        // if (inputValue) setOpenCollapsibles(true);
        // else setOpenCollapsibles(false);
      }}
      on
      // Filter out quick region extent collection
      items={itemCollections?.filter(
        (iC) =>
          !(
            stacCollections?.find((c) => c.quick_region_extent)?.id ===
            iC.collection_id
          ),
      )}
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
        // @ts-expect-error
        const newTempSpatialFull: ItemCollection = {
          type: "FeatureCollection",
          features: value,
        };
        setTempSpatialFull(newTempSpatialFull);
        // If user is removing a feature (clicks an already selected feature in the combobox)
        gm?.features.forEach((featureData) => {
          if (
            // @ts-expect-error
            !value.map((f) => f.id).includes(featureData._geoJson.properties.id)
          ) {
            gm.features.delete(featureData.id);
          }
        });
        // TODO: Fix issue where geometry is not selected on map when collection's geometries are not downloaded or still downloading
        // If user is adding a new feature from the combobox (clicks an unselected feature in the combobox)
        value.forEach((comboboxFeature) => {
          if (
            !gm?.features
              .getAll()
              .features.map((f) => f.id)
              .includes(comboboxFeature.id)
          ) {
            if (comboboxFeature.geometry) {
              // @ts-expect-error
              gm?.features.importGeoJsonFeature(comboboxFeature);
            }
          }
        });
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
            {tempSpatialFull?.features
              .map((tsFeature) => {
                const featureIC = itemCollections?.find(
                  (iC) => iC.collection_id === tsFeature.collection,
                );
                const foundFeature = featureIC?.features.find(
                  (f) => f.id === tsFeature.id,
                );
                return foundFeature ?? tsFeature;
              })
              .map((feature) => {
                if (!feature) return <></>;
                const featureWithoutGeometry = { ...feature, geometry: null };
                const featureStacLink = feature?.links
                  ? (feature.links as StacLink[])?.find(
                      (link: StacLink) => link.rel === "self",
                    )?.href
                  : undefined;
                const geoconnexURI =
                  feature.properties.geoconnex_pid &&
                  isValidHttpUrl(feature.properties.geoconnex_pid as string)
                    ? (feature.properties.geoconnex_pid as string)
                    : undefined;
                const itemPopoverHandle = PopoverPrimitive.createHandle();
                return (
                  <ComboboxChip className="tw:bg-sky-200" key={feature.id}>
                    {feature.collection === "Drawn features" ? (
                      feature.id
                    ) : !feature.properties.title ? (
                      <Spinner />
                    ) : (
                      feature.properties.title
                    )}
                    <Separator
                      className="tw:bg-muted-foreground"
                      orientation="vertical"
                    />
                    {feature.collection !== "Drawn features" && (
                      <Popover handle={itemPopoverHandle}>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <PopoverTrigger handle={itemPopoverHandle}>
                              <Button
                                className="tw:cursor-pointer tw:h-fit tw:has-[>svg]:p-1 tw:[&_svg:not([class*=size-])]:size-3 rounded-circle"
                                variant="ghost"
                              >
                                {itemPopoverHandle.store.state.open ? (
                                  <Minimize2Icon className="tw:w-3 tw:h-3" />
                                ) : (
                                  <InfoIcon className="tw:w-3 tw:h-3" />
                                )}
                              </Button>
                            </PopoverTrigger>
                          </TooltipTrigger>
                          <TooltipContent>View item info</TooltipContent>
                        </Tooltip>
                        <PopoverContent className="tw:w-full tw:h-full tw:max-w-[65vw] tw:ml-8">
                          <StacItemPopoverContent
                            feature={feature}
                            geoconnexURI={geoconnexURI}
                            featureWithoutGeometry={featureWithoutGeometry}
                            featureStacLink={featureStacLink}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button
                          className="tw:h-fit tw:has-[>svg]:p-1 tw:[&_svg:not([class*=size-])]:size-3 rounded-circle"
                          variant="ghost"
                          onClick={() => {
                            const map = formMap?.current.getMap();
                            if (map) {
                              try {
                                if (feature.bbox) {
                                  // @ts-expect-error
                                  map.fitBounds(feature.bbox);
                                } else if (feature.properties.bbox) {
                                  // @ts-expect-error
                                  map.fitBounds(feature.properties.bbox);
                                } else {
                                  // @ts-expect-error
                                  map.fitBounds(turf.bbox(feature));
                                }
                              } catch (e) {
                                console.error(
                                  `Error while attempting to zoom to feature bounds.`,
                                  e,
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
                      </TooltipTrigger>
                      <TooltipContent>View feature on the map</TooltipContent>
                    </Tooltip>
                  </ComboboxChip>
                );
              })}
          </div>
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        {/* TODO: Consider some way to add a contact option for the site administrator as this is expected to be an erroneous state. */}
        <ComboboxEmpty>
          {loadingCollections ? (
            <div className="tw:flex tw:gap-2 tw:items-center">
              <Spinner />
              <p className="mb-0">
                Downloading geospatial collections, please wait...
              </p>
            </div>
          ) : (
            "No geospatial features found."
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {/* Refers to the value of the items attribute in <Combobox /> */}
          {(collection: ItemCollection, index) => {
            const collectionStacInfo = stacCollections?.find(
              (sC) => sC.id === collection.collection_id,
            );
            const collectionPopoverHandle = PopoverPrimitive.createHandle();
            const noGeometriesYet = !itemCollections
              ?.find((c) => collection.collection_id === c.collection_id)
              ?.features.at(0)?.geometry;
            return (
              <ComboboxGroup
                key={collection.collection_id}
                items={collection.features}
              >
                <Collapsible
                  open={openCollapsibles === collection.collection_id}
                  onOpenChange={(o) => {
                    if (o) {
                      setOpenCollapsibles(collection.collection_id);
                    } else {
                      setOpenCollapsibles(undefined);
                    }
                  }}
                >
                  <div
                    className={`tw:flex tw:items-center tw:pl-2 tw:hover:bg-sky-200 tw:rounded${openCollapsibles === collection.collection_id ? " tw:bg-blue-200" : ""}`}
                  >
                    {/* STAC Collection information button */}
                    <Popover handle={collectionPopoverHandle}>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <PopoverTrigger handle={collectionPopoverHandle}>
                            <Button
                              className="tw:cursor-pointer tw:h-fit tw:p-0 tw:has-[>svg]:p-1 rounded-circle"
                              variant="ghost"
                            >
                              <InfoIcon className="tw:w-3 tw:h-3" />
                            </Button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>View collection info</TooltipContent>
                      </Tooltip>
                      <PopoverContent
                        side="top"
                        className="tw:w-full tw:h-full tw:max-w-[65vw] tw:ml-8"
                      >
                        <PopoverHeader>
                          <PopoverTitle className="tw:text-xl tw:flex tw:justify-between mb-0">
                            <p className="mb-0">
                              {collectionStacInfo?.title ??
                                collection.collection_id}
                            </p>
                            <div className="tw:flex tw:items-center">
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  {collectionStacInfo &&
                                    isValidHttpUrl(
                                      collectionStacInfo.assets?.geoparquet_file
                                        .href,
                                    ) && (
                                      <a
                                        href={
                                          collectionStacInfo.assets
                                            ?.geoparquet_file.href
                                        }
                                        className={buttonVariants({
                                          variant: "ghost",
                                          size: "icon",
                                        })}
                                        download
                                      >
                                        <DownloadIcon />
                                      </a>
                                    )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  Download collection as GeoParquet
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  {collectionStacInfo &&
                                    isValidHttpUrl(
                                      collectionStacInfo.links.find(
                                        (link) => link.rel === "self",
                                      )?.href,
                                    ) && (
                                      <a
                                        href={
                                          collectionStacInfo.links.find(
                                            (link) => link.rel === "self",
                                          )?.href
                                        }
                                        className={buttonVariants({
                                          variant: "ghost",
                                          size: "icon",
                                        })}
                                        target="_blank"
                                        rel="noopener"
                                      >
                                        <FileJsonIcon />
                                      </a>
                                    )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  View collection JSON info
                                </TooltipContent>
                              </Tooltip>
                              <PopoverPrimitive.Close
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button variant="ghost" className="rounded">
                                  <XCircleIcon />
                                </Button>
                              </PopoverPrimitive.Close>
                            </div>
                          </PopoverTitle>
                          <PopoverDescription>
                            <div className="tw:flex tw:flex-col tw:gap-0">
                              {collectionStacInfo?.description && (
                                <p className="tw:text-sm">
                                  {collectionStacInfo.description}
                                </p>
                              )}
                              <CommonStacCollectionInfo
                                label="STAC Collection ID"
                                value={collection.collection_id!}
                              />
                              {collectionStacInfo?.license && (
                                <CommonStacCollectionInfo
                                  label="License"
                                  value={collectionStacInfo.license}
                                  nocopy
                                />
                              )}
                              {collectionStacInfo?.providers && (
                                <p className="mb-0">
                                  <strong>
                                    Provider
                                    {collectionStacInfo.providers.length > 1 &&
                                      "s"}
                                  </strong>
                                  :{" "}
                                  {collectionStacInfo.providers.map(
                                    (provider, providerId) => (
                                      <span key={providerId}>
                                        {providerId > 0 && ", "}
                                        <Tooltip>
                                          <TooltipTrigger>
                                            {provider.url ? (
                                              <a
                                                onPointerDown={(e) =>
                                                  e.stopPropagation()
                                                }
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                                href={provider.url}
                                              >
                                                {provider.name}
                                              </a>
                                            ) : (
                                              provider.name
                                            )}
                                          </TooltipTrigger>
                                          <TooltipContent className="tw:z-[53] tw:max-w-xl">
                                            <p className="mb-0">
                                              {provider.description}
                                            </p>
                                            {provider.roles && (
                                              <p className="mb-0">
                                                Role
                                                {provider.roles.length > 1 &&
                                                  "s"}
                                                :{" "}
                                                {provider.roles.map(
                                                  (role, roleId) => (
                                                    <span key={roleId}>
                                                      {roleId > 0 && ", "}
                                                      {role}
                                                    </span>
                                                  ),
                                                )}
                                              </p>
                                            )}
                                          </TooltipContent>
                                        </Tooltip>
                                      </span>
                                    ),
                                  )}
                                </p>
                              )}
                            </div>
                          </PopoverDescription>
                        </PopoverHeader>
                      </PopoverContent>
                    </Popover>
                    <CollapsibleTrigger
                      asChild
                      className="tw:w-full tw:flex tw:items-center"
                      onClick={() => {
                        setCurrentStacCollection(
                          stacCollections?.find(
                            (c) => c.id === collection.collection_id,
                          ),
                        );
                      }}
                    >
                      <ComboboxLabel className="tw:text-md tw:text-normal">
                        {
                          stacCollections?.find(
                            (c) => c.id === collection.collection_id,
                          )?.title
                        }
                      </ComboboxLabel>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    {noGeometriesYet && (
                      <p className="tw:ml-2 tw:text-muted-foreground mb-0">
                        <ArrowBigUpIcon className="tw:inline-block tw:animate-bounce tw:w-4 tw:h-4" />{" "}
                        Download this collection's geometries first to toggle a
                        feature.
                      </p>
                    )}
                    <ComboboxCollection>
                      {(feature: StacItem) => {
                        const featureLabel = feature.properties.title;
                        const fuse = new Fuse([featureLabel], {
                          threshold: 0.2,
                        });
                        const featureWithoutGeometry = {
                          ...feature,
                          geometry: null,
                        };
                        const featureStacLink = feature?.links
                          ? (feature.links as StacLink[])?.find(
                              (link: StacLink) => link.rel === "self",
                            )?.href
                          : undefined;
                        const geoconnexURI =
                          feature.properties.geoconnex_pid &&
                          isValidHttpUrl(
                            feature.properties.geoconnex_pid as string,
                          )
                            ? (feature.properties.geoconnex_pid as string)
                            : undefined;
                        const itemPopoverHandle =
                          PopoverPrimitive.createHandle();
                        if (
                          !userQuery ||
                          (userQuery && fuse.search(userQuery).length > 0)
                        )
                          return (
                            <ComboboxItem
                              className="tw:flex tw:cursor-pointer"
                              disabled={!feature.geometry}
                              onClick={(e) => {
                                e.stopPropagation();
                                const map = formMap?.current.getMap();
                                if (map) {
                                  if (feature.bbox) {
                                    // @ts-expect-error
                                    map.fitBounds(feature.bbox);
                                  } else if (feature.properties.bbox) {
                                    map.fitBounds(
                                      // @ts-expect-error
                                      feature.properties.bbox,
                                    );
                                  } else {
                                    // @ts-expect-error
                                    map.fitBounds(turf.bbox(feature));
                                  }
                                  setCurrentStacCollection(
                                    stacCollections?.find(
                                      (c) => c.id === collection.collection_id,
                                    ),
                                  );
                                }
                              }}
                              key={feature.id}
                              value={feature}
                            >
                              <div>
                                {/* STAC Item information popover */}
                                <Popover handle={itemPopoverHandle}>
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <PopoverTrigger
                                        handle={itemPopoverHandle}
                                        onPointerDown={(e) =>
                                          e.stopPropagation()
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {itemPopoverHandle.store.state.open}
                                        <Button
                                          className="tw:cursor-pointer tw:h-fit tw:has-[>svg]:p-1 tw:[&_svg:not([class*=size-])]:size-3 rounded-circle"
                                          variant="ghost"
                                        >
                                          <InfoIcon className="tw:w-3 tw:h-3" />
                                        </Button>
                                      </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      View item info
                                    </TooltipContent>
                                  </Tooltip>
                                  <PopoverContent
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="tw:w-full tw:h-full tw:max-w-[65vw] tw:ml-8"
                                  >
                                    <StacItemPopoverContent
                                      feature={feature}
                                      geoconnexURI={geoconnexURI}
                                      featureWithoutGeometry={
                                        featureWithoutGeometry
                                      }
                                      featureStacLink={featureStacLink}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              {/* Zoom to feature button (Search magnifying glass icon) */}
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  <Button
                                    className="tw:h-fit tw:has-[>svg]:p-1 tw:[&_svg:not([class*=size-])]:size-3 rounded-circle"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const map = formMap?.current.getMap();
                                      if (map) {
                                        if (feature.bbox) {
                                          // @ts-expect-error
                                          map.fitBounds(feature.bbox);
                                        } else if (feature.properties.bbox) {
                                          map.fitBounds(
                                            // @ts-expect-error
                                            feature.properties.bbox,
                                          );
                                        } else {
                                          // @ts-expect-error
                                          map.fitBounds(turf.bbox(feature));
                                        }
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
                                </TooltipTrigger>
                                <TooltipContent>
                                  Show feature on map
                                </TooltipContent>
                              </Tooltip>
                              {featureLabel}
                            </ComboboxItem>
                          );
                      }}
                    </ComboboxCollection>
                  </CollapsibleContent>
                </Collapsible>
                {stacCollections &&
                  stacCollections.length > 1 &&
                  index < stacCollections.length - 1 && <ComboboxSeparator />}
              </ComboboxGroup>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
