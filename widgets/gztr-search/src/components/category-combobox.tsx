import { CheckIcon, ChevronDownIcon, MapIcon } from "lucide-react";
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
  const collections = useFormMap((state) => state.collections);
  const currentCollection = useFormMap((state) => state.currentCollection);
  const setCurrentCollection = useFormMap((state) => state.setCurrentCollection);

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
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
      </PopoverTrigger>
      <PopoverContent align="start" className="tw:w-full tw:p-0">
        <Command>
          <CommandInput placeholder="Search by name..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {collections?.map((collection) => (
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
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <CheckIcon
                    className={cn(
                      "tw:mr-2 tw:h-4 tw:w-4",
                      currentCollection?.id === collection.id
                        ? "tw:opacity-100"
                        : "tw:opacity-0",
                    )}
                  />
                  {collection.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
