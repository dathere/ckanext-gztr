import { test, expect } from '@playwright/test';

test('has CKAN title', async ({ page }) => {
    await page.goto(`http://localhost:${process.env.CKAN_PORT}`);
    await expect(page).toHaveTitle(/Welcome - CKAN/);
});
