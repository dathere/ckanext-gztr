# playwright-tests for ckanext-gztr

This directory includes tests using the [Playwright](https://playwright.dev/) library with Python.

## Running the tests

The instructions below are written based on an Ubuntu-based desktop environment and may differ based on your OS.

1. Prerequisites to install:

- [uv](https://docs.astral.sh/uv)
- Docker
- If you're running Geoconnex tests, install the [cargo command-line tool](https://rust-lang.org/tools/install/)

2. Open a new directory which you can use as your root test dir.

```bash
cd ~/programming
mkdir gztrtests
cd gztrtests
```

> TIP: You may want to open a code editor at this step on this root dir.

3. Clone the [github.com/dathere/gztr-docker-demo](https://github.com/dathere/gztr-docker-demo) repository to your root dir.

```bash
git clone https://github.com/dathere/gztr-docker-demo.git
cd gztr-docker-demo
```

4. Copy `.env.example` to `.env` and modify the `.env` file as needed. Most of the ckanext-gztr config is at the bottom.

```bash
cp .env.example .env
nano .env # Or modify this file in a code/text editor
```

In particular for the Geoconnex tests, you'll want to have the following setup:

```sh
CKANEXT__GZTR__GEOCONNEX__ENABLED=true
# The namespace that should exist in the namespaces/bulk/ckan directory at https://github.com/internetofwater/geoconnex.us
CKANEXT__GZTR__GEOCONNEX__NAMESPACE=New_Mexico_Water_Data_Catalog
# Embeds Geoconnex-compatible JSON-LD within each compatible CKAN dataset's landing page
CKANEXT__GZTR__GEOCONNEX__ENABLE_DATASET_JSONLD=true
```

Otherwise most of `.env` can be kept the same except for the 3 variables ending with `TILES_URL`, which for now you can set as `https://tiles.openfreemap.org/styles/liberty`. Technically these variables could be left empty but then you wouldn't see the basemaps and instead just the polygons.

4.1: There is [currently a `KeyError` issue](https://github.com/ckan/ckan/issues/9552) when running the CKAN container. Add the following line after the `USER ckan` line in the `ckan/Dockerfile.dev` file to avoid the error:

```bash
RUN sed -i 's/storages_grouped_by_privacy\[storage.settings.type\]\[storage.settings.public\].add(path)/storages_grouped_by_privacy\[storage.settings.type\]\[True\].add(path)/g' /srv/app/src/ckan/ckan/lib/files/__init__.py
```

5. Build the Docker Compose setup using the development compose file `docker-compose.dev.yml` and start the docker compose stack:

```bash
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up
```

Wait until the CKAN service is running, as it will start after the other three services (Postgres DB, SOLR search engine, Redis) are reported as healthy which may take about a minute.

6. Verify that [http://localhost:5000](http://localhost:5000) is up and running (once all your containers are running) in your browser and returns a CKAN home page.

7. There seems to be an issue with the CKAN docker compose environment where the `ckan_admin` sysadmin user is not created even though we defined it in our `.env` file. You'll want to make the account just in case.

- List the running Docker containers with `docker ps`.
- Copy the `CONTAINER ID` value of the `ckan-dev` container, such as `93e90ae4120b`.
- Run `docker exec --user root -it 93e90ae4120b bash` to launch a Bash shell in the container. You should automatically start in the container in the `/srv/app` directory.
- Run `ckan -c ckan.ini user add ckan_admin`. When prompted, enter an email such as `your_email@example.com` and the password should be `test1234`.
- Run `ckan -c ckan.ini sysadmin add ckan_admin` to set the `ckan_admin` user as a sysadmin.

A dataset publisher with publishing privileges for a CKAN organization would not need to be a sysadmin, but for convenience we set the role as a sysadmin.

8. Login at [http://localhost:5000/user/login](http://localhost:5000/user/login) as the `ckan_admin` user.
9. Create a CKAN organization at [http://localhost:5000/organization/](http://localhost:5000/organization/). Provide any title and optionally a description.

Now your CKAN instance is set up for the tests. Let's start setting up the test directory.

10. Go back to your root test directory and then clone the ckanext-gztr repository so that you can navigate to the Playwright tests directory.

```bash
cd ~/programming/gztrtests
git clone https://github.com/dathere/ckanext-gztr.git
cd ckanext-gztr/e2e/playwright-tests
```

11. Set up a virtual environment using `uv` and then load the dependencies.

```bash
uv venv
source .venv/bin/activate
uv sync
```

12. **IMPORTANT NOTE: If you're running Geoconnex tests only then skip the rest of the steps below and follow/read the `geoconnex.md` file.**

13. Read the test description first. Now that you've read about the test description, let's run the test! Run a single test using `pytest`. For example, let's run the test `geoconnex.py`.

```bash
pytest -s geoconnex.py --headed
```

- `-s` prints out useful information in the console during and after the test
- `--headed` demonstrates the test running live in a new Chromium browser so you can watch the test run live

If you run into any issues let us know!
