/*

  CKAN GZTR Extension JavaScript
  gztr_theme.js

*/

// Fallback view for a dataset whose features carry no usable geometry, so the card still
// shows a map instead of an empty box. Matches the ckanext.gztr.default_* config defaults.
const FALLBACK_CENTER = [34.0, -106.018066];
const FALLBACK_ZOOM = 5;

const buildDatasetMap = async (mapElement, index) => {
  const width = 125;
  const height = 125;

  const spatialFull = mapElement.getAttribute("data-package");
  const response = await fetch("/api/3/action/gztr_spatial_full_with_geometry", {
    method: "POST",
    body: JSON.stringify({ "spatial_full": JSON.parse(spatialFull) }),
    headers: {
      "Content-Type": "application/json"
    }
  });
  const spatialFullWithGeometry = (await response.json()).result;

  mapElement.style.width = `${width}px`;
  mapElement.style.height = `${height}px`;

  const map = L.map(mapElement, {
    zoomControl: false,
  });

  map.attributionControl.setPrefix(false);

  if (index === 0) {
    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
    }).addTo(map)
  } else {
    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    }).addTo(map)
  }

  // gztr_spatial_full_with_geometry returns null when it raises, and returns features with a
  // null geometry when it cannot resolve one from STAC (datasets saved by older versions of
  // the gazetteer store a shape it does not recognise). Either way L.geoJSON yields an empty
  // layer whose getBounds() is invalid, and fitBounds throws "Bounds are not valid."
  const geoJSONLayer = L.geoJSON(JSON.parse(spatialFullWithGeometry || "null")).addTo(map);
  const bounds = geoJSONLayer.getBounds();

  if (bounds.isValid()) {
    map.fitBounds(bounds);
  } else {
    map.setView(FALLBACK_CENTER, FALLBACK_ZOOM);
  }

  // The container is a flex item that starts at zero width, so Leaflet caches a zero size at
  // init and renders nothing until it re-measures.
  map.invalidateSize();
};

const createMapImage = async () => {
  const datasetMaps = document.querySelectorAll(".dataset-item-map");

  for (const [index, mapElement] of datasetMaps.entries()) {
    // Per-card isolation: this loop used to be a single unguarded sequence, so one dataset
    // whose geometry could not be resolved threw and left every remaining card blank.
    try {
      await buildDatasetMap(mapElement, index);
    } catch (error) {
      console.warn("ckanext-gztr: could not render dataset map thumbnail", error);
    }
  }
};

createMapImage();
