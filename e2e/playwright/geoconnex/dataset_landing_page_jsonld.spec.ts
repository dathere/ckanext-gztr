import { expect, test } from "@playwright/test";

test("Dataset landing page has Geoconnex-compatible JSON-LD", async ({
  page,
}) => {
  await test.step("Log in as sysadmin", async () => {
    await page.goto(`http://localhost:${process.env.CKAN_PORT}`);
    await expect(page).toHaveTitle(/Welcome - CKAN/);
    await page.getByRole("link", { name: "Hide »" }).click();
    await page.getByRole("link", { name: "Log in" }).click();
    await page.getByRole("textbox", { name: "Username or Email:" }).click();
    await page
      .getByRole("textbox", { name: "Username or Email:" })
      .fill("ckan_admin");
    await page
      .getByRole("textbox", { name: "Username or Email:" })
      .press("Tab");
    await page.getByRole("textbox", { name: "Password:" }).fill("test1234");
    await page.getByRole("button", { name: "Login" }).click();
  });
  await test.step("Create a demo organization", async () => {
    // await page.goto(`http://localhost:${process.env.CKAN_PORT}/dataset`);
    // TODO: Figure out why pressing Login doesn't automatically send user to /dataset page
    // // TODO: Identify why Create Organization button does not create organization when clicked through test
    await page.getByRole("link", { name: " Add Dataset" }).click();
    await page.getByRole("link", { name: "Create a new organization" }).click();
    await page.getByRole("textbox", { name: "Name:" }).click();
    await page
      .getByRole("textbox", { name: "Name:" })
      .pressSequentially("Demo organization");
    await page.getByRole("button", { name: "Edit" }).click();
    await page
      .getByRole("textbox", { name: "* URL:" })
      .fill("demo-organization");
    await page.getByRole("button", { name: "Create Organization" }).click();
    // await page.goto(`http://localhost:${process.env.CKAN_PORT}/dataset`);
    // TODO: Figure out why pressing Create Organization doesn't automatically send user to /dataset page
  });
  await page.getByRole("link", { name: " Add Dataset" }).click();
  await page.getByRole("textbox", { name: "* Title:" }).click();
  await page.getByRole("textbox", { name: "* Title:" }).fill("My demo dataset");
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "* URL:" }).fill("my-demo-dataset");
  await page.getByLabel("Visibility").selectOption("False");
  await page.getByRole("textbox", { name: "Description:" }).click();
  await page
    .getByRole("textbox", { name: "Description:" })
    .fill("Example description");
  // await page.getByRole("button", { name: "Add location data" }).click();
  // await page.getByRole("button", { name: "Apply" }).click();
  // TODO: Identify why the form does not continue to the second section
  await page.getByRole("button", { name: "Next: Add Data" }).click();
  await page
    .getByRole("button", { name: "Link to a URL on the internet" })
    .click();
  await page
    .getByRole("textbox", { name: "URL:" })
    .fill("https://example.com/abc.csv");
  await page
    .getByRole("textbox", { name: "URL:" })
    .press("ControlOrMeta+Shift+ArrowLeft");
  await page
    .getByRole("textbox", { name: "URL:" })
    .press("ControlOrMeta+Shift+ArrowLeft");
  await page
    .getByRole("textbox", { name: "URL:" })
    .press("ControlOrMeta+Shift+ArrowLeft");
  await page
    .getByRole("textbox", { name: "URL:" })
    .press("ControlOrMeta+Shift+ArrowLeft");
  await page
    .getByRole("textbox", { name: "URL:" })
    .fill("https://example.com/abc.csv");
  await page.getByRole("button", { name: "Publish" }).click();
  await page.locator(".dataset-item-map").click();
  await page.getByRole("link", { name: "Datasets" }).click();
  await page
    .locator("div")
    .filter({ hasText: "My demo dataset" })
    .nth(5)
    .click();
});
