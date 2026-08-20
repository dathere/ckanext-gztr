import type { Geoman } from "@geoman-io/maplibre-geoman-free";
import { produce } from "immer";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import type { StacCollection } from "stac-ts";
import { create } from "zustand";
import type { ItemCollection } from "@/App";

// IMPORTANT NOTE: When working with deeply nested objects for state, use immer
// See the following links for more info:
// - https://zustand.docs.pmnd.rs/learn/guides/updating-state#deeply-nested-object
// - https://dev.to/fazle-rabbi-dev/simplifying-state-management-with-zustand-updating-nested-objects-521g

interface FormMapState {
  formMap: RefObject<MapRef> | undefined;
  setFormMap: (formMap: RefObject<MapRef>) => void;
  viewState: object;
  setViewState: (viewState: any) => void;
  // GeoJSON for currentCategory, showing category map layer
  currentCollectionGeoJSON: any;
  setCurrentCollectionGeoJSON: (geojson: any) => void;
  // Statewide extent GeoJSON
  quickRegionGeoJSON: any;
  setQuickRegionGeoJSON: (quickRegionGeoJSON: any) => void;
  // spatial field used in ckanext-spatial for indexing (simplified GeoJSON)
  spatial: any;
  setSpatial: (spatial: any) => void;
  // spatialFull field used in ckanext-gztr for state management and properties (full GeoJSON)
  spatialFull: ItemCollection | undefined;
  setSpatialFull: (spatialFull: ItemCollection | undefined) => void;
  // tempSpatialFull field used in ckanext-gztr for temporary state management and properties within the modal
  tempSpatialFull: ItemCollection | undefined;
  setTempSpatialFull: (tempSpatialFull: ItemCollection | undefined) => void;
  stacCollections: StacCollection[] | undefined;
  setStacCollections: (stacCollections: StacCollection[] | undefined) => void;
  itemCollections: ItemCollection[] | undefined;
  setItemCollections: (itemCollections: ItemCollection[] | undefined) => void;
  currentStacCollection: StacCollection | undefined;
  setCurrentStacCollection: (
    currentStacCollection: StacCollection | undefined,
  ) => void;
  searchValue: string | undefined;
  setSearchValue: (searchValue: string) => void;
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
  currentCollectionGeoJSON: undefined,
  setCurrentCollectionGeoJSON: (currentCollectionGeoJSON) =>
    set(() => ({ currentCollectionGeoJSON })),
  quickRegionGeoJSON: undefined,
  setQuickRegionGeoJSON: (quickRegionGeoJSON) =>
    set(() => ({ quickRegionGeoJSON })),
  spatial: undefined,
  setSpatial: (spatial) =>
    set(
      produce((state) => {
        state.spatial = spatial;
      }),
    ),
  spatialFull: undefined,
  setSpatialFull: (spatialFull) =>
    set(
      produce((state) => {
        state.spatialFull = spatialFull;
      }),
    ),
  tempSpatialFull: undefined,
  setTempSpatialFull: (tempSpatialFull) =>
    set(
      produce((state) => {
        state.tempSpatialFull = tempSpatialFull;
      }),
    ),
  stacCollections: undefined,
  setStacCollections: (stacCollections) => set(() => ({ stacCollections })),
  itemCollections: undefined,
  setItemCollections: (itemCollections) =>
    set(() => {
      return { itemCollections };
    }),
  currentStacCollection: undefined,
  setCurrentStacCollection: (currentStacCollection) =>
    set(() => ({ currentStacCollection })),
  searchValue: undefined,
  setSearchValue: (searchValue) => set(() => ({ searchValue })),
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
