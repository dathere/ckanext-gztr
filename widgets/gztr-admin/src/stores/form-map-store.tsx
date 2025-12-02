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
  // spatial field used in ckanext-spatial for indexing (simplified GeoJSON)
  spatial: any;
  setSpatial: (spatial: any) => void;
  // spatialFull field used in ckanext-gztr for state management and properties (full GeoJSON)
  spatialFull: any;
  setSpatialFull: (spatialFull: any) => void;
  // tempSpatialFull field used in ckanext-gztr for temporary state management and properties within the modal
  tempSpatialFull: any;
  setTempSpatialFull: (tempSpatialFull: any) => void;
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
  spatialFull: undefined,
  setSpatialFull: (spatialFull) => set(() => ({ spatialFull })),
  tempSpatialFull: undefined,
  setTempSpatialFull: (tempSpatialFull) => set(() => ({ tempSpatialFull })),
  currentCategory: undefined,
  setCurrentCategory: (currentCategory) => set(() => ({ currentCategory })),
  searchValue: undefined,
  setSearchValue: (searchValue) => set(() => ({ searchValue })),
  features: [],
  setFeatures: (features) => set(() => ({ features })),
  selectedFeatures: [],
  setSelectedFeatures: (selectedFeatures) => set(() => ({ selectedFeatures })),
}));
