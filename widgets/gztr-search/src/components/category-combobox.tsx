import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  FileJsonIcon,
  InfoIcon,
  MapIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, isValidHttpUrl } from "@/lib/utils";
import { useFormMap } from "@/stores/form-map-store";

export function CategoryCombobox({ config }: any) {
  const collections = useFormMap((state) => state.collections);
  const currentCollection = useFormMap((state) => state.currentCollection);
  const setCurrentCollection = useFormMap(
    (state) => state.setCurrentCollection,
  );

  return (
    <Popover modal={true}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            className="tw:max-w-xl tw:justify-between rounded"
          >
            <span>
              <MapIcon className="tw:inline-block tw:w-4 tw:h-4 tw:mr-2 tw:opacity-50" />
              {collections && currentCollection ? (
                collections.find(
                  (collection) => collection.id === currentCollection.id,
                )?.title
              ) : (
                <span className="tw:text-muted-foreground">
                  Select a feature collection to show on the map.
                </span>
              )}
            </span>
            <ChevronDownIcon className="tw:ml-2 tw:h-4 tw:w-4 tw:shrink-0 tw:opacity-50" />
          </Button>
        }
      ></PopoverTrigger>
      <PopoverContent
        align="start"
        className="tw:w-full tw:max-w-5xl tw:p-0 z-54"
      >
        <Command>
          <CommandList className="tw:w-full">
            <CommandEmpty>No collection found.</CommandEmpty>
            <CommandGroup>
              {collections?.map((collection) => (
                <>
                  <div className="tw:flex tw:items-center">
                    {/* STAC Collection information button */}
                    <Popover>
                      <PopoverTrigger>
                        <Button variant="ghost" className="rounded">
                          <InfoIcon className="tw:w-3 tw:h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="tw:w-full">
                        <div className="tw:text-xl tw:flex tw:justify-between mb-0">
                          <div className="tw:flex tw:flex-col">
                            <p className="mb-0">
                              {collection?.title ?? collection.id}
                            </p>
                            {collection.description && (
                              <p className="mb-0 tw:text-sm">
                                {collection.description}
                              </p>
                            )}
                          </div>
                          <div className="tw:flex tw:items-center">
                            {config[
                              "ckanext.gztr.public_search.enable_stac_collection_download_button"
                            ] && (
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  {collection &&
                                    isValidHttpUrl(
                                      collection.assets?.geoparquet_file.href,
                                    ) && (
                                      <a
                                        href={
                                          collection.assets?.geoparquet_file
                                            .href
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
                                <TooltipContent className="tw:z-[53] tw:max-w-xl">
                                  Download collection as GeoParquet
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {config[
                              "ckanext.gztr.public_search.enable_stac_collection_json_button"
                            ] && (
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  {collection &&
                                    isValidHttpUrl(
                                      collection.links.find(
                                        (link) => link.rel === "self",
                                      )?.href,
                                    ) && (
                                      <a
                                        href={
                                          collection.links.find(
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
                                <TooltipContent className="tw:z-[53] tw:max-w-xl">
                                  View collection JSON info
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <div className="tw:flex tw:flex-col tw:gap-0">
                          {collection.id && (
                            <p className="mb-0">
                              <strong>STAC Collection ID</strong>:{" "}
                              {collection.id}
                            </p>
                          )}
                          {collection.license && (
                            <p className="mb-0">
                              <strong>License</strong>: {collection.license}
                            </p>
                          )}
                          {collection?.providers && (
                            <p className="mb-0">
                              <strong>
                                Provider
                                {collection.providers?.length &&
                                  collection.providers?.length > 1 &&
                                  "s"}
                              </strong>
                              :{" "}
                              {collection.providers?.map(
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
                                            onClick={(e) => e.stopPropagation()}
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
                                            {provider.roles.length > 1 && "s"}:{" "}
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
                      </PopoverContent>
                    </Popover>
                    <CommandItem
                      key={collection.id}
                      value={collection.id}
                      onSelect={(currentValue) => {
                        setCurrentCollection(
                          currentValue === currentCollection?.id
                            ? undefined
                            : collections.find(
                                (tempCollection) =>
                                  currentValue === tempCollection.id,
                              ),
                        );
                      }}
                      className="tw:cursor-pointer tw:w-full"
                    >
                      {collection.title}
                      <CheckIcon
                        className={cn(
                          "tw:mr-2 tw:h-4 tw:w-4",
                          currentCollection?.id === collection.id
                            ? "tw:opacity-100"
                            : "tw:opacity-0",
                        )}
                      />
                    </CommandItem>
                  </div>
                </>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
