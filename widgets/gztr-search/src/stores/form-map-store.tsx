import type { Geoman } from "@geoman-io/maplibre-geoman-free";
import type { Map as GLMap } from "maplibre-gl";
import { create } from "zustand";
import type { StacCollection } from "stac-ts";

interface FormMapState {
  searchMap: GLMap | undefined;
  setSearchMap: (searchMap: GLMap) => void;
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
  collections: StacCollection[] | undefined;
  setCollections: (categories: StacCollection[] | undefined) => void;
  currentCollection: StacCollection | undefined;
  setCurrentCollection: (currentCollection: StacCollection | undefined) => void;
  searchValue: string | undefined;
  setSearchValue: (searchValue: string) => void;
  statewideEnabled: boolean;
  setStatewideEnabled: (statewideEnabled: boolean) => void;
  addressSearchResults: any[];
  setAddressSearchResults: (addressSearchResults: any[]) => void;
  searchResultMarkerLngLat: any;
  setSearchResultMarkerLngLat: (searchResultMarkerLngLat: any) => void;
  gm: Geoman | undefined;
  setGm: (gm: Geoman) => void;
  disableApplyButton: boolean;
  setDisableApplyButton: (disableApplyButton: boolean) => void;
}

export const useFormMap = create<FormMapState>((set) => ({
  searchMap: undefined,
  setSearchMap: (searchMap) => set(() => ({ searchMap })),
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
  collections: undefined,
  setCollections: (collections) => set(() => ({ collections })),
  currentCollection: undefined,
  setCurrentCollection: (currentCollection) => set(() => ({ currentCollection })),
  searchValue: undefined,
  setSearchValue: (searchValue) => set(() => ({ searchValue })),
  features: [],
  statewideEnabled: false,
  setStatewideEnabled: (statewideEnabled) => set(() => ({ statewideEnabled })),
  addressSearchResults: [],
  setAddressSearchResults: (addressSearchResults) =>
    set(() => ({ addressSearchResults })),
  searchResultMarkerLngLat: undefined,
  setSearchResultMarkerLngLat: (searchResultMarkerLngLat) =>
    set({ searchResultMarkerLngLat }),
  gm: undefined,
  setGm: (gm) => set({ gm }),
  disableApplyButton: false,
  setDisableApplyButton: (disableApplyButton) => set({ disableApplyButton }),
}));
