/** biome-ignore-all lint/style/noNonNullAssertion: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import * as turf from "@turf/turf";
import Fuse from "fuse.js";
import {
  ArrowBigUpIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  DownloadIcon,
  DropletIcon,
  FileJsonIcon,
  InfoIcon,
  MapPinnedIcon,
  MapPinOffIcon,
  MapPinPlusIcon,
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
}) => (
  <PopoverHeader>
    <PopoverTitle className="tw:text-xl tw:flex tw:justify-between mb-0">
      <p className="mb-0">{feature.properties.title}</p>
      <PopoverPrimitive.Close
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" className="py-2 tw:w-4 tw:h-6 rounded-circle">
          <XCircleIcon />
        </Button>
      </PopoverPrimitive.Close>
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
        <p className="mb-0">
          <strong>Note:</strong> The <code>geometry</code> value may be set to{" "}
          <code>null</code> in the code block below due to its length. Visit the
          URL for the full STAC Item data.
        </p>
      </div>
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
    </PopoverDescription>
  </PopoverHeader>
);

export function FeatureCombobox() {
  // Used to ensure the popup dropdown stays at and at the width of the combobox
  const anchor = useComboboxAnchor();
  const [userQuery, setUserQuery] = useState<string>();
  const [openCollapsibles, setOpenCollapsibles] = useState<string>();
  const downloadingCollection = useFormMap(
    (state) => state.downloadingCollection,
  );
  const setDownloadingCollection = useFormMap(
    (state) => state.setDownloadingCollection,
  );
  const formMap = useFormMap((state) => state.formMap);
  const gm = useFormMap((state) => state.gm);
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
        // if (inputValue) setOpenCollapsibles(true);
        // else setOpenCollapsibles(false);
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
        // @ts-expect-error
        const newTempSpatialFull: ItemCollection = {
          type: "FeatureCollection",
          features: value,
        };
        setTempSpatialFull(newTempSpatialFull);
        // If user is removing a feature (clicks an already selected feature in the combobox)
        gm?.features.forEach((featureData) => {
          // @ts-expect-error
          if (!value.map((f) => f.id).includes(featureData._geoJson.properties.id)) {
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
            {tempSpatialFull?.features.map((feature) => {
              if (!feature) return <></>;
              const featureWithoutGeometry = { ...feature, geometry: null };
              const featureStacLink = feature?.links
                ? (feature.links as StacLink[])?.find(
                    (link: StacLink) => link.rel === "self",
                  )?.href
                : undefined;
              const geoconnexURI =
                feature.properties.geoconnex_uri &&
                isValidHttpUrl(feature.properties.geoconnex_uri as string)
                  ? (feature.properties.geoconnex_uri as string)
                  : undefined;
              const itemPopoverHandle = PopoverPrimitive.createHandle();
              return (
                <ComboboxChip className="tw:bg-sky-200" key={feature.id}>
                  {feature.properties.title}
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
                        <TooltipContent>View STAC item info</TooltipContent>
                      </Tooltip>
                      <PopoverContent
                        onMouseLeave={() => {
                          itemPopoverHandle.close();
                        }}
                        className="tw:w-full tw:h-full tw:max-w-[65vw] tw:ml-8"
                      >
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
                                map.fitBounds(
                                  // @ts-expect-error
                                  JSON.parse(feature.properties.bbox),
                                );
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
        <ComboboxEmpty>No geospatial features found.</ComboboxEmpty>
        <ComboboxList>
          {/* Refers to the value of the items attribute in <Combobox /> */}
          {(collection: ItemCollection, index) => {
            const collectionStacInfo = stacCollections?.find(
              (sC) => sC.id === collection.collection_id,
            );
            const collectionGeometriesDownloaded =
              itemCollections
                ?.find((f) => f.collection_id === collection.collection_id)
                ?.features.at(0)?.geometry !== null;
            const isLargeCollection = collection.features.length > 1000;
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
                  <div className="tw:flex tw:items-center tw:pl-2">
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button
                          className="tw:w-4 tw:h-4 tw:p-0 rounded-circle"
                          onClick={() => {
                            if (!collectionGeometriesDownloaded)
                              setDownloadingCollection(
                                collection.collection_id!,
                              );
                            if (
                              currentStacCollection?.id ===
                              collection.collection_id
                            )
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
                            collection.collection_id &&
                          !(
                            downloadingCollection === collection.collection_id
                          ) ? (
                            <MapPinOffIcon className="tw:w-4 tw:h-4 tw:mr-1" />
                          ) : collectionGeometriesDownloaded ? (
                            <MapPinPlusIcon className="tw:w-4 tw:h-4 tw:mr-1" />
                          ) : downloadingCollection ===
                            collection.collection_id ? (
                            <Spinner />
                          ) : (
                            <DownloadIcon
                              className={`tw:w-4 tw:h-4 tw:mr-1${isLargeCollection ? " tw:stroke-amber-800" : ""}${noGeometriesYet && !isLargeCollection ? " tw:stroke-blue-900" : ""}`}
                            />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {collectionGeometriesDownloaded
                          ? "Toggle geometries visualized on map"
                          : "Download geometries and show on map (this may take a few seconds)"}
                        {!collectionGeometriesDownloaded &&
                          isLargeCollection && (
                            <p className="mb-0">
                              <strong>
                                This collection has many elements! Downloading
                                the geometries may take some time.
                              </strong>
                            </p>
                          )}
                      </TooltipContent>
                    </Tooltip>
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
                        <TooltipContent>
                          Toggle STAC collection info
                        </TooltipContent>
                      </Tooltip>
                      <PopoverContent
                        onMouseLeave={() => {
                          collectionPopoverHandle.close();
                        }}
                        side="top"
                        className="tw:w-full tw:h-full tw:max-w-[65vw] tw:ml-8"
                      >
                        <PopoverHeader>
                          <PopoverTitle className="tw:text-xl tw:flex tw:justify-between mb-0">
                            <p className="mb-0">
                              {collectionStacInfo?.title ??
                                collection.collection_id}
                            </p>
                            <PopoverPrimitive.Close
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                className="py-2 tw:w-4 tw:h-6 rounded-circle rounded-circle"
                              >
                                <XCircleIcon />
                              </Button>
                            </PopoverPrimitive.Close>
                          </PopoverTitle>
                          <PopoverDescription>
                            <div className="tw:flex tw:flex-col tw:gap-0">
                              <CommonStacCollectionInfo
                                label="STAC Collection ID"
                                value={collection.collection_id!}
                              />
                              {collectionStacInfo?.description && (
                                <CommonStacCollectionInfo
                                  label="Description"
                                  value={collectionStacInfo.description}
                                  nocopy
                                />
                              )}
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
                            <Collapsible className="rounded-md data-[state=open]:bg-muted tw:mt-2">
                              <CollapsibleTrigger className="tw:w-full" asChild>
                                <Button
                                  variant="outline"
                                  className="group w-full"
                                >
                                  Toggle STAC Collection JSON
                                  <FileJsonIcon className="ml-auto group-data-[state=open]:rotate-180" />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm">
                                <div>
                                  <Code
                                    className="mt-2 tw:w-full tw:h-full tw:max-h-[50vh]"
                                    code={JSON.stringify(
                                      collectionStacInfo,
                                      null,
                                      2,
                                    )}
                                  >
                                    <CodeHeader icon={FileJsonIcon} copyButton>
                                      {collectionStacInfo &&
                                      isValidHttpUrl(
                                        collectionStacInfo.links.find(
                                          (link) => link.rel === "self",
                                        )?.href,
                                      ) ? (
                                        <a
                                          onClick={(e) => e.stopPropagation()}
                                          onPointerDown={(e) =>
                                            e.stopPropagation()
                                          }
                                          href={
                                            collectionStacInfo.links.find(
                                              (link) => link.rel === "self",
                                            )?.href
                                          }
                                        >
                                          {
                                            collectionStacInfo.links.find(
                                              (link) => link.rel === "self",
                                            )?.href
                                          }
                                        </a>
                                      ) : (
                                        "STAC Collection"
                                      )}
                                    </CodeHeader>
                                    <CodeBlock lang="json" />
                                  </Code>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </PopoverDescription>
                        </PopoverHeader>
                      </PopoverContent>
                    </Popover>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <CollapsibleTrigger
                          asChild
                          className="tw:w-full tw:flex tw:items-center"
                          // onClick={() => {
                          //   setLoadingCollapsible(collection.collection_id);
                          // }}
                        >
                          <Button
                            variant="ghost"
                            className="tw:w-4 tw:h-4 tw:p-0 rounded-circle"
                          >
                            <ChevronsUpDownIcon
                              className={`tw:w-4 tw:h-4${isLargeCollection ? " tw:stroke-amber-800" : ""}`}
                            />
                            {/* {loadingCollapsible === collection.collection_id ? (
                              <Spinner />
                            ) : (
                              <ChevronsUpDownIcon
                                className={`tw:w-4 tw:h-4${isLargeCollection ? " tw:stroke-amber-800" : ""}`}
                              />
                            )} */}
                          </Button>
                        </CollapsibleTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="mb-0">
                          Toggle listing geospatial features
                        </p>
                        {collection.features.length > 1000 && (
                          <p className="mb-0">
                            <strong>
                              This collection has many elements! Toggling the
                              list may take some time.
                            </strong>
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                    <ComboboxLabel className="tw:text-md tw:text-normal">
                      {
                        stacCollections?.find(
                          (c) => c.id === collection.collection_id,
                        )?.title
                      }
                    </ComboboxLabel>
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
                          feature.properties.geoconnex_uri &&
                          isValidHttpUrl(
                            feature.properties.geoconnex_uri as string,
                          )
                            ? (feature.properties.geoconnex_uri as string)
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
                                  // @ts-expect-error
                                  map.fitBounds(feature.bbox);
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
                                          // @ts-expect-error
                                          map.fitBounds(feature.bbox);
                                          setCurrentStacCollection(
                                            stacCollections?.find(
                                              (c) =>
                                                c.id ===
                                                collection.collection_id,
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
                                      Toggle STAC item info
                                    </TooltipContent>
                                  </Tooltip>
                                  <PopoverContent
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseLeave={() => {
                                      itemPopoverHandle.close();
                                    }}
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
