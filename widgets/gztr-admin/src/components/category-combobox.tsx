import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useFormMap } from "@/stores/form-map-store";

export function CategoryCombobox() {
  const [open, setOpen] = useState(false);
  const currentCollection = useFormMap((state) => state.currentCollection);
  const setCurrentCollection = useFormMap(
    (state) => state.setCurrentCollection,
  );
  const collections = useFormMap((state) => state.collections);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="tw:w-full tw:justify-between"
        >
          {collections && currentCollection ? (
            collections.find(
              (collection) =>
                collection.properties.location === currentCollection.location,
            )?.properties.label
          ) : (
            <span className="tw:text-sm tw:text-muted-foreground">
              Select a feature category to show on the map.
            </span>
          )}
          <div className="tw:flex tw:gap-1">
            {currentCollection && (
              <Button
                onClick={() => setCurrentCollection(undefined)}
                className="p-0"
                variant="ghost"
              >
                <XIcon className="tw:h-4 tw:w-4 tw:shrink-0 tw:opacity-50 tw:cursor-pointer" />
              </Button>
            )}
            <Button className="p-0" variant="ghost">
              <ChevronDownIcon className="tw:h-4 tw:w-4 tw:shrink-0 tw:opacity-50" />
            </Button>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="tw:w-full tw:p-0">
        <Command>
          <CommandInput placeholder="Search by name..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {collections?.map((collection) => (
                <CommandItem
                  key={collection.properties.location}
                  value={collection.properties.location}
                  onSelect={(currentLocation) => {
                    if (currentCollection && setCurrentCollection)
                      setCurrentCollection(
                        currentLocation === currentCollection.location
                          ? currentCollection
                          : collections.find(
                              (tempCollection) =>
                                currentLocation ===
                                tempCollection.properties.location,
                            )?.properties,
                      );
                    else setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <CheckIcon
                    className={cn(
                      "tw:mr-2 tw:h-4 tw:w-4",
                      currentCollection?.location ===
                        collection.properties.location
                        ? "tw:opacity-100"
                        : "tw:opacity-0",
                    )}
                  />
                  {collection.properties.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
