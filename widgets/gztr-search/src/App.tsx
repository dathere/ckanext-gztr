/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */

import {
  ChevronDownIcon,
  MapPinIcon,
  PencilIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CategoryCombobox } from "@/components/category-combobox";
import { ExampleMap } from "@/components/example-map";
import { SearchMap } from "@/components/search-map";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { runAddressSearch } from "@/lib/utils";
import { useFormMap } from "@/stores/form-map-store";

function App({ config }: any) {
  const [searching, setSearching] = useState<boolean>(false);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [showClear, setShowClear] = useState<boolean>(false);
  const searchMap = useFormMap((state) => state.searchMap);
  const gm = useFormMap((state) => state.gm);
  const addressSearchResults = useFormMap(
    (state) => state.addressSearchResults,
  );
  const setAddressSearchResults = useFormMap(
    (state) => state.setAddressSearchResults,
  );
  const searchValue = useFormMap((state) => state.searchValue);
  const setSearchValue = useFormMap((state) => state.setSearchValue);
  const setSearchResultMarkerLngLat = useFormMap(
    (state) => state.setSearchResultMarkerLngLat,
  );

  useEffect(() => {
    (async () => {
      // Logic for whether to display the Clear button or not
      const search = window.location.search;
      const extBboxExists = new URLSearchParams(search).get("ext_bbox");
      if (extBboxExists) {
        setShowClear(true);
      } else setShowClear(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      // Logic for whether to display the Clear button or not
      const search = window.location.search;
      const extBboxExists = new URLSearchParams(search).get("ext_bbox");
      if (extBboxExists) {
        setShowClear(true);
      } else setShowClear(false);
    })();
  }, []);

  return (
    <div>
      <section className="module module-narrow module-shallow">
        <div className="module-heading tw:flex tw:justify-between">
          <span className="tw:w-full">
            <i className="fa fa-globe" /> Filter by location
          </span>
          {showClear && (
            <a className="tw:float-right" href="/dataset">
              Clear
            </a>
          )}
        </div>
        <div className="tw:relative">
          <Dialog>
            <DialogTrigger
              asChild
              className="tw:absolute tw:top-1 tw:right-1 tw:z-10 tw:border-2 tw:border-solid"
            >
              <Button
                className="tw:rounded-lg tw:shadow-xl p-2"
                variant="secondary"
              >
                <SearchIcon />
                Search by bounding box
              </Button>
            </DialogTrigger>
            <DialogContent className="tw:sm:max-w-[90vw]">
              <DialogHeader>
                <DialogTitle>Filter by Location</DialogTitle>
                <DialogDescription className="tw:text-lg mb-0">
                  <strong>
                    Please use the bounding box tool to draw a rectangle
                  </strong>{" "}
                  to filter by location for datasets intersecting with your
                  drawn region.
                  <br />
                  You may also use the address search and feature preview tools
                  to help find a location first.
                </DialogDescription>
              </DialogHeader>
              <div className="tw:flex tw:justify-between">
                <div className="tw:flex tw:gap-2 tw:h-full">
                  {isDraw ? (
                    <Button
                      className="btn btn-danger rounded"
                      onClick={() => {
                        if (gm) {
                          // Cancel if currently in draw mode and cancel button is clicked
                          if (gm.drawEnabled("rectangle")) {
                            gm.disableDraw();
                            setIsDraw(false);
                          }
                        }
                      }}
                    >
                      <XIcon className="tw:inline-block tw:mr-1 tw:w-4 tw:h-4" />
                      Cancel drawing
                    </Button>
                  ) : (
                    <Button
                      className="btn btn-primary rounded"
                      onClick={() => {
                        if (gm) {
                          // Cancel if currently in draw mode and cancel button is clicked
                          if (gm.drawEnabled("rectangle")) {
                            gm.disableDraw();
                            setIsDraw(false);
                          } else {
                            gm.enableDraw("rectangle");
                            setIsDraw(true);
                          }
                        }
                      }}
                    >
                      <PencilIcon className="tw:inline-block tw:mr-1 tw:w-4 tw:h-4" />
                      Draw a bounding box
                    </Button>
                  )}
                  <CategoryCombobox />
                </div>
                <InputGroup className="tw:max-w-xl">
                  <InputGroupAddon>
                    <MapPinIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Enter an address to search for here..."
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        if (searchMap) {
                          setSearching(true);
                          await runAddressSearch(
                            config,
                            searchValue,
                            searchMap,
                            setAddressSearchResults,
                            setSearchResultMarkerLngLat,
                          );
                          setSearching(false);
                        }
                      } else {
                        setAddressSearchResults([]);
                      }
                    }}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      className="btn btn-primary py-0 px-1"
                      disabled={searching}
                      variant="secondary"
                      onClick={async () => {
                        if (searchMap) {
                          setSearching(true);
                          await runAddressSearch(
                            config,
                            searchValue,
                            searchMap,
                            setAddressSearchResults,
                            setSearchResultMarkerLngLat,
                          );
                          setSearching(false);
                        }
                      }}
                    >
                      {searching ? (
                        <>
                          Searching... <Spinner data-icon="inline-end" />
                        </>
                      ) : (
                        "Search"
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                  {addressSearchResults.length > 0 && (
                    <InputGroupAddon align="inline-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <InputGroupButton className="!pr-1.5 text-xs">
                            View results...{" "}
                            <ChevronDownIcon className="size-1" />
                          </InputGroupButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="[--radius:0.95rem]"
                        >
                          <DropdownMenuGroup>
                            {addressSearchResults.map((address, idx) => (
                              <DropdownMenuItem
                                className="tw:w-full tw:justify-start tw:cursor-pointer"
                                onClick={() => {
                                  if (searchMap) {
                                    searchMap.fitBounds(
                                      [
                                        [address.lon, address.lat],
                                        [address.lon, address.lat],
                                      ],
                                      { zoom: 10 },
                                    );
                                    setSearchResultMarkerLngLat({
                                      lon: address.lon,
                                      lat: address.lat,
                                    });
                                  }
                                }}
                                key={idx}
                              >
                                {address.display_name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </div>
              <SearchMap config={config} />
            </DialogContent>
          </Dialog>
          <ExampleMap config={config} />
        </div>
      </section>
    </div>
  );
}

export default App;
