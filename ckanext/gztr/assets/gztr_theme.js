/*

  CKAN GZTR Extension JavaScript
  gztr_theme.js

*/

const createMapImage = async () => {
  const width = 125;
  const height = 125;
  const datasetMaps = document.querySelectorAll(".dataset-item-map");

  for (const mapElement of datasetMaps) {
    const spatialSimp = JSON.parse(mapElement.getAttribute("data-package"));

    mapElement.style.width = `${width}px`;
    mapElement.style.height = `${height}px`;

    const map = L.map(mapElement, {
      attributionControl: false,
      zoomControl: false,
    });

    const tileLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    ).addTo(map);

    const geoJSONLayer = L.geoJSON(spatialSimp).addTo(map);

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