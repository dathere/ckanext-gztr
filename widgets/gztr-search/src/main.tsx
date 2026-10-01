import { layers, namedFlavor } from "@protomaps/basemaps";
import { bbox } from "@turf/turf";
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import GLMap, { Layer, Source } from "react-map-gl/maplibre";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import App from "./App.tsx";

const publicSearchGazetteerRoot = document.getElementById(
  "public-search-gazetteer-root",
);
const datasetMinimaps = document.querySelectorAll(".dataset-item-map");
const csrf_token = document
  .querySelector("meta[name='_csrf_token']")
  ?.getAttribute("content");

if (publicSearchGazetteerRoot) {
  const config = publicSearchGazetteerRoot.getAttribute("data-config");
  const publicSearchGazetteerConfig = config
    ? JSON.parse(config)["public_search_gazetteer"]
    : {};
  createRoot(publicSearchGazetteerRoot).render(
    <StrictMode>
      <TooltipProvider>
        <App config={publicSearchGazetteerConfig} />
      </TooltipProvider>
    </StrictMode>,
  );
}

if (datasetMinimaps.length > 0 && csrf_token) {
  (async () => {
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    for (const [minimapIndex, minimapElement] of datasetMinimaps.entries()) {
      const dataConfig = minimapElement.getAttribute("data-config");
      const config = dataConfig
        ? JSON.parse(dataConfig)["public_search_minimap"]
        : {};
      const spatialFull = minimapElement.getAttribute("data-package");
      const spatialFullWithGeometry = (
        await (
          await fetch(`/api/3/action/gztr_spatial_full_with_geometry`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrf_token,
            },
            body: JSON.stringify({
              spatial_full: spatialFull,
            }),
          })
        ).json()
      ).result;
      const spatialFullAsGeoJSON = JSON.parse(spatialFullWithGeometry);
      const bounds = bbox(spatialFullAsGeoJSON);
      // Set up basemap for minimap background. If not provided then the polygon alone should be displayed.
      const tiles_url =
        config["ckanext.gztr.public_search_minimap.tiles_url"] ?? undefined;
      const tiles_type =
        config["ckanext.gztr.public_search_minimap.tiles_type"] ?? "vector";
      const sourceConfig: any =
        tiles_type === "vector"
          ? {
              type: tiles_type,
              url: tiles_url,
            }
          : {
              type: tiles_type,
              tiles: [tiles_url],
              tileSize: 256,
            };
      const attributionHTML =
        config["ckanext.gztr.public_search_minimap.attribution_html"];
      if (attributionHTML) {
        sourceConfig.attribution = attributionHTML;
      }
      let mapStyleLayers: any;
      const isPmtiles = tiles_url?.startsWith("pmtiles://");
      if (tiles_type === "vector" && isPmtiles) {
        mapStyleLayers = layers("protomaps", namedFlavor("light"));
      }
      if (tiles_type === "raster") {
        mapStyleLayers = [
          {
            id: "minimap_layer",
            type: "raster",
            source: "minimap_source",
            maxzoom:
              config["ckanext.gztr.public_search_minimap.max_zoom"] ?? 10,
          },
        ];
      }
      let mapStyle = tiles_url;
      if (tiles_type === "raster" || isPmtiles) {
        mapStyle = {
          version: 8,
          sources: {
            minimap_source: sourceConfig,
          },
          layers: mapStyleLayers,
        };
      }
      createRoot(minimapElement).render(
        <StrictMode>
          <GLMap
            // @ts-expect-error
            initialViewState={{ bounds }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={mapStyle}
            maxBounds={
              config["ckanext.gztr.public_search_minimap.max_bounds"]?.split(
                " ",
              ) ?? [-134.428711, 14.349548, -61.611328, 52.536273]
            }
            // TODO: Based on page, if dataset landing page then must have otherwise only on first element.
            attributionControl={
              minimapIndex === 0
                ? {
                    customAttribution:
                      config[
                        "ckanext.gztr.public_search_minimap.attribution_html"
                      ] ?? undefined,
                  }
                : false
            }
          >
            {spatialFullAsGeoJSON && (
              <Source type="geojson" data={spatialFullAsGeoJSON}>
                <Layer
                  type="fill"
                  paint={{ "fill-color": "rgba(102, 170, 238, 0.5)" }}
                />
                <Layer
                  type="line"
                  paint={{
                    "line-color": "rgba(80, 120, 255, 1)",
                    "line-width": 1,
                  }}
                />
              </Source>
            )}
          </GLMap>
        </StrictMode>,
      );
    }
  })();
}
