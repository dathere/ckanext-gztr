/*

  CKAN GZTR Extension JavaScript
  gztr_theme.js

*/

const createMapImage = async () => {
  const width = 125;
  const height = 125;
  const datasetMaps = document.querySelectorAll(".dataset-item-map");

  for (const [index, mapElement] of datasetMaps.entries()) {
    const spatialFull = mapElement.getAttribute("data-package");
    const spatialFullWithGeometry = (await (await fetch(`/api/3/action/gztr_spatial_full_with_geometry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "spatial_full": spatialFull
      })
    })).json()).result;

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

    map.fitBounds(geoJSONLayer.getBounds());

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