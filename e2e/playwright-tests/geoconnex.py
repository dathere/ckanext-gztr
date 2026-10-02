import pathlib
import subprocess
from time import sleep

from rich import print as rprint
from rich.console import Console
from rich.markdown import Markdown
from rich.progress import track

# Present the markdown file
print()
console = Console()
with open(
    pathlib.Path(__file__).parent.resolve().joinpath("geoconnex.md")
) as documentation:
    markdown = Markdown(documentation.read())
console.print(markdown)
print()
for _ in track(
    range(30),
    description="[bold red]Pausing for 30 seconds so you can skim the notes above first...[/bold red]",
):
    sleep(1)

rprint(
    "[bold red]Loading test description for geoconnex/dataset_landing_page_jsonld.md...[/bold red]"
)
subprocess.run(
    [
        "pytest",
        "-s",
        "geoconnex/tests.py",
        "--headed",
        "--slowmo",
        "20000",
    ]
)

print()
rprint("[bold cyan]Ran all Geoconnex tests![/bold cyan] Let us know how it went.")
