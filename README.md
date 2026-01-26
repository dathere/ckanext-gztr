# ckanext-gztr

This extension adds an **interactive gazetteer map** when adding a new dataset to a CKAN instance. Users can select a geographic feature(s) or draw polygons to associate a dataset with the selected feature(s).

![ckanext-gztr demo](https://github.com/user-attachments/assets/8b8041b2-2faf-4bd9-9b67-b3e1868b3148)

Optionally the ckanext-spatial extension can also be installed and configured to work with the ckanext-gztr extension, allowing public users to search for datasets by drawing a bounding box on a public interactive map.

![public-bounding-box-search-demo](https://github.com/user-attachments/assets/8277fb04-199e-44f3-ace8-049eb2904a67)

# Installation and Setup

In this installation guide we'll use a CKAN source install set up for development on Ubuntu 22.04 and we’ll refer to the default installation location of `/usr/lib/ckan/default/src/ckan` during these steps along with the configuration file at `/etc/ckan/default/ckan.ini`. Our installation is based on [`ckan-devstaller`](https://ckan-devstaller.dathere.com).

> [!NOTE]
> If setting up a new CKAN instance we suggest using [ckan-devstaller](https://ckan-devstaller.dathere.com).

> [!WARNING]
> The ckanext-gztr extension has worked on CKAN 2.10.6 and hasn’t been verified for other versions.

## 0\. Activate your virtual environment

Ensure your terminal is running in your instance’s virtual environment before continuing.

```bash
cd /usr/lib/ckan/default/src/ckan
. ../../bin/activate
```

## 1\. Install ckanext-scheming

The ckanext-gztr extension relies on ckanext-scheming to add the interactive gazetteer to the new dataset form.

Run the following in `/usr/lib/ckan/default/src` to install the ckanext-scheming extension:

```bash
pip install -e "git+https://github.com/ckan/ckanext-scheming.git#egg=ckanext-scheming"
```

Then in your `.ini` file in `ckan.plugins` add `scheming_datasets` and `scheming_organizations`. For example:

```ini
ckan.plugins = activity scheming_datasets scheming_organization
```

Also add the following lines in the `.ini` file for displaying the gazetteer in the dataset form:

```ini
# ckanext-scheming theme settings
scheming.presets = ckanext.scheming:presets.json ckanext.gztr:schemas/presets.yaml
scheming.dataset_schemas = ckanext.gztr:schemas/dataset.yaml ckanext.gztr:schemas/application.yaml
```

## 2\. Install ckanext-gztr

In `/usr/lib/ckan/default/src` (with an activated virtual environment) run the following:

```bash
git clone https://github.com/dathere/ckanext-gztr.git
cd ckanext-gztr
pip install -e .
pip install -r requirements.txt
```

Then add `gztr` to your `ckan.plugins` in your `.ini` file:

```ini
ckan.plugins = activity scheming_datasets scheming_organizations gztr
```

Now the interactive gazetteer should be available when adding a dataset.

## 3\. Install ckanext-spatial

You may also add a public interactive map for searching through datasets by drawing a bounding box using the ckanext-spatial extension.

First install required dependencies (may differ based on your platform):

```bash
sudo apt-get install python-dev libxml2-dev libxslt1-dev libgeos-c1
```

Then run the following in `/usr/lib/ckan/default/src`:

```bash
git clone https://github.com/dathere/ckanext-spatial.git
cd ckanext-spatial
git switch ckanext-gztr
pip install -e .
pip install -r requirements.txt
```

Then add the `spatial_metadata` and `spatial_query` plugins to `ckan.plugins` in your `.ini` file, for example:

```ini
ckan.plugins = activity scheming_datasets scheming_organizations spatial_metadata spatial_query gztr
```

Update the `User-Agent` value in `ckanext-spatial/ckanext/spatial/public/js/spatial_query.js` on line 122 to your organization name. For example if your organization is named `My Organization`:

```javascript
...
      fetch(nominatimEndpoint, {
        headers: {
          "User-Agent": "My Organization"
        },
        signal: AbortSignal.timeout(5000)
      }).then((res) => res.json().then((data) => {
...
```
