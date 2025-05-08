

ckan.module('gazetteer', function (jQuery, _) {
  const color = ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"];

  return {
    options: {
      placesData: window.__named_places, // This should be populated via CKAN template
      baseUrl: '/data' // Base URL for data files, set via CKAN template
    },
    initialize: function () {
      $.proxyAll(this, /_on/);

      this.drawButton = this.el.find('#filter-click');
      this.libraryButton = this.el.find('#library-filter-click');
      this.textarea = document.getElementById('field-spatial_full');
      this.textareaSimp = document.getElementById('field-spatial_simp');
      this.statewideSwitch = document.getElementById('statewide-switch');
      this.searchAddressBox = document.getElementById('search-address-box');
      this.searchAddressButton = document.getElementById('search-address-button');
      this.searchAddressClearButton = document.getElementById('search-address-clear-button');
      this.searchAddressClearButton.onclick = (e) => {
        e?.preventDefault();
        this.searchAddressBox.value = "";
        this.searchAddressButton.setAttribute("disabled", true)
        this.searchAddressClearButton.classList.add("d-none");
      }
      this.searchDropdown = document.getElementById("search-dropdown");
      this.searchResults = [];
      this.noResultsText = document.getElementById("no-results-text");
      this.full_data = [];
      if (this.textarea.value.length) {
        const geojsonData = JSON.parse(this.textarea.value);
        geojsonData.features.forEach((feature) => {
          this.changeFullData(true, feature.properties.type, feature.properties.name)
        });
        if (geojsonData.features.length === 1) {
          if (geojsonData.features[0].properties.type === "Statewide" && geojsonData.features[0].properties.name === "Texas") {
            this.statewideSwitch.click();
            this.drawButton.prop("disabled", true);
          }
        }
      }
      // Bind click events
      window.searchModalActive = false;
      this.drawButton.on('click', this._onDrawClick);
      this.libraryButton.on('click', this._onLibraryClick);

      this.cache = new Map();
      this.filter = [];
      this.subChoice = null;
      this.type = null;
      this.features = [];
      this.exampleMap = null;
      this.exampleMapDiv = document.getElementById('example-map');
      this.checkButtonText();

      this.updateKeywords = () => {
        try {
          this.sandbox.publish("update-place-keywords", this.full_data);
        } catch (e) {
          console.error("Error while attempting to publish filter change: " + String(e))
        }
      };

      this.removeFromFullData = (type, name) => {
        if (this.full_data)
          this.full_data = this.full_data.filter((f) => f[0] !== type ? true : f[1] !== name);
      };

      window.drawRemoveFromFullData = (type, name) => {
        if (this.full_data)
          this.full_data = this.full_data.filter((f) => f[0] !== type ? true : f[1] !== name);
      };

      window.updateLayer = () => {
        this.search.updateLayer();
      };

      window.removeLayer = (layer, type, name) => {
        this.search.layer.removeLayer(layer);
        const features = this.search.parent.features;
        for (const feature of features) {
          if (feature.feature.properties.name === name && feature.type === type) {
            feature.remove(this.search, true);
          }
        }
      };

      this.statewideSwitch.onclick = () => {
        // Enable statewide selection, clear all other layers
        if (this.statewideSwitch.checked) {
          const confirmed = confirm("Are you sure you want to select all of Texas for this dataset? WARNING: This will delete your current map selection if you have any.")
          if (!confirmed) {
            this.statewideSwitch.checked = false;
            return;
          }
          this.exampleMap?.eachLayer((layer) => this.exampleMap.removeLayer(layer));
          this.removeExampleMap();
          this.drawButton.prop("disabled", true);
          this.filter = [["Statewide", "Texas"]];
          this.full_data = [];
          this.type = "Statewide";
          this.changeFullData(true, "Statewide", "Texas");
          this.getData("Statewide").then(data => {
            this.cache.set("Statewide", data);
            const feature = this.cache.get("Statewide").features.find(item => item.properties.name === "Texas");
            this.textarea.value = JSON.stringify({ features: [feature], type: 'FeatureCollection' });
            this.textareaSimp.value = simplifyGeojson(this.textarea.value);
            this.initExampleMap();
            if (this.search) {
              for (const item of this.search.parent.features) {
                item.remove(this.search);
              }
            }
          });
        } else {
          this.drawButton.prop("disabled", false);
          this.filter = [];
          this.type = null;
          this.changeFullData(false, "Statewide", "Texas");
          if (this.search) {
            for (const item of this.search.parent.features) {
              item.remove(this.search);
            }
          }
          this.removeExampleMap();
          this.textarea.value = "";
          this.textareaSimp.value = "";
          this.initExampleMap();
        }
        this.updateKeywords();
        if (this.exampleMap)
          this.exampleMap.fitBounds([[25.840437651866516, -106.64719063660635], [36.50050935248352, -93.5175532104321]])
      }

      // Search address feature
      // Disable default enter key behavior when pressing enter in the searchbox
      this.searchAddressBox.onkeydown = (e) => {
        this.noResultsText.classList.add("d-none");
        this.searchAddressClearButton.classList.remove("d-none");
        this.searchDropdown.classList.add("d-none");
        if (e.key === "Enter" && (!this.searchAddressButton.getAttribute("disabled") || this.searchAddressButton.getAttribute("disabled") === "false")) {
          e?.preventDefault();
        }
      }
      this.searchAddressBox.onkeyup = (e) => {
        e?.preventDefault();
        // When there is a value in the searchbox, enable the search button
        if (this.searchAddressBox.value) {
          this.searchAddressButton.removeAttribute("disabled")
        }
        // When the searchbox is empty, disable the search button
        else {
          this.searchAddressButton.setAttribute("disabled", true)
        }
        // If the user presses the Enter key in the searchbox and the search button is not disabled, run the search
        if (e.key === "Enter" && (!this.searchAddressButton.getAttribute("disabled") || this.searchAddressButton.getAttribute("disabled") === "false")) {
          this.searchAddressButton.click();
        }
      }
      // If the search button is clicked, disable the search button and run the search
      this.searchAddressButton.onclick = (e) => {
        e?.preventDefault();
        this.searchAddressButton.setAttribute("disabled", true);
        this.runAddressSearch(this.searchAddressBox.value);
      }
      // this.initializeGeoJSON();
      // this.setupSelectors();
    },
    async runAddressSearch(search_query) {
      this.searchAddressButton.innerText = "Searching...";
      const nominatimEndpoint = `https://nominatim.openstreetmap.org/search?addressdetails=1&q=${search_query}&format=jsonv2&limit=10`;
      fetch(nominatimEndpoint, {
        headers: {
          "User-Agent": "CKAN instance using ckanext-gztr"
        },
        signal: AbortSignal.timeout(5000)
      }).then((res) => res.json().then((data) => {
        if (data && data.length > 1) {
          // this.searchResults = data.map((entry) => { return { "display_name": entry.display_name, "boundingbox": entry.boundingbox, "lat": entry.lat, "lon": entry.lon }; })
          this.searchResults = data.map((entry) => { return { "display_name": entry.display_name, "boundingbox": entry.boundingbox }; })
          // Jump to first result.
          const firstBoundingBox = this.searchResults[0]["boundingbox"];
          this.search.map.fitBounds([[firstBoundingBox[0], firstBoundingBox[2]], [firstBoundingBox[1], firstBoundingBox[3]]]);
          const searchDropdownList = document.getElementById("search-dropdown-list");
          // Remove previous search results
          while (searchDropdownList.hasChildNodes()) {
            searchDropdownList.removeChild(searchDropdownList.firstChild)
          }
          // Add search results to the dropdown
          for (const entry of this.searchResults) {
            const entryLi = document.createElement("li");
            const entryButton = document.createElement("button");
            entryButton.classList.add("dropdown-item");
            entryButton.type = "button";
            // entryButton.innerText = `${entry["display_name"]} | (${entry["lat"]}, ${entry["lon"]})`;
            entryButton.innerText = entry["display_name"];
            entryButton.onclick = () => {
              const boundingbox = entry["boundingbox"];
              this.search.map.fitBounds([[boundingbox[0], boundingbox[2]], [boundingbox[1], boundingbox[3]]]);
            }
            entryLi.appendChild(entryButton);
            searchDropdownList.appendChild(entryLi);
          };
          this.searchDropdown.classList.remove("d-none");
        }
        else if (data && data.length > 0) {
          const boundingBox = data[0]["boundingbox"];
          this.search.map.fitBounds([[boundingBox[0], boundingBox[2]], [boundingBox[1], boundingBox[3]]]);
        } else {
          this.noResultsText.classList.remove("d-none");
        }
      })).finally(() => {
        this.searchAddressButton.removeAttribute("disabled")
        this.searchAddressButton.innerText = "Search address";
      });
    },
    changeFullData(isAdd, type, name) {
      if (isAdd) {
        // If the selected feature is not in this.full_data, push its type and name to this.full_data
        if (!(this.full_data.filter((f) => f[0] === type && f[1] === name).length > 0))
          this.full_data.push([type, name]);
      }
      else {
        // If the selected feature is not in this.full_data, push its type and name to this.full_data
        if ((this.full_data.filter((f) => f[0] === type && f[1] === name).length > 0)) {
          this.full_data = this.full_data.filter((f) => f[0] !== type ? true : f[1] !== name);
        }
      }
    },
    checkButtonText() {
      const drawButton = document.getElementById('filter-click');
      this.initExampleMap();
      if (this.textarea.value?.length) {
        drawButton.innerHTML = 'Edit Location Data'
      } else {
        drawButton.innerHTML = 'Add Location Data'
      }
    },
    _onDrawClick: function (e) {
      e.preventDefault();
      try {
        this.removeExampleMap();
        window.searchModalActive = true;
        this.search = new window.SearchModal(this.textarea, (isCancel) => this.onClose(isCancel), this);
        this.initializeGeoJSON();
        this.setupSelectors();
        this.search.setupButtons();
      } catch (error) {
        window.searchModalActive = false;
        console.error('Failed to initialize SearchModal:', error);
      }
    },
    getData: async function (value) {
      const url = this.sandbox.client.url(
        this.options.baseUrl + '/' + this.options.placesData[value]
      );
      const response = await fetch(url);
      const json = await response.json();
      return topojson.feature(json, this.options.placesData[value].slice(0, -5));
    },
    onClose(isCancel) {
      window.searchModalActive = false;
      this.type = null;
      this.selectorContainer.empty();
      this.select = null;
      this.subChoice.empty();
      this.subChoice = null;
      this.geojson.remove();
      this.geojson = null;
      if (this.textarea.value?.length) {
        try {
          this.textareaSimp.value = simplifyGeojson(this.textarea.value)
        } catch (e) {
          this.textarea.value = '';
          this.textareaSimp.value = '';
        }
      }
      document.getElementById('search-address-box').value = "";
      document.getElementById('search-address-button').setAttribute("disabled", true);
      document.getElementById('search-address-clear-button').classList.add("d-none");
      document.getElementById('search-address-clear-button').classList.add("d-none");
      document.getElementById('search-dropdown').classList.add("d-none");
      this.checkButtonText();
      if (!isCancel)
        this.updateKeywords();
    },
    initExampleMap() {
      try {
        this.exampleMapDiv.classList.add('active-example-map');
        this.baselayers = {
          "<span class=\"fs-2\">OSM</span>": L$1.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
          }),
          "<span class=\"fs-2\">Street</span>": L$1.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.png", {
            maxZoom: 19,
            // https://www.arcgis.com/home/item.html?id=3b93337983e9436f8db950e38a8629af
            attribution: "Tiles © Esri — Sources: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCAN, Esri Japan, METI, Esri China (Hong Kong), NOSTRA, © OpenStreetMap contributors, and the GIS User Community"
          }),
          "<span class=\"fs-2\">Photo</span>": L$1.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png", {
            maxZoom: 19,
            // https://doc.arcgis.com/en/data-appliance/2022/maps/world-imagery.htm
            attribution: "Tiles © Esri — Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
          })
        };
        this.exampleMap = L$1.map('example-map', {
          minZoom: 4,
          layers: [Object.values(this.baselayers).at(0)]
        }).setView([31, -99], 7);
        // Home button
        initEasyButton(L$1);
        const homeButton = L$1.easyButton({
          states: [{
            stateName: 'zoom-to-home',
            icon: 'fa-home',
            title: 'Reset to initial view',
            onClick: function (btn, map) {
              map.fitBounds([[25.840437651866516, -106.64719063660635], [36.50050935248352, -93.5175532104321]])
            }
          }]
        });
        homeButton.addTo(this.exampleMap);
        this.overlays = {};
        if (this.textarea.value?.length) {
          const layer = L$1.geoJSON();
          layer.addTo(this.exampleMap);
          layer.addData(JSON.parse(this.textarea.value));
          this.exampleMap.fitBounds(layer.getBounds());
        } else {
          this.exampleMap.fitBounds([[25.840437651866516, -106.64719063660635], [36.50050935248352, -93.5175532104321]])
        }

      } catch (e) {
        this.exampleMap?.remove();
        this.exampleMap = null;
        this.exampleMapDiv?.classList?.remove('active-example-map');
      }
    },
    removeExampleMap() {
      this.exampleMap?.remove();
      this.exampleMap = null;
    },
    initializeGeoJSON: function () {
      if (this.geojson) {
        return;
      }
      this.geojson = L.geoJSON({ features: [], type: 'FeatureCollection' }, {
        style: function (feature, i) {
          const colorIndex = feature.properties.id % 8;
          return {
            fillColor: color[colorIndex],
            color: color[colorIndex]
          };
        }
      }).bindPopup((e) => {
        const container = jQuery('<ul>', { class: "fs-3" });

        container.append(
          jQuery('<li>', { class: 'list-member' })
            .text(`Type: ${this.type}`)
        );

        container.append(
          jQuery('<li>', { class: 'list-member' })
            .text(`Name: ${e.feature.properties.name}`)
        );

        const buttonContainer = jQuery('<li>', { class: 'list-member' });
        const button = jQuery('<button>', {
          class: 'list-button',
          text: 'Select this feature',
          click: (_e) => {
            _e.preventDefault();
            this.filter.push(e.feature.properties.name);
            // If the selected feature is not in this.full_data, push its type and name to this.full_data
            if (!(this.full_data.filter((f) => f[0] === this.type && f[1] === e.feature.properties.name).length > 0))
              this.full_data.push([this.type, e.feature.properties.name]);
            this.setValue();
            // try {
            //   this.sandbox.publish("update-place-keywords", this.full_data);
            // } catch (e) {
            //   console.error("Error while attempting to publish filter change: " + String(e))
            // }
          }
        });

        buttonContainer.append(button);
        container.append(buttonContainer);

        return container[0];
      });

      this.geojson.addTo(this.search.map);
    },
    // <span id="named-place-selector"></span>
    //<span id="sub-choice"></span>

    setupSelectors: function () {
      if (this.select) {
        return;
      }
      const selectorContainer = jQuery('#named-place-selector');
      this.selectorContainer = selectorContainer;
      this.select = jQuery('<select>', { class: 'selector mw-100' })
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
      this.filter = [];
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
      const select = jQuery('<select>', {
        multiple: true, id: 'sub-selector',
        class: 'selectpicker',

      })
      // .append(jQuery('<option>', {
      //   value: '',
      //   text: 'Select Sub Option',
      //   selected: true
      // }));

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
      $('#sub-selector').selectpicker({
        liveSearch: true,
        placeholder: 'Select a feature'
      });

      select.on('change', (e) => this.onChange(e));

      const that = this;

      $('#sub-selector').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
        const currentValue = that.cache.get(that.type).features[clickedIndex].properties.name;
        // if (!isSelected && that.full_data.map((f) => f[1]).includes(currentValue)) {
        //   that.full_data = that.full_data.filter((f) => f[1] !== currentValue);
        // }
        if (isSelected && !that.full_data.map((f) => f[1]).includes(currentValue)) {
          that.full_data.push([that.type, currentValue]);
        }
      });
    },

    onChange: function (e) {
      this.geojson.clearLayers();
      this.filter = this.full_data.filter((f) => f[0] === this.type).map((f) => f[1]) || $('#sub-selector').val() || [];
      this.geojson.addData(this.cache.get(this.type));
      this.setValue();
      this.search.map.fitBounds(this.geojson.getBounds());
    },
    setValue: function () {
      const features = this.cache.get(this.type).features
        .filter(item => this.full_data.filter((f) => f[0] === this.type).map((f) => f[1]).indexOf(item.properties.name) > -1);
      let first = true;
      for (const feature of features) {
        if (first) {
          this.search.addFeature(feature, this.type, true, this.removeFromFullData);
          first = false;
        } else {
          this.search.addFeature(feature, this.type, false, this.removeFromFullData);
        }
      }
      // if (feature) {
      //   this.textarea.value = JSON.stringify(feature.geometry);
      //   jQuery(this.textarea).trigger('change');
      // }
    },
    // _onLibraryClick: function (e) {
    //   e.preventDefault();
    //   console.log('Library button clicked');
    //   if (typeof module.NamedModal !== 'function') {
    //     console.error('NamedModal is not loaded');
    //     return;
    //   }

    //   try {
    //     let t = new module.NamedModal(this.textarea);
    //     console.log(t);

    //   } catch (error) {
    //     console.error('Failed to initialize NamedModal:', error);
    //   }
    // },
  };
});