import { expect, test } from "@playwright/test";

test.describe("Rubric-based Review Flow", () => {
  test.beforeEach(async ({ page }) => {
    const email = `test-${Date.now()}@example.com`;
    await page.goto("/signup");
    await page.getByLabel("Name").fill("Review Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("dashboard is summary-only and review flow works end-to-end", async ({ page }) => {
    // 1. Dashboard summary check
    await expect(page.locator(".upload-card")).toHaveCount(0);
    await expect(page.getByText("Recent Reviews")).toBeVisible();
    await expect(page.getByText("Documents Reviewed")).toBeVisible();

    // 2. Start review from dashboard
    await page.getByRole("link", { name: "Start New Review" }).click();
    await expect(page).toHaveURL(/\/reviews\/workspace$/);

    // 3. Upload document in workspace
    await page.evaluate(() => {
      window.__reviewWorkspaceMarker = "persist";
    });

    const workspaceUploads = page.locator('input[type="file"]');
    await workspaceUploads.first().setInputFiles({
      name: "assignment.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Refactored assignment content. This needs review against a specific rubric."),
    });

    await expect(page.getByRole("heading", { name: "assignment.txt" })).toBeVisible();
    await expect(page.locator(".document-preview").getByText("Refactored assignment content")).toBeVisible();
    const marker = await page.evaluate(() => window.__reviewWorkspaceMarker);
    expect(marker).toBe("persist");

    // 4. Evaluate against rubric
    await workspaceUploads.nth(1).setInputFiles({
      name: "rubric.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Content Quality: 20\nOrganization: 20"),
    });
    await expect(page.getByText("rubric.txt")).toBeVisible();
    await page.getByRole("button", { name: "Review against Rubric" }).click();

    // 5. Verify results
    const resultsPanel = page.locator(".workspace-sidebar");
    console.log("Sidebar Content:", await resultsPanel.textContent());
    
    await expect(page.getByText("Overall Score")).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Content Quality", { exact: true })).toBeVisible();
    await expect(page.getByText("Organization", { exact: true })).toBeVisible();
    await expect(page.locator("[data-suggestion-title]").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Change Report" })).toBeVisible();
    await expect(page.getByText("Recommendations")).toBeVisible();
    await expect(page.getByText("Improvement Checklist")).toBeVisible();

    // 6. Navigation to reviews list
    await page.getByRole("link", { name: "Reviews", exact: true }).click();
    await expect(page.locator(".data-row").filter({ hasText: "assignment.txt" }).first()).toBeVisible();
  });
});
