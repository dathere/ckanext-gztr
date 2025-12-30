import type { Geoman } from "@geoman-io/maplibre-geoman-free";
import { cva, type VariantProps } from "class-variance-authority";
import {
  CheckIcon,
  ChevronDown,
  ChevronsUpDown,
  SearchIcon,
  WandSparkles,
  XCircle,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { zoomToFeatureBounds } from "@/lib/state-management";
import { cn } from "@/lib/utils";
import { useFormMap } from "@/stores/form-map-store";

/**
 * Animation types and configurations
 */
export interface AnimationConfig {
  /** Badge animation type */
  badgeAnimation?: "bounce" | "pulse" | "wiggle" | "fade" | "slide" | "none";
  /** Popover animation type */
  popoverAnimation?: "scale" | "slide" | "fade" | "flip" | "none";
  /** Option hover animation type */
  optionHoverAnimation?: "highlight" | "scale" | "glow" | "none";
  /** Animation duration in seconds */
  duration?: number;
  /** Animation delay in seconds */
  delay?: number;
}

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
const multiSelectVariants = cva("m-1 transition-all duration-300 ease-in-out", {
  variants: {
    variant: {
      default:
        "tw:border-foreground/10 tw:text-foreground tw:bg-card tw:hover:bg-card/80",
      secondary:
        "tw:border-foreground/10 tw:bg-secondary tw:text-secondary-foreground tw:hover:bg-secondary/80",
      destructive:
        "tw:border-transparent tw:bg-destructive tw:text-destructive-foreground tw:hover:bg-destructive/80",
      inverted: "tw:inverted",
    },
    badgeAnimation: {
      bounce: "tw:hover:-translate-y-1 tw:hover:scale-110",
      pulse: "tw:hover:animate-pulse",
      wiggle: "tw:hover:animate-wiggle",
      fade: "tw:hover:opacity-80",
      slide: "tw:hover:translate-x-1",
      none: "",
    },
  },
  defaultVariants: {
    variant: "default",
    badgeAnimation: "bounce",
  },
});

/**
 * Option interface for MultiSelect component
 */
interface MultiSelectOption {
  /** The text to display for the option. */
  label: string;
  /** The unique value associated with the option. */
  value: string;
  category?: string;
  geometry?: any;
  /** Optional icon component to display alongside the option. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Custom styling for the option */
  style?: {
    /** Custom badge color */
    badgeColor?: string;
    /** Custom icon color */
    iconColor?: string;
    /** Gradient background for badge */
    gradient?: string;
  };
}

/**
 * Group interface for organizing options
 */
interface MultiSelectGroup {
  /** Group heading */
  heading: string;
  /** Options in this group */
  options: MultiSelectOption[];
}

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "animationConfig"
    >,
    VariantProps<typeof multiSelectVariants> {
  /**
   * An array of option objects or groups to be displayed in the multi-select component.
   */
  options: MultiSelectOption[] | MultiSelectGroup[];
  /**
   * Callback function triggered when the selected values change.
   * Receives an array of the new selected values.
   */
  onValueChange: (value: string[]) => void;

  /** The default selected values when the component mounts. */
  defaultValue?: any[];

  /**
   * Placeholder text to be displayed when no values are selected.
   * Optional, defaults to "Select options".
   */
  placeholder?: string;

  /**
   * Animation duration in seconds for the visual effects (e.g., bouncing badges).
   * Optional, defaults to 0 (no animation).
   */
  animation?: number;

  /**
   * Advanced animation configuration for different component parts.
   * Optional, allows fine-tuning of various animation effects.
   */
  animationConfig?: AnimationConfig;

  /**
   * Maximum number of items to display. Extra selected items will be summarized.
   * Optional, defaults to 3.
   */
  maxCount?: number;

  /**
   * The modality of the popover. When set to true, interaction with outside elements
   * will be disabled and only popover content will be visible to screen readers.
   * Optional, defaults to false.
   */
  modalPopover?: boolean;

  /**
   * If true, renders the multi-select component as a child of another component.
   * Optional, defaults to false.
   */
  asChild?: boolean;

  /**
   * Additional class names to apply custom styles to the multi-select component.
   * Optional, can be used to add custom styles.
   */
  className?: string;

  /**
   * If true, disables the select all functionality.
   * Optional, defaults to false.
   */
  hideSelectAll?: boolean;

  /**
   * If true, shows search functionality in the popover.
   * If false, hides the search input completely.
   * Optional, defaults to true.
   */
  searchable?: boolean;

  /**
   * Custom empty state message when no options match search.
   * Optional, defaults to "No results found."
   */
  emptyIndicator?: React.ReactNode;

  /**
   * If true, allows the component to grow and shrink with its content.
   * If false, uses fixed width behavior.
   * Optional, defaults to false.
   */
  autoSize?: boolean;

  /**
   * If true, shows badges in a single line with horizontal scroll.
   * If false, badges wrap to multiple lines.
   * Optional, defaults to false.
   */
  singleLine?: boolean;

  /**
   * Custom CSS class for the popover content.
   * Optional, can be used to customize popover appearance.
   */
  popoverClassName?: string;

  /**
   * If true, disables the component completely.
   * Optional, defaults to false.
   */
  disabled?: boolean;

  /**
   * Responsive configuration for different screen sizes.
   * Allows customizing maxCount and other properties based on viewport.
   * Can be boolean true for default responsive behavior or an object for custom configuration.
   */
  responsive?:
    | boolean
    | {
        /** Configuration for mobile devices (< 640px) */
        mobile?: {
          maxCount?: number;
          hideIcons?: boolean;
          compactMode?: boolean;
        };
        /** Configuration for tablet devices (640px - 1024px) */
        tablet?: {
          maxCount?: number;
          hideIcons?: boolean;
          compactMode?: boolean;
        };
        /** Configuration for desktop devices (> 1024px) */
        desktop?: {
          maxCount?: number;
          hideIcons?: boolean;
          compactMode?: boolean;
        };
      };

  /**
   * Minimum width for the component.
   * Optional, defaults to auto-sizing based on content.
   * When set, component will not shrink below this width.
   */
  minWidth?: string;

  /**
   * Maximum width for the component.
   * Optional, defaults to 100% of container.
   * Component will not exceed container boundaries.
   */
  maxWidth?: string;

  /**
   * If true, automatically removes duplicate options based on their value.
   * Optional, defaults to false (shows warning in dev mode instead).
   */
  deduplicateOptions?: boolean;

  /**
   * If true, the component will reset its internal state when defaultValue changes.
   * Useful for React Hook Form integration and form reset functionality.
   * Optional, defaults to true.
   */
  resetOnDefaultValueChange?: boolean;

  /**
   * If true, automatically closes the popover after selecting an option.
   * Useful for single-selection-like behavior or mobile UX.
   * Optional, defaults to false.
   */
  closeOnSelect?: boolean;

  gm?: Geoman;
}

/**
 * Imperative methods exposed through ref
 */
export interface MultiSelectRef {
  /**
   * Programmatically reset the component to its default value
   */
  reset: () => void;
  /**
   * Get current selected values
   */
  getSelectedValues: () => string[];
  /**
   * Set selected values programmatically
   */
  setSelectedValues: (values: string[]) => void;
  /**
   * Clear all selected values
   */
  clear: () => void;
  /**
   * Focus the component
   */
  focus: () => void;
}

export const MultiSelect = React.forwardRef<MultiSelectRef, MultiSelectProps>(
  (
    {
      options,
      onValueChange,
      variant,
      defaultValue = [],
      placeholder = "Select options",
      animation = 0,
      animationConfig,
      maxCount = 3,
      modalPopover = false,
      asChild = false,
      className,
      hideSelectAll = false,
      searchable = true,
      emptyIndicator,
      autoSize = false,
      singleLine = false,
      popoverClassName,
      disabled = false,
      responsive,
      minWidth,
      maxWidth,
      deduplicateOptions = false,
      resetOnDefaultValueChange = true,
      closeOnSelect = false,
      gm,
      ...props
    },
    ref,
  ) => {
    const formMap = useFormMap((state) => state.formMap);
    const setTempSpatialFull = useFormMap((state) => state.setTempSpatialFull);
    const [selectedValues, setSelectedValues] =
      React.useState<any[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    const [politeMessage, setPoliteMessage] = React.useState("");
    const [assertiveMessage, setAssertiveMessage] = React.useState("");
    const prevSelectedCount = React.useRef(selectedValues.length);
    const prevIsOpen = React.useRef(isPopoverOpen);
    const prevSearchValue = React.useRef(searchValue);

    const announce = React.useCallback(
      (message: string, priority: "polite" | "assertive" = "polite") => {
        if (priority === "assertive") {
          setAssertiveMessage(message);
          setTimeout(() => setAssertiveMessage(""), 100);
        } else {
          setPoliteMessage(message);
          setTimeout(() => setPoliteMessage(""), 100);
        }
      },
      [],
    );

    const multiSelectId = React.useId();
    const listboxId = `${multiSelectId}-listbox`;
    const triggerDescriptionId = `${multiSelectId}-description`;
    const selectedCountId = `${multiSelectId}-count`;

    const prevDefaultValueRef = React.useRef<string[]>(defaultValue);

    const isGroupedOptions = React.useCallback(
      (
        opts: MultiSelectOption[] | MultiSelectGroup[],
      ): opts is MultiSelectGroup[] => {
        return opts.length > 0 && "heading" in opts[0];
      },
      [],
    );

    const arraysEqual = React.useCallback(
      (a: string[], b: string[]): boolean => {
        if (a.length !== b.length) return false;
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        return sortedA.every((val, index) => val === sortedB[index]);
      },
      [],
    );

    const resetToDefault = React.useCallback(() => {
      setSelectedValues(defaultValue);
      setIsPopoverOpen(false);
      setSearchValue("");
      onValueChange(defaultValue);
    }, [defaultValue, onValueChange]);

    const buttonRef = React.useRef<HTMLButtonElement>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        reset: resetToDefault,
        getSelectedValues: () => selectedValues,
        setSelectedValues: (values: string[]) => {
          setSelectedValues(values);
          onValueChange(values);
        },
        clear: () => {
          setSelectedValues([]);
          onValueChange([]);
        },
        focus: () => {
          if (buttonRef.current) {
            buttonRef.current.focus();
            const originalOutline = buttonRef.current.style.outline;
            const originalOutlineOffset = buttonRef.current.style.outlineOffset;
            buttonRef.current.style.outline = "2px solid hsl(var(--ring))";
            buttonRef.current.style.outlineOffset = "2px";
            setTimeout(() => {
              if (buttonRef.current) {
                buttonRef.current.style.outline = originalOutline;
                buttonRef.current.style.outlineOffset = originalOutlineOffset;
              }
            }, 1000);
          }
        },
      }),
      [resetToDefault, selectedValues, onValueChange],
    );

    const [screenSize, setScreenSize] = React.useState<
      "mobile" | "tablet" | "desktop"
    >("desktop");

    React.useEffect(() => {
      if (typeof window === "undefined") return;
      const handleResize = () => {
        const width = window.innerWidth;
        if (width < 640) {
          setScreenSize("mobile");
        } else if (width < 1024) {
          setScreenSize("tablet");
        } else {
          setScreenSize("desktop");
        }
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("resize", handleResize);
        }
      };
    }, []);

    const getResponsiveSettings = () => {
      if (!responsive) {
        return {
          maxCount: maxCount,
          hideIcons: false,
          compactMode: false,
        };
      }
      if (responsive === true) {
        const defaultResponsive = {
          mobile: { maxCount: 2, hideIcons: false, compactMode: true },
          tablet: { maxCount: 4, hideIcons: false, compactMode: false },
          desktop: { maxCount: 6, hideIcons: false, compactMode: false },
        };
        const currentSettings = defaultResponsive[screenSize];
        return {
          maxCount: currentSettings?.maxCount ?? maxCount,
          hideIcons: currentSettings?.hideIcons ?? false,
          compactMode: currentSettings?.compactMode ?? false,
        };
      }
      const currentSettings = responsive[screenSize];
      return {
        maxCount: currentSettings?.maxCount ?? maxCount,
        hideIcons: currentSettings?.hideIcons ?? false,
        compactMode: currentSettings?.compactMode ?? false,
      };
    };

    const responsiveSettings = getResponsiveSettings();

    const getBadgeAnimationClass = () => {
      if (animationConfig?.badgeAnimation) {
        switch (animationConfig.badgeAnimation) {
          case "bounce":
            return isAnimating
              ? "tw:animate-bounce"
              : "tw:hover:-translate-y-1 tw:hover:scale-110";
          case "pulse":
            return "tw:hover:animate-pulse";
          case "wiggle":
            return "tw:hover:animate-wiggle";
          case "fade":
            return "tw:hover:opacity-80";
          case "slide":
            return "tw:hover:translate-x-1";
          case "none":
            return "";
          default:
            return "";
        }
      }
      return isAnimating ? "tw:animate-bounce" : "";
    };

    const getPopoverAnimationClass = () => {
      if (animationConfig?.popoverAnimation) {
        switch (animationConfig.popoverAnimation) {
          case "scale":
            return "tw:animate-scaleIn";
          case "slide":
            return "tw:animate-slideInDown";
          case "fade":
            return "tw:animate-fadeIn";
          case "flip":
            return "tw:animate-flipIn";
          case "none":
            return "";
          default:
            return "";
        }
      }
      return "";
    };

    const getAllOptions = React.useCallback((): MultiSelectOption[] => {
      if (options.length === 0) return [];
      let allOptions: MultiSelectOption[];
      if (isGroupedOptions(options)) {
        allOptions = options.flatMap((group) => group.options);
      } else {
        allOptions = options;
      }
      const valueSet = new Set<string>();
      const duplicates: string[] = [];
      const uniqueOptions: MultiSelectOption[] = [];
      allOptions.forEach((option) => {
        if (valueSet.has(option.value)) {
          duplicates.push(option.value);
          if (!deduplicateOptions) {
            uniqueOptions.push(option);
          }
        } else {
          valueSet.add(option.value);
          uniqueOptions.push(option);
        }
      });
      if (process.env.NODE_ENV === "development" && duplicates.length > 0) {
        const action = deduplicateOptions
          ? "automatically removed"
          : "detected";
        console.warn(
          `MultiSelect: Duplicate option values ${action}: ${duplicates.join(
            ", ",
          )}. ` +
            `${
              deduplicateOptions
                ? "Duplicates have been removed automatically."
                : "This may cause unexpected behavior. Consider setting 'deduplicateOptions={true}' or ensure all option values are unique."
            }`,
        );
      }
      return deduplicateOptions ? uniqueOptions : allOptions;
    }, [options, deduplicateOptions, isGroupedOptions]);

    const getOptionByValue = React.useCallback(
      (value: string, groupName?: string): MultiSelectOption | undefined => {
        const option = getAllOptions().find(
          (option) =>
            option.value === value &&
            (groupName ? option.category === groupName : true),
        );
        if (!option && process.env.NODE_ENV === "development") {
          console.warn(
            `MultiSelect: Option with value "${value}" not found in options list`,
          );
        }
        return option;
      },
      [getAllOptions],
    );

    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchValue) return options;
      if (options.length === 0) return [];
      if (isGroupedOptions(options)) {
        return options
          .map((group) => ({
            ...group,
            options: group.options.filter(
              (option) =>
                option.label
                  .toLowerCase()
                  .includes(searchValue.toLowerCase()) ||
                option.value.toLowerCase().includes(searchValue.toLowerCase()),
            ),
          }))
          .filter((group) => group.options.length > 0);
      }
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          option.value.toLowerCase().includes(searchValue.toLowerCase()),
      );
    }, [options, searchValue, searchable, isGroupedOptions]);

    const handleInputKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (event.key === "Enter") {
        setIsPopoverOpen(true);
      } else if (event.key === "Backspace" && !event.currentTarget.value) {
        const newSelectedValues = [...selectedValues];
        newSelectedValues.pop();
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
      }
    };

    const toggleOption = async (optionValue: string, groupName?: string) => {
      if (disabled) return;
      const option = getOptionByValue(optionValue, groupName);
      if (option?.disabled) return;
      let newSelectedValues = [...selectedValues];
      const existingValueIndex = selectedValues.findIndex(
        (opt) => opt.value === optionValue && opt.category === groupName,
      );
      if (existingValueIndex > -1)
        newSelectedValues.splice(existingValueIndex, 1);
      else
        newSelectedValues = [
          ...selectedValues,
          { value: optionValue, category: groupName },
        ];
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
      // Use one GeoJSON source as a FeatureCollection instead of multiple sources, then use same GeoJSON data for ckanext-spatial
      if (option?.geometry) {
        if (formMap) {
          const map = formMap.current.getMap();
          const existingLayer = map.getLayer("featureLayer");
          const existingSource = map.getSource("featureSource");
          if (existingLayer && existingSource) {
            // @ts-expect-error
            const geojsonData: GeoJSON = await existingSource.getData();
            // Check if feature exist, if so remove, otherwise add
            const existingFeatureIndex = geojsonData.features.findIndex(
              (f: any) =>
                f.properties.value === optionValue &&
                f.properties.category === groupName,
            );
            if (existingFeatureIndex > -1) {
              geojsonData.features.splice(existingValueIndex, 1);
              // @ts-expect-error
              existingSource.setData(geojsonData);
            } else {
              geojsonData.features.push({
                type: "Feature",
                geometry: option.geometry,
                properties: {
                  value: option.value,
                  category: option.category,
                },
              });
              // @ts-expect-error
              existingSource.setData(geojsonData);
              await zoomToFeatureBounds(option.value, formMap);
            }
            setTempSpatialFull(geojsonData);
          } else {
            map.addSource("featureSource", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: option.geometry,
                    properties: {
                      value: option.value,
                      category: option.category,
                    },
                  },
                ],
              },
            });
            map.addLayer({
              id: "featureLayer",
              // References the GeoJSON source defined above
              // and does not require a `source-layer`
              source: "featureSource",
              type: "fill",
              paint: { "fill-color": "rgba(80, 170, 244, 0.75)" },
            });
            // await zoomToFeatureBounds(option.value, formMap);
            // @ts-expect-error
            const geojsonData = await map.getSource("featureSource").getData();
            setTempSpatialFull(geojsonData);
          }
        }
      }
      // if (option?.geometry) {
      //   if (formMap) {
      //     const map = formMap.current.getMap();
      //     const existingLayer = map.getLayer(option.value);
      //     const existingSource = map.getSource(option.value);
      //     if (existingLayer && existingSource) {
      //       map.removeLayer(option.value);
      //       map.removeSource(option.value);
      //     } else {
      //       map.addSource(option.value, {
      //         type: "geojson",
      //         data: {
      //           type: "Feature",
      //           geometry: option.geometry,
      //           properties: {
      //             value: option.value,
      //             category: option.category,
      //           },
      //         },
      //       });
      //       zoomToFeatureBounds(option);
      //       map.addLayer({
      //         id: option.value,
      //         // References the GeoJSON source defined above
      //         // and does not require a `source-layer`
      //         source: option.value,
      //         type: "fill",
      //         paint: { "fill-color": "rgba(80, 170, 244, 0.75)" },
      //       });
      //     }
      //   }
      // }
      if (closeOnSelect) {
        setIsPopoverOpen(false);
      }
    };

    const handleClear = () => {
      if (disabled) return;
      if (formMap) {
        const map = formMap.current.getMap();
        map.removeLayer("featureLayer");
        map.removeSource("featureSource");
      }
      setSelectedValues([]);
      onValueChange([]);
    };

    const handleTogglePopover = () => {
      if (disabled) return;
      setIsPopoverOpen((prev) => !prev);
    };

    const clearExtraOptions = () => {
      if (disabled) return;
      const newSelectedValues = selectedValues.slice(
        0,
        responsiveSettings.maxCount,
      );
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const toggleAll = () => {
      if (disabled) return;
      const allOptions = getAllOptions().filter((option) => !option.disabled);
      if (selectedValues.length === allOptions.length) {
        handleClear();
      } else {
        const allValues = allOptions.map((option) => option.value);
        setSelectedValues(allValues);
        onValueChange(allValues);
      }

      if (closeOnSelect) {
        setIsPopoverOpen(false);
      }
    };

    React.useEffect(() => {
      if (!resetOnDefaultValueChange) return;
      const prevDefaultValue = prevDefaultValueRef.current;
      if (!arraysEqual(prevDefaultValue, defaultValue)) {
        if (!arraysEqual(selectedValues, defaultValue)) {
          setSelectedValues(defaultValue);
        }
        prevDefaultValueRef.current = [...defaultValue];
      }
    }, [defaultValue, selectedValues, arraysEqual, resetOnDefaultValueChange]);

    const getWidthConstraints = () => {
      const defaultMinWidth = screenSize === "mobile" ? "0px" : "200px";
      const effectiveMinWidth = minWidth || defaultMinWidth;
      const effectiveMaxWidth = maxWidth || "100%";
      return {
        minWidth: effectiveMinWidth,
        maxWidth: effectiveMaxWidth,
        width: autoSize ? "auto" : "100%",
      };
    };

    const widthConstraints = getWidthConstraints();

    React.useEffect(() => {
      if (!isPopoverOpen) {
        setSearchValue("");
      }
    }, [isPopoverOpen]);

    React.useEffect(() => {
      const selectedCount = selectedValues.length;
      const allOptions = getAllOptions();
      const totalOptions = allOptions.filter((opt) => !opt.disabled).length;
      if (selectedCount !== prevSelectedCount.current) {
        const diff = selectedCount - prevSelectedCount.current;
        if (diff > 0) {
          const addedItems = selectedValues.slice(-diff);
          const addedLabels = addedItems
            .map(
              (value) => allOptions.find((opt) => opt.value === value)?.label,
            )
            .filter(Boolean);

          if (addedLabels.length === 1) {
            announce(
              `${addedLabels[0]} selected. ${selectedCount} of ${totalOptions} options selected.`,
            );
          } else {
            announce(
              `${addedLabels.length} options selected. ${selectedCount} of ${totalOptions} total selected.`,
            );
          }
        } else if (diff < 0) {
          announce(
            `Option removed. ${selectedCount} of ${totalOptions} options selected.`,
          );
        }
        prevSelectedCount.current = selectedCount;
      }

      if (isPopoverOpen !== prevIsOpen.current) {
        if (isPopoverOpen) {
          announce(
            `Dropdown opened. ${totalOptions} options available. Use arrow keys to navigate.`,
          );
        } else {
          announce("Dropdown closed.");
        }
        prevIsOpen.current = isPopoverOpen;
      }

      if (
        searchValue !== prevSearchValue.current &&
        searchValue !== undefined
      ) {
        if (searchValue && isPopoverOpen) {
          const filteredCount = allOptions.filter(
            (opt) =>
              opt.label.toLowerCase().includes(searchValue.toLowerCase()) ||
              opt.value.toLowerCase().includes(searchValue.toLowerCase()),
          ).length;

          announce(
            `${filteredCount} option${
              filteredCount === 1 ? "" : "s"
            } found for "${searchValue}"`,
          );
        }
        prevSearchValue.current = searchValue;
      }
    }, [selectedValues, isPopoverOpen, searchValue, announce, getAllOptions]);

    return (
      <>
        <div className="tw:sr-only">
          <div aria-live="polite" aria-atomic="true" role="status">
            {politeMessage}
          </div>
          <div aria-live="assertive" aria-atomic="true" role="alert">
            {assertiveMessage}
          </div>
        </div>

        <Popover
          open={isPopoverOpen}
          onOpenChange={setIsPopoverOpen}
          modal={modalPopover}
        >
          <div id={triggerDescriptionId} className="tw:sr-only">
            Multi-select dropdown. Use arrow keys to navigate, Enter to select,
            and Escape to close.
          </div>
          <div id={selectedCountId} className="tw:sr-only" aria-live="polite">
            {selectedValues.length === 0
              ? "No options selected"
              : `${selectedValues.length} option${
                  selectedValues.length === 1 ? "" : "s"
                } selected: ${selectedValues
                  .map((value) => getOptionByValue(value)?.label)
                  .filter(Boolean)
                  .join(", ")}`}
          </div>

          <PopoverTrigger asChild>
            <Button
              ref={buttonRef}
              {...props}
              onClick={handleTogglePopover}
              disabled={disabled}
              role="combobox"
              aria-expanded={isPopoverOpen}
              aria-haspopup="listbox"
              aria-controls={isPopoverOpen ? listboxId : undefined}
              aria-describedby={`${triggerDescriptionId} ${selectedCountId}`}
              aria-label={`Multi-select: ${selectedValues.length} of ${
                getAllOptions().length
              } options selected. ${placeholder}`}
              className={cn(
                "tw:flex tw:p-1 tw:rounded-md tw:border tw:min-h-10 tw:h-auto tw:items-center tw:justify-between tw:bg-inherit tw:hover:bg-inherit tw:[&_svg]:pointer-events-auto",
                autoSize ? "tw:w-auto" : "tw:w-full",
                responsiveSettings.compactMode && "tw:min-h-8 tw:text-sm",
                screenSize === "mobile" && "tw:min-h-12 tw:text-base",
                disabled && "tw:opacity-50 tw:cursor-not-allowed",
                className,
              )}
              style={{
                ...widthConstraints,
                maxWidth: `min(${widthConstraints.maxWidth}, 100%)`,
              }}
            >
              {selectedValues.length > 0 ? (
                <div className="tw:flex tw:justify-between tw:items-center tw:w-full">
                  <div
                    className={cn(
                      "tw:flex tw:items-center tw:gap-1 tw:max-h-[335px] tw:overflow-y-auto",
                      singleLine
                        ? "tw:overflow-x-auto tw:multiselect-singleline-scroll"
                        : "tw:flex-wrap",
                      responsiveSettings.compactMode && "gap-0.5",
                    )}
                    style={
                      singleLine
                        ? {
                            paddingBottom: "4px",
                          }
                        : {}
                    }
                  >
                    {selectedValues
                      .slice(0, responsiveSettings.maxCount)
                      .map((value) => {
                        // biome-ignore lint/complexity/noUselessUndefinedInitialization: <explanation>
                        let option = undefined;
                        if (value.category === "Drawn features") {
                          option = {
                            label: value.value,
                            value: value.value,
                            category: value.category,
                            geometry: gm?.features
                              .get("gm_main", value.value)
                              ?.getGeoJson().geometry,
                          };
                        } else {
                          option = getOptionByValue(
                            value.value,
                            value.category,
                          );
                        }
                        const IconComponent = option?.icon;
                        const customStyle = option?.style;
                        if (!option) {
                          return null;
                        }
                        const badgeStyle: React.CSSProperties = {
                          animationDuration: `${animation}s`,
                          ...(customStyle?.badgeColor && {
                            backgroundColor: customStyle.badgeColor,
                          }),
                          ...(customStyle?.gradient && {
                            background: customStyle.gradient,
                            color: "white",
                          }),
                        };
                        return (
                          <Badge
                            key={value.value}
                            className={cn(
                              getBadgeAnimationClass(),
                              multiSelectVariants({ variant }),
                              customStyle?.gradient &&
                                "tw:text-white tw:border-transparent",
                              responsiveSettings.compactMode &&
                                "tw:text-xs tw:px-1.5 tw:py-0.5",
                              screenSize === "mobile" &&
                                "tw:max-w-[120px] tw:truncate",
                              singleLine &&
                                "tw:flex-shrink-0 tw:whitespace-nowrap",
                              "tw:[&>svg]:pointer-events-auto",
                            )}
                            style={{
                              ...badgeStyle,
                              animationDuration: `${
                                animationConfig?.duration || animation
                              }s`,
                              animationDelay: `${animationConfig?.delay || 0}s`,
                            }}
                          >
                            {IconComponent && !responsiveSettings.hideIcons && (
                              <IconComponent
                                className={cn(
                                  "tw:h-4 tw:w-4 tw:mr-2",
                                  responsiveSettings.compactMode &&
                                    "tw:h-3 tw:w-3 tw:mr-1",
                                  customStyle?.iconColor && "tw:text-current",
                                )}
                                {...(customStyle?.iconColor && {
                                  style: { color: customStyle.iconColor },
                                })}
                              />
                            )}
                            <span
                              className={cn(
                                screenSize === "mobile" && "truncate",
                              )}
                            >
                              {option.label} ({option.category})
                            </span>
                            <Button
                              variant="ghost"
                              tabIndex={0}
                              onClick={async (event) => {
                                event.stopPropagation();
                                await zoomToFeatureBounds(
                                  option.value,
                                  formMap,
                                );
                              }}
                              onKeyDown={async (event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  await zoomToFeatureBounds(
                                    option.value,
                                    formMap,
                                  );
                                }
                              }}
                              aria-label={`Zoom to ${option.label}`}
                              className="tw:ml-2 tw:h-4 tw:w-4 tw:cursor-pointer tw:rounded-sm tw:p-0.5 tw:-m-0.5"
                            >
                              <SearchIcon
                                className={cn(
                                  "tw:h-3 tw:w-3",
                                  responsiveSettings.compactMode &&
                                    "tw:h-2.5 tw:w-2.5",
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              tabIndex={1}
                              onClick={async (event) => {
                                event.stopPropagation();
                                await toggleOption(value.value, value.category);
                              }}
                              onKeyDown={async (event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  await toggleOption(
                                    value.value,
                                    value.category,
                                  );
                                }
                              }}
                              aria-label={`Remove ${option.label} from selection`}
                              className="tw:ml-2 tw:h-4 tw:w-4 tw:cursor-pointer tw:rounded-sm tw:p-0.5 tw:-m-0.5 tw:focus:outline-none"
                            >
                              <XCircle
                                className={cn(
                                  "tw:h-3 tw:w-3",
                                  responsiveSettings.compactMode &&
                                    "tw:h-2.5 tw:w-2.5",
                                )}
                              />
                            </Button>
                          </Badge>
                        );
                      })
                      .filter(Boolean)}
                    {selectedValues.length > responsiveSettings.maxCount && (
                      <Badge
                        className={cn(
                          "tw:bg-transparent tw:text-foreground tw:border-foreground/1 tw:hover:bg-transparent",
                          getBadgeAnimationClass(),
                          multiSelectVariants({ variant }),
                          responsiveSettings.compactMode &&
                            "tw:text-xs tw:px-1.5 tw:py-0.5",
                          singleLine && "tw:flex-shrink-0 tw:whitespace-nowrap",
                          "tw:[&>svg]:pointer-events-auto",
                        )}
                        style={{
                          animationDuration: `${
                            animationConfig?.duration || animation
                          }s`,
                          animationDelay: `${animationConfig?.delay || 0}s`,
                        }}
                      >
                        {`+ ${
                          selectedValues.length - responsiveSettings.maxCount
                        } more`}
                        <XCircle
                          className={cn(
                            "tw:ml-2 tw:h-4 tw:w-4 tw:cursor-pointer",
                            responsiveSettings.compactMode && "ml-1 h-3 w-3",
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            clearExtraOptions();
                          }}
                        />
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleClear();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          handleClear();
                        }
                      }}
                      aria-label={`Clear all ${selectedValues.length} selected options`}
                      className="tw:flex tw:items-center tw:justify-center tw:h-4 tw:w-4 tw:mx-2 tw:cursor-pointer tw:text-muted-foreground tw:hover:text-foreground tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-ring tw:focus:ring-offset-1 tw:rounded-sm"
                    >
                      <XIcon className="tw:h-4 tw:w-4" />
                    </div>
                    <Separator
                      orientation="vertical"
                      className="tw:flex tw:min-h-6 tw:h-full"
                    />
                    <ChevronDown
                      className="tw:h-4 tw:mx-2 tw:cursor-pointer tw:text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              ) : (
                <div className="tw:flex tw:items-center tw:justify-between tw:w-full tw:mx-auto">
                  <span className="tw:text-sm tw:text-muted-foreground tw:mx-3">
                    {placeholder}
                  </span>
                  <ChevronDown className="tw:h-4 tw:cursor-pointer tw:text-muted-foreground tw:mx-2" />
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            aria-label="Available options"
            avoidCollisions={false}
            side="right"
            className={cn(
              "tw:w-auto tw:p-0",
              getPopoverAnimationClass(),
              screenSize === "mobile" && "tw:w-[85vw] tw:max-w-[280px]",
              screenSize === "tablet" && "tw:w-[70vw] tw:max-w-md",
              screenSize === "desktop" && "tw:min-w-[300px]",
              popoverClassName,
            )}
            style={{
              animationDuration: `${animationConfig?.duration || animation}s`,
              animationDelay: `${animationConfig?.delay || 0}s`,
              maxWidth: `min(${widthConstraints.maxWidth}, 85vw)`,
              maxHeight: screenSize === "mobile" ? "70vh" : "60vh",
              touchAction: "manipulation",
            }}
            align="start"
            onEscapeKeyDown={() => setIsPopoverOpen(false)}
          >
            <Command shouldFilter={false}>
              {searchable && (
                <CommandInput
                  placeholder="Search features..."
                  onKeyDown={handleInputKeyDown}
                  value={searchValue}
                  onValueChange={setSearchValue}
                  aria-label="Search through available features"
                  aria-describedby={`${multiSelectId}-search-help`}
                />
              )}
              {searchable && (
                <div id={`${multiSelectId}-search-help`} className="tw:sr-only">
                  Type to filter features. Use arrow keys to navigate results.
                </div>
              )}
              <CommandList
                className={cn(
                  "tw:max-h-[40vh] tw:overflow-y-auto tw:multiselect-scrollbar",
                  screenSize === "mobile" && "tw:max-h-[50vh]",
                  "tw:overscroll-behavior-y-contain",
                )}
              >
                <CommandEmpty>
                  {emptyIndicator || "No results found."}
                </CommandEmpty>{" "}
                {!hideSelectAll && !searchValue && (
                  <CommandGroup>
                    <CommandItem
                      key="all"
                      onSelect={toggleAll}
                      role="option"
                      aria-selected={
                        selectedValues.length ===
                        getAllOptions().filter((opt) => !opt.disabled).length
                      }
                      aria-label={`Select all ${
                        getAllOptions().length
                      } options`}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "tw:mr-2 tw:flex tw:h-4 tw:w-4 tw:items-center tw:justify-center tw:rounded-sm tw:border tw:border-primary",
                          selectedValues.length ===
                            getAllOptions().filter((opt) => !opt.disabled)
                              .length
                            ? "tw:bg-primary tw:text-primary-foreground"
                            : "tw:opacity-50 tw:[&_svg]:invisible",
                        )}
                        aria-hidden="true"
                      >
                        <CheckIcon className="tw:h-4 tw:w-4" />
                      </div>
                      <span>
                        (Select All
                        {getAllOptions().length > 20
                          ? ` - ${getAllOptions().length} options`
                          : ""}
                        )
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}
                {isGroupedOptions(filteredOptions) ? (
                  filteredOptions.map((group) => (
                    <CommandGroup key={group.heading}>
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <div className="tw:flex tw:justify-between tw:items-center tw:px-2 tw:hover:bg-accent tw:hover:text-accent-foreground tw:dark:hover:bg-accent/50">
                            <span>{group.heading}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="tw:size-8 tw:bg-inherit tw:dark:bg-inherit"
                            >
                              <ChevronsUpDown />
                              <span className="tw:sr-only">Toggle</span>
                            </Button>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {group.options.map((option) => {
                            const isSelected = selectedValues.some(
                              (v) =>
                                v.value === option.value &&
                                group.heading === option.category,
                            );
                            return (
                              <CommandItem
                                key={option.value}
                                onSelect={async () =>
                                  await toggleOption(
                                    option.value,
                                    group.heading,
                                  )
                                }
                                role="option"
                                aria-selected={isSelected}
                                aria-disabled={option.disabled}
                                aria-label={`${option.label}${
                                  isSelected ? ", selected" : ", not selected"
                                }${option.disabled ? ", disabled" : ""}`}
                                className={cn(
                                  "tw:cursor-pointer",
                                  option.disabled &&
                                    "tw:opacity-50 tw:cursor-not-allowed",
                                )}
                                disabled={option.disabled}
                              >
                                <div
                                  className={cn(
                                    "tw:mr-2 tw:flex tw:h-4 tw:w-4 tw:items-center tw:justify-center tw:rounded-sm tw:border tw:border-primary",
                                    isSelected
                                      ? "tw:bg-primary tw:text-primary-foreground"
                                      : "tw:opacity-50 tw:[&_svg]:invisible",
                                  )}
                                  aria-hidden="true"
                                >
                                  <CheckIcon className="tw:h-4 tw:w-4" />
                                </div>
                                {option.icon && (
                                  <option.icon
                                    className="tw:mr-2 tw:h-4 tw:w-4 tw:text-muted-foreground"
                                    aria-hidden="true"
                                  />
                                )}
                                <span>{option.label}</span>
                              </CommandItem>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    </CommandGroup>
                  ))
                ) : (
                  <CommandGroup>
                    {filteredOptions.map((option) => {
                      const isSelected = selectedValues.includes(option.value);
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={async () =>
                            await toggleOption(option.value)
                          }
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={option.disabled}
                          aria-label={`${option.label}${
                            isSelected ? ", selected" : ", not selected"
                          }${option.disabled ? ", disabled" : ""}`}
                          className={cn(
                            "tw:cursor-pointer",
                            option.disabled &&
                              "tw:opacity-50 tw:cursor-not-allowed",
                          )}
                          disabled={option.disabled}
                        >
                          <div
                            className={cn(
                              "tw:mr-2 tw:flex tw:h-4 tw:w-4 tw:items-center tw:justify-center tw:rounded-sm tw:border tw:border-primary",
                              isSelected
                                ? "tw:bg-primary tw:text-primary-foreground"
                                : "tw:opacity-50 tw:[&_svg]:invisible",
                            )}
                            aria-hidden="true"
                          >
                            <CheckIcon className="tw:h-4 tw:w-4" />
                          </div>
                          {option.icon && (
                            <option.icon
                              className="tw:mr-2 tw:h-4 tw:w-4 tw:text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                          <span>{option.label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
                <CommandSeparator />
                <CommandGroup>
                  <div className="tw:flex tw:items-center tw:justify-between">
                    {selectedValues.length > 0 && (
                      <>
                        <CommandItem
                          onSelect={handleClear}
                          className="tw:flex-1 tw:justify-center tw:cursor-pointer"
                        >
                          Clear
                        </CommandItem>
                        <Separator
                          orientation="vertical"
                          className="tw:flex tw:min-h-6 tw:h-full"
                        />
                      </>
                    )}
                    <CommandItem
                      onSelect={() => setIsPopoverOpen(false)}
                      className="tw:flex-1 tw:justify-center tw:cursor-pointer tw:max-w-full"
                    >
                      Close
                    </CommandItem>
                  </div>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
          {animation > 0 && selectedValues.length > 0 && (
            <WandSparkles
              className={cn(
                "tw:cursor-pointer tw:my-2 tw:text-foreground tw:bg-background tw:w-3 tw:h-3",
                isAnimating ? "" : "tw:text-muted-foreground",
              )}
              onClick={() => setIsAnimating(!isAnimating)}
            />
          )}
        </Popover>
      </>
    );
  },
);

MultiSelect.displayName = "MultiSelect";
export type { MultiSelectOption, MultiSelectGroup, MultiSelectProps };
