// named-places.js
ckan.module('named_places_client', function (jQuery) {
  const color = ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"];

  return {
    options: {
      placesData: window.__named_places, // This should be populated via CKAN template
      baseUrl: '/data' // Base URL for data files, set via CKAN template
    },

    initialize: function (map, textarea) {
      this.map = map;
      this.textarea = textarea;
      this.cache = new Map();
      this.filter = false;
      this.subChoice = null;
      this.type = null;

      this.initializeGeoJSON();
      this.setupSelectors();
      return this;
    },

    getData: async function (value) {
      const url = this.sandbox.client.url(
        this.options.baseUrl + '/' + this.options.placesData[value]
      );
      const response = await fetch(url);
      const json = await response.json();
      return topojson.feature(json, this.options.placesData[value].slice(0, -5));
    },

    initializeGeoJSON: function () {
      this.geojson = L.geoJSON({ features: [], type: 'FeatureCollection' }, {
        style: function (feature) {
          const colorIndex = feature.properties.OBJECTID % 8;
          return {
            fillColor: color[colorIndex],
            color: color[colorIndex]
          };
        },
        filter: (feature) => {
          if (!this.filter) {
            return true;
          }
          return feature.properties.name === this.filter;
        }
      }).bindPopup((e) => {
        const container = jQuery('<ul>');

        container.append(
          jQuery('<li>', { class: 'list-member' })
            .text(`type: ${this.type}`)
        );

        container.append(
          jQuery('<li>', { class: 'list-member' })
            .text(`name: ${e.feature.properties.name}`)
        );

        const buttonContainer = jQuery('<li>', { class: 'list-member' });
        const button = jQuery('<button>', {
          class: 'list-button',
          text: 'select this feature',
          click: () => {
            this.filter = e.feature.properties.name;
            this.setValue();
          }
        });

        buttonContainer.append(button);
        container.append(buttonContainer);

        return container[0];
      });

      this.geojson.addTo(this.map);
    },

    setupSelectors: function () {
      const selectorContainer = jQuery('#named-place-selector');
      this.select = jQuery('<select>', { class: 'selector' })
        .append(jQuery('<option>', { text: 'Choose Named Place' }));

      jQuery.each(this.options.placesData, (name) => {
        this.select.append(jQuery('<option>', {
          value: name,
          text: name
        }));
      });

      this.select.on('change', (e) => this.change(e));
      selectorContainer.append(this.select);

      this.subChoice = jQuery('#sub-choice');
    },

    change: function (e) {
      const value = e.target.value;
      this.type = value;
      this.geojson.clearLayers();
      this.filter = false;
      this.clearChoice();

      if (!value) {
        return;
      }

      if (this.cache.has(value)) {
        this.setupLayer(this.cache.get(value));
        return;
      }

      this.getData(value)
        .then(data => {
          this.cache.set(value, data);
          this.setupLayer(data);
        })
        .catch(err => {
          this.sandbox.notify('Error', 'Failed to load geographic data', 'error');
        });
    },

    setupLayer: function (data) {
      this.geojson.addData(data);
      this.setupSelect(data);
    },

    clearChoice: function () {
      this.subChoice.empty();
    },

    setupSelect: function (data) {
      const select = jQuery('<select>', { id: 'sub-selector' })
        .append(jQuery('<option>', {
          value: '',
          text: 'Select Option',
          selected: true
        }));

      data.features.forEach(feature => {
        const name = feature?.properties?.name;
        if (name) {
          select.append(jQuery('<option>', {
            value: name,
            text: name
          }));
        }
      });

      this.subChoice.empty().append(select);
      select.on('change', (e) => this.onChange(e));
    },

    onChange: function (e) {
      this.geojson.clearLayers();
      this.filter = e.target.value;
      this.geojson.addData(this.cache.get(this.type));
      this.map.flyToBounds(this.geojson.getBounds());
      this.setValue();
    },

    setValue: function () {
      const feature = this.cache.get(this.type).features
        .find(item => item.properties.name === this.filter);

      if (feature) {
        this.textarea.value = JSON.stringify(feature.geometry);
        jQuery(this.textarea).trigger('change');
      }
    }
  };
});