import type { Geoman } from "@geoman-io/maplibre-geoman-free";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { create } from "zustand";
import type { FeatureCategory } from "@/components/category-combobox";
import type {
  MultiSelectGroup,
  MultiSelectOption,
  MultiSelectRef,
} from "@/components/multi-select";

interface FormMapState {
  formMap: RefObject<MapRef> | undefined;
  setFormMap: (formMap: RefObject<MapRef>) => void;
  viewState: object;
  setViewState: (viewState: any) => void;
  // GeoJSON for currentCategory, showing category map layer
  geojson: any;
  setGeojson: (geojson: any) => void;
  // Statewide extent GeoJSON
  stateGeojson: any;
  setStateGeojson: (stateGeojson: any) => void;
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
  features: MultiSelectOption[] | MultiSelectGroup[];
  setFeatures: (features: MultiSelectOption[] | MultiSelectGroup[]) => void;
  selectedFeatures: MultiSelectOption[] | MultiSelectGroup[];
  setSelectedFeatures: (
    selectedFeatures: MultiSelectOption[] | MultiSelectGroup[],
  ) => void;
  multiSelectRef: RefObject<MultiSelectRef | undefined> | undefined;
  setMultiSelectRef: (
    multiSelectRef: RefObject<MultiSelectRef | undefined>,
  ) => void;
  statewideEnabled: boolean;
  setStatewideEnabled: (statewideEnabled: boolean) => void;
  addressSearchResults: any[];
  setAddressSearchResults: (addressSearchResults: any[]) => void;
  gm: Geoman | undefined;
  setGm: (gm: Geoman) => void;
  disableApplyButton: boolean;
  setDisableApplyButton: (disableApplyButton: boolean) => void;
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
  stateGeojson: undefined,
  setStateGeojson: (stateGeojson) => set(() => ({ stateGeojson })),
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
  multiSelectRef: undefined,
  setMultiSelectRef: (multiSelectRef) => set(() => ({ multiSelectRef })),
  statewideEnabled: false,
  setStatewideEnabled: (statewideEnabled) => set(() => ({ statewideEnabled })),
  addressSearchResults: [],
  setAddressSearchResults: (addressSearchResults) =>
    set(() => ({ addressSearchResults })),
  gm: undefined,
  setGm: (gm) => set({ gm }),
  disableApplyButton: false,
  setDisableApplyButton: (disableApplyButton) => set({ disableApplyButton }),
}));
