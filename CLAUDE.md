# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ckanext-gztr** is a CKAN extension that adds interactive gazetteer maps for associating datasets with geographic locations and searching datasets by spatial bounding box. It combines a Python/CKAN backend with modern React/TypeScript frontends.

Documentation site: [gztr.dathere.com](https://gztr.dathere.com)

## Commands

### Python (CKAN plugin)
```bash
pip install -r requirements.txt && pip install -e .
pytest --ckan-ini=test.ini --cov=ckanext.gztr ckanext/gztr
```

### React Widgets (from `widgets/gztr-search/` or `widgets/gztr-admin/`)
```bash
npm install
npm run build       # tsc -b && vite build
npm run watch       # tsc -b && vite build --watch
npm run dev         # vite dev server
npm run lint        # eslint
```

Vite builds output IIFE bundles to `ckanext/gztr/assets/gztr-search/` and `ckanext/gztr/assets/gztr-react/` respectively. The output dirs in `vite.config.ts` use absolute paths (`/usr/lib/ckan/default/src/ckanext-gztr/...`) targeting the CKAN deployment environment.

### Docs (from `docs/`)
```bash
bun dev             # local dev server
bun next build      # production build
```

## Architecture

### Plugin (`ckanext/gztr/plugin.py`)
`GZTRPlugin` is a `SingletonPlugin` implementing four CKAN interfaces:
- **IConfigurer**: Registers templates, public dir, and assets
- **IValidators**: Registers `parse_date_range`, `parse_date_range_optional`, `check_end_date`, `gazetteer_validator`
- **IPackageController**: Hooks into dataset lifecycle — `after_dataset_show` injects gazetteer extra, `before_dataset_index` converts GeoJSON→WKT and removes spatial from SOLR doc, `after_dataset_search` filters results by bbox intersection using Shapely
- **ITemplateHelpers**: Registers helpers from `helpers.py`

Entry point: `gztr=ckanext.gztr.plugin:GZTRPlugin`

### Two React Widgets
Both are independent Vite+React 19 apps using MapLibre GL JS, Zustand for state, Radix UI components, and Tailwind CSS:

1. **gztr-admin** (`widgets/gztr-admin/`) — Data curator widget embedded in the dataset form via `gazetteer_widget.html` template snippet. Lets users select preset GeoJSON features or draw polygons. Builds to `assets/gztr-react/`.

2. **gztr-search** (`widgets/gztr-search/`) — Public search widget embedded in `package/search.html`. Lets users draw bounding boxes to filter datasets spatially. Builds to `assets/gztr-search/`.

### Spatial Data Flow
1. Curator selects features/draws polygons → stored as GeoJSON in `gazetteer` package extra
2. `gazetteer_validator` serializes features to JSON for storage
3. `before_dataset_index` converts GeoJSON to WKT via Shapely, then pops `spatial` from the SOLR doc to avoid indexing issues
4. `after_dataset_search` intersects search results against user-drawn bbox using `shapely.from_geojson()` and `shapely.intersection()`

### Schemas
YAML schemas in `ckanext/gztr/schemas/` define dataset/organization fields using ckanext-scheming. The `dataset.yaml` schema includes the gazetteer field with custom form/display snippets.

### Templates
Jinja2 templates extend CKAN base templates with `{% ckan_extends %}`. Key templates:
- `scheming/form_snippets/gazetteer_widget.html` — mounts the gztr-admin React app
- `package/search.html` — mounts the gztr-search React app
- Assets loaded via `{% asset 'ckanext-gztr/...' %}` tags, configured in `assets/resource.config`

### GeoJSON Data
Preset geographic features (counties, districts, etc.) live in `ckanext/gztr/public/data/gztr-features/` as GeoJSON files loaded by the React widgets.

## Key Dependencies
- **Python**: shapely (geospatial), CKAN 2.9, ckanext-scheming
- **Frontend**: react 19, maplibre-gl, @turf/turf, zustand, @geoman-io/maplibre-geoman-free (drawing), topojson, Radix UI, tailwindcss
- **Build**: vite (rolldown-vite), @vitejs/plugin-react-swc, typescript ~5.9, biome (linting)
