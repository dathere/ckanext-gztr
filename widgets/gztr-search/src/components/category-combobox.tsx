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
  const categories = useFormMap((state) => state.categories);
  const currentCategory = useFormMap((state) => state.currentCategory);
  const setCurrentCategory = useFormMap((state) => state.setCurrentCategory);

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
            {categories && currentCategory ? (
              categories.find(
                (category) => category.location === currentCategory.location,
              )?.label
            ) : (
              <span className="tw:text-muted-foreground">
                Select a feature category to show on the map.
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
              {categories?.map((category) => (
                <CommandItem
                  key={category.location}
                  value={category.location}
                  onSelect={(currentValue) => {
                    setCurrentCategory(
                      currentValue === currentCategory?.location
                        ? undefined
                        : categories.find(
                            (tempCategory) =>
                              currentValue === tempCategory.location,
                          ),
                    );
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <CheckIcon
                    className={cn(
                      "tw:mr-2 tw:h-4 tw:w-4",
                      currentCategory?.location === category.location
                        ? "tw:opacity-100"
                        : "tw:opacity-0",
                    )}
                  />
                  {category.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
