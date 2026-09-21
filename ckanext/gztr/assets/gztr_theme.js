/*

  CKAN GZTR Extension JavaScript
  gztr_theme.js

*/

const createMapImage = async () => {
  const width = 125;
  const height = 125;
  // Skip maps already rendered, since this also runs after htmx swaps in new search results
  const datasetMaps = document.querySelectorAll(".dataset-item-map:not([data-gztr-rendered])");
  // CKAN 2.10+ rejects cookie-authenticated API POSTs (logged-in users) without a CSRF token
  const csrf_token = document.querySelector("meta[name='_csrf_token']")?.getAttribute("content");

  for (const [index, mapElement] of datasetMaps.entries()) {
    mapElement.setAttribute("data-gztr-rendered", "");
    // One failing dataset must not stop the remaining thumbnails from rendering
    try {
      const spatialFull = mapElement.getAttribute("data-package");
      const headers = { "Content-Type": "application/json" };
      if (csrf_token) headers["X-CSRFToken"] = csrf_token;
      const response = await fetch(`/api/3/action/gztr_spatial_full_with_geometry`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          "spatial_full": spatialFull
        })
      });
      if (!response.ok) throw new Error(`gztr_spatial_full_with_geometry returned HTTP ${response.status}`);
      const spatialFullWithGeometry = (await response.json()).result;
      if (!spatialFullWithGeometry) throw new Error("gztr_spatial_full_with_geometry returned no result");

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

      const geoJSONLayer = L.geoJSON(JSON.parse(spatialFullWithGeometry)).addTo(map);
      const bounds = geoJSONLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds);
      } else {
        map.setView([0, 0], 0);
      }
    } catch (error) {
      console.error("ckanext-gztr: could not render dataset map thumbnail", error);
    }

    // await new Promise(resolve => tileLayer.on("load", () => resolve()));
    // const dataURL = await domtoimage.toPng(mapElement, { width, height });
    // const parent = mapElement.parentElement;
    // parent.removeChild(mapElement);

    // const imgElement = document.createElement("img");
    // imgElement.src = dataURL;
    // parent.appendChild(imgElement);
  }
};

createMapImage();
// CKAN 2.11+ swaps search results in place with htmx (facets, sorting, pagination)
document.body.addEventListener("htmx:afterSettle", createMapImage);
