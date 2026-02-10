import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";
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

export type FeatureCategory = {
  value: string;
  label: string;
  nameKey: string;
};

export const categories: FeatureCategory[] = [
  {
    value: "NM_Public_Water_Systems",
    label: "Public Water Systems",
    nameKey: "PublicSystemName",
  },
  {
    value: "NM_Irrigation_Districts",
    label: "Irrigation Districts",
    nameKey: "District",
  },
  {
    value: "NM_HUC8_Sub_Basins",
    label: "HUC 8 Sub Basins",
    nameKey: "SubBasinName",
  },
  {
    value: "NM_Counties",
    label: "Counties",
    nameKey: "NAMELSAD",
  },
  {
    value: "NM_AIANNH",
    label: "Reservations/Pueblos/Tribal",
    nameKey: "NAMELSAD",
  },
  {
    value: "NM_Census_Designated_Places",
    label: "Census Designated Places",
    nameKey: "NAMELSAD",
  },
  {
    value: "NM_Soil_Water_Conservation_Districts",
    label: "Soil Water Conservation Districts",
    nameKey: "NAME",
  },
  {
    value: "NM_OSE_Districts",
    label: "OSE Districts",
    nameKey: "name",
  },
  {
    value: "NM_OSE_Declared_Groundwater_Basins",
    label: "OSE Declared Groundwater Basins",
    nameKey: "Basin",
  },
  {
    value: "USGS_Principle_Aquifers",
    label: "USGS Principal Aquifers",
    nameKey: "AquiferName",
  },
].sort((a, b) => (a.label < b.label ? -1 : 1));

export function CategoryCombobox({
  currentCategory,
  setCurrentCategory,
}: {
  currentCategory: FeatureCategory | undefined;
  setCurrentCategory: Dispatch<SetStateAction<FeatureCategory | undefined>>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="tw:w-full tw:justify-between"
        >
          {currentCategory ? (
            categories.find(
              (category) => category.value === currentCategory.value,
            )?.label
          ) : (
            <span className="tw:text-sm tw:text-muted-foreground">
              Select a feature category to show on the map.
            </span>
          )}
          <div className="tw:flex tw:gap-1">
            {currentCategory && (
              <Button
                onClick={() => setCurrentCategory(undefined)}
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
              {categories.map((category) => (
                <CommandItem
                  key={category.value}
                  value={category.value}
                  onSelect={(currentValue) => {
                    setCurrentCategory(
                      currentValue === currentCategory?.value
                        ? undefined
                        : categories.find(
                            (tempCategory) =>
                              currentValue === tempCategory.value,
                          ),
                    );
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <CheckIcon
                    className={cn(
                      "tw:mr-2 tw:h-4 tw:w-4",
                      currentCategory?.value === category.value
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
