import { expect, test } from "@playwright/test";

test.describe("Navigation, Theme, and Sidebar Persistence", () => {
  test.beforeEach(async ({ page }) => {
    // Signup and login to get to dashboard
    const email = `test-${Date.now()}@example.com`;
    await page.goto("/signup");
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("dark mode persists after sidebar navigation", async ({ page }) => {
    // Toggle dark mode
    await page.getByRole("button", { name: "Test User" }).click();
    await page.getByRole("button", { name: "Dark Mode" }).click();
    
    // Verify dark mode is applied
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // Navigate using sidebar
    await page.getByRole("link", { name: "My Documents" }).click();
    await expect(page).toHaveURL(/\/documents$/);
    
    // Verify dark mode still applied
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("dark mode persists after refresh", async ({ page }) => {
    // Toggle dark mode
    await page.getByRole("button", { name: "Test User" }).click();
    await page.getByRole("button", { name: "Dark Mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // Refresh page
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("sidebar navigation does not full reload", async ({ page }) => {
    // Inject a witness variable into the window
    await page.evaluate(() => { window.__TEST_RELOAD_WITNESS__ = true; });

    // Navigate using sidebar
    await page.getByRole("link", { name: "Reviews" }).click();
    await expect(page).toHaveURL(/\/reviews$/);

    // If it didn't full reload, the witness should still be there
    const witness = await page.evaluate(() => window.__TEST_RELOAD_WITNESS__);
    expect(witness).toBe(true);
  });

  test("sidebar background covers full height and is fixed", async ({ page }) => {
    // Sidebar should have fixed position and cover 100% height
    const sidebar = page.locator(".sidebar");
    const box = await sidebar.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(600); // Typical viewport min
    
    const position = await sidebar.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).toBe("fixed");
    
    const background = await sidebar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // Should be dark if we are in dark mode or have a specific color
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("sidebar navigation is scrollable", async ({ page }) => {
    // Check if nav has overflow hidden scroll or similar
    const nav = page.locator(".sidebar nav");
    const overflow = await nav.evaluate((el) => window.getComputedStyle(el).overflowY);
    expect(overflow).toBe("auto");
  });
});
