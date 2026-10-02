import os
import pathlib
import re
import subprocess
from time import sleep

from bs4 import BeautifulSoup
from duct import cmd
from playwright.sync_api import Page, Playwright, expect
from rich import print as rprint
from rich.console import Console
from rich.markdown import Markdown
from rich.progress import track


def print_markdown(name: str, seconds: int = 60):
    print()
    rprint(
        f"[bold red]Starting a new test in {seconds} seconds:[/bold red] [bold purple]{name[:-3]}[/bold purple]"
    )
    console = Console()
    with open(pathlib.Path(__file__).parent.resolve().joinpath(name)) as documentation:
        markdown = Markdown(documentation.read())
    console.print(markdown)
    print()
    for _ in track(
        range(seconds),
        description=f"[bold red]Pausing this test for {seconds} seconds so you can skim the test's description above first...[/bold red]",
    ):
        sleep(1)


def dataset_landing_page_jsonld(page: Page):
    page.goto("http://localhost:5000")
    # Expect a title "to contain" a substring.
    expect(page).to_have_title(re.compile("Welcome - CKAN"))
    page.get_by_role("link", name="Hide »").click()
    page.get_by_role("link", name="Log in").click()
    page.get_by_role("textbox", name="Username or Email:").click()
    page.get_by_role("textbox", name="Username or Email:").fill("ckan_admin")
    page.get_by_role("textbox", name="Password:").fill("test1234")
    page.get_by_role("button", name="Login").click()
    page.get_by_role("link", name=" Add Dataset").click()
    page.get_by_role("textbox", name="* Title:").fill(
        "Dataset about Rio Grande-Albuquerque HUC8 Sub Basin"
    )
    page.get_by_role("button", name="Edit").click()
    page.get_by_role("textbox", name="* URL:").fill(
        "dataset-about-rio-grande-albuquerque-huc8-sub-basin"
    )
    page.get_by_label("Visibility").select_option("Public")
    page.get_by_role("textbox", name="Description:").fill(
        "Some description about the dataset"
    )
    page.get_by_role("button", name="Add location data").click()
    page.get_by_role("combobox", name="Click here to search and").click()
    page.get_by_role("combobox", name="Click here to search and").fill("Albuquerque")
    page.get_by_text("HUC8 Sub-Basins").click()
    page.get_by_role("option", name="Rio Grande-Albuquerque").click()
    page.get_by_role("button", name="Apply").click()
    page.get_by_role("button", name="Next: Add Data").click()
    page.get_by_role("button", name="Link to a URL on the internet").click()
    page.get_by_role("textbox", name="URL:").fill("https://example.com/abc.csv")
    page.get_by_role("button", name="Publish").click()
    html = page.content()
    soup = BeautifulSoup(html, "html.parser")
    jsonld_element = soup.find("script", attrs={"type": "application/ld+json"})
    jsonld = jsonld_element.get_text()
    rprint(
        "\n== [bold cyan]Embedded JSON-LD on CKAN dataset's landing page (pretty formatted):[/bold cyan]"
    )
    Console().print_json(jsonld)
    rprint(
        "\n== [bold cyan]Validating JSON-LD with nabu SHACL Go CLI tool by running:[/bold cyan] [bold purple]docker run internetofwater/nabu:latest shacl validate (jsonld string here)[/bold purple]"
    )
    output = subprocess.run(  # noqa
        ["docker", "run", "internetofwater/nabu:latest", "shacl", "validate", jsonld]
    )
    assert output.returncode == 0
    rprint(
        "== [bold green]Successfully validated that the embedded JSON-LD on the dataset's landing page conforms to the SHACL shape.[/bold green]"
    )


def run_bulk_runner(tmp_path):
    if not os.path.isdir(tmp_path / "ckan_geoconnex_bulk_runner"):
        cmd(
            "git", "clone", "https://github.com/dathere/ckan_geoconnex_bulk_runner"
        ).dir(tmp_path).unchecked().run()
    cmd("cargo", "run", "-p", "generate_release", "--release").env(
        "NAMESPACE", "New_Mexico_Water_Data_Catalog"
    ).env("INSTANCE_URL", "http://localhost:5000").env(
        "API_TOKEN", "example_authorization_header_token_value_for_proxyorwaf_bypass"
    ).dir(tmp_path / "ckan_geoconnex_bulk_runner").unchecked().run()


def bulk_runner(tmp_path):
    rprint(
        "[bold cyan]Running bulk runner against http://localhost:5000 to generate JSON-LD...[/bold cyan]"
    )
    run_bulk_runner(tmp_path)
    rprint("[bold green]Ran bulk runner![/bold green]")


def dataset_delete(page: Page, tmp_path):
    page.get_by_role("link", name="Datasets", exact=True).click()
    page.get_by_role(
        "link",
        name="Navigate to dataset: Dataset about Rio Grande-Albuquerque HUC8 Sub Basin",
    ).click()
    page.get_by_role("link", name=" Manage").click()
    page.get_by_role("link", name="Delete").click()
    page.get_by_role("button", name="Confirm").click()
    expect(page.get_by_text("Dataset has been deleted.")).to_be_visible()
    rprint("[bold green]Dataset confirmed to be deleted on frontend.[/bold green]")
    rprint(
        "[bold cyan]Running bulk runner against http://localhost:5000 to generate JSON-LD...[/bold cyan]"
    )
    run_bulk_runner(tmp_path)


def test_geoconnex_integration_with_ckan(playwright: Playwright, tmp_path):
    print_markdown("dataset_landing_page_jsonld.md")
    browser = playwright.chromium.launch(headless=False, args=["--start-maximized"])
    # context = browser.new_context(no_viewport=True, record_video_dir="test-videos/")
    context = browser.new_context(no_viewport=True)
    page = context.new_page()
    dataset_landing_page_jsonld(page)
    print_markdown("bulk_runner.md")
    bulk_runner(tmp_path)
    print_markdown("dataset_delete.md", 45)
    dataset_delete(page, tmp_path)
    context.close()
