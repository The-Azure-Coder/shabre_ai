import { expect, test } from "@playwright/test";

test("document editor works end to end with Tiptap", async ({ page }) => {
  const email = `tiptap-${Date.now()}@example.edu`;

  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Tiptap Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/documents");
  await expect(page.locator("main h1").first()).toHaveText("My Documents");

  const uploadInput = page.locator(".upload-strip input[type=\"file\"]");
  await uploadInput.setInputFiles({
    name: "tiptap-editor.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Tiptap editor test.\n\nThis paragraph will be rewritten in the editor."),
  });

  await expect(page.getByText("tiptap-editor.txt")).toBeVisible();
  const editorHref = await page.getByRole("link", { name: "Open in Editor" }).getAttribute("href");
  expect(editorHref).toMatch(/^\/documents\//);
  await page.goto(editorHref);
  await expect(page).toHaveURL(/\/documents\/.+/);
  await expect(page.getByRole("heading", { name: "Document Editor" })).toBeVisible();
  await expect(page.getByText("tiptap-editor.txt")).toBeVisible();

  const editor = page.locator(".rich-document-editor__content[contenteditable=\"true\"]");
  await expect(editor).toBeVisible();
  await expect(page.locator('button[title="Heading 1"]')).toBeVisible();
  await page.getByRole("button", { name: "Break" }).click();
  await expect(page.locator("[data-page-break]")).toHaveCount(1);
  await expect(page.locator("[data-page-break]")).toContainText("Page Break");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Saved")).toBeVisible();

  await page.reload();
  await expect(page.locator("[data-page-break]")).toHaveCount(1);
  await expect(page.getByText("First page paragraph.")).toBeVisible();
  await expect(pageErrors).toEqual([]);
});
