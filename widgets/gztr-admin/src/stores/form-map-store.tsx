import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { create } from "zustand";
import type { FeatureCategory } from "@/components/category-combobox";
import type {
  MultiSelectGroup,
  MultiSelectOption,
} from "@/components/multi-select";

interface FormMapState {
  formMap: RefObject<MapRef> | undefined;
  setFormMap: (formMap: RefObject<MapRef>) => void;
  viewState: object;
  setViewState: (viewState: any) => void;
  // GeoJSON for currentCategory, showing category map layer
  geojson: any;
  setGeojson: (geojson: any) => void;
  // spatial field used in ckanext-spatial for indexing
  spatial: any;
  setSpatial: (spatial: any) => void;
  currentCategory: FeatureCategory | undefined;
  setCurrentCategory: (currentCategory: FeatureCategory) => void;
  searchValue: string | undefined;
  setSearchValue: (searchValue: string) => void;
  // TODO: improve features state to allow for flyTo, pop-up data, category, etc.
  features: MultiSelectOption[] | MultiSelectGroup[];
  setFeatures: (features: MultiSelectOption[] | MultiSelectGroup[]) => void;
  selectedFeatures: MultiSelectOption[] | MultiSelectGroup[];
  setSelectedFeatures: (
    selectedFeatures: MultiSelectOption[] | MultiSelectGroup[],
  ) => void;
}

export const useFormMap = create<FormMapState>((set) => ({
  formMap: undefined,
  setFormMap: (formMap) => set(() => ({ formMap })),
  viewState: {
    latitude: 34.307144,
    longitude: -106.018066,
    zoom: 5,
  },
  setViewState: (viewState) => set(() => ({ viewState })),
  geojson: undefined,
  setGeojson: (geojson) => set(() => ({ geojson })),
  spatial: undefined,
  setSpatial: (spatial) => set(() => ({ spatial })),
  currentCategory: undefined,
  setCurrentCategory: (currentCategory) => set(() => ({ currentCategory })),
  searchValue: undefined,
  setSearchValue: (searchValue) => set(() => ({ searchValue })),
  features: [],
  setFeatures: (features) => set(() => ({ features })),
  selectedFeatures: [],
  setSelectedFeatures: (selectedFeatures) => set(() => ({ selectedFeatures })),
}));
