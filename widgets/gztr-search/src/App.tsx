/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
import { ExampleMap } from "@/components/example-map";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDownIcon,
  MapIcon,
  MapPinIcon,
  PencilIcon,
  SquareDashedMousePointerIcon,
  XIcon,
} from "lucide-react";
import { CategoryCombobox } from "@/components/category-combobox";
import { SearchMap } from "@/components/search-map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFormMap } from "./stores/form-map-store";
import { runAddressSearch } from "./lib/utils";
import { useState } from "react";
import { Spinner } from "./components/ui/spinner";

function App() {
  // @ts-ignore
  const [searching, setSearching] = useState<boolean>(false);
  const [isDraw, setIsDraw] = useState<boolean>(false);
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

  return (
    <div>
      <section className="module module-narrow module-shallow">
        <div className="module-heading tw:flex tw:justify-between">
          <span className="tw:w-full">
            <i className="fa fa-globe" /> Filter by location
          </span>
          <a
            className="action tw:float-right"
            href="/dataset/?q=&sort=score+desc+%2C+metadata_modified+desc"
          >
            Clear
          </a>
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
                <PencilIcon />
              </Button>
            </DialogTrigger>
            <DialogContent className="tw:sm:max-w-[90vw]">
              <DialogHeader>
                <DialogTitle>Filter by Location</DialogTitle>
                <DialogDescription className="tw:text-lg mb-0">
                  Please use the bounding box tool to draw a rectangle to filter
                  by location for datasets within your drawn region.
                  <br />
                  You may also use the address search and feature preview tools
                  to help find a location first.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="bounding-box">
                <TabsList>
                  <TabsTrigger value="bounding-box">
                    <SquareDashedMousePointerIcon />
                    Filter by location
                  </TabsTrigger>
                  <TabsTrigger value="address-search">
                    <MapPinIcon />
                    Search for an address
                  </TabsTrigger>
                  <TabsTrigger value="features-preview">
                    <MapIcon />
                    Preview map features
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="bounding-box">
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
                </TabsContent>
                <TabsContent value="address-search">
                  <InputGroup className="tw:max-w-xl">
                    <InputGroupAddon>
                      <MapPinIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Type to search for an address..."
                      onChange={(e) => setSearchValue(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          const map = searchMap?.current.getMap();
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
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        className="btn btn-primary py-0 px-1"
                        disabled={searching}
                        variant="secondary"
                        onClick={async () => {
                          const map = searchMap?.current.getMap();
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
                                      const map = searchMap.current.getMap();
                                      map.fitBounds(
                                        [
                                          [address.lon, address.lat],
                                          [address.lon, address.lat],
                                        ],
                                        { zoom: 10 },
                                      );
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
                </TabsContent>
                <TabsContent value="features-preview">
                  <CategoryCombobox />
                </TabsContent>
              </Tabs>
              {/* Map */}
              <SearchMap />
            </DialogContent>
          </Dialog>
          <ExampleMap />
        </div>
      </section>
      {/* TODO: Similar behavior as TWDH */}
      {/* TODO: Vertical icon buttons that expand on hover to show text including name and description.
        - "Draw" (pencil or box icon): Draw a bounding box to search within that region
        - "Pan" (hand icon): Drag across the map to pan
        - "Search" (magnifying glass icon): Type an address to jump to it or view more results
        - "View features" (layers icon): Select from a combobox popup of features to display on the map,
        you can toggle multiple and can left click a feature on the map for info (e.g. name)
       */}
    </div>
  );
}

export default App;
