import { expect, test } from "@playwright/test";

const email = `playwright-${Date.now()}@example.edu`;
const password = "StrongPassword123!";
const name = "Tyrese Morgan";

test("Sprint 1 browser flows work end to end", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/signup");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /Welcome back, Tyrese Morgan!/ })).toBeVisible();

  await page.evaluate(() => window.localStorage.removeItem("smartreview-token"));
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /Welcome back, Tyrese Morgan!/ })).toBeVisible();
  const savedSession = await page.evaluate(() => ({
    token: window.localStorage.getItem("smartreview-token"),
    user: window.localStorage.getItem("smartreview-user"),
  }));

  const uploadInput = page.locator("#assignment-upload");
  await uploadInput.setInputFiles({
    name: "bad.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("not a supported assignment"),
  });
  await expect(page.getByText(/Unsupported file type/)).toBeVisible();

  await uploadInput.setInputFiles({
    name: "assignment.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Assignment Title\n\nThis draft really needs clearer evidence. The logic should connect claims to proof."),
  });
  await expect(page.getByRole("heading", { name: "Extracted Text Preview" })).toBeVisible();
  await expect(page.getByText("Assignment Title")).toBeVisible();
  await page.getByRole("button", { name: "Run Review" }).click();
  await expect(page.getByText(/Structured review ready|Review ready/)).toBeVisible();
  await expect(page.locator(".review-preview").getByText("grammar")).toBeVisible();
  await expect(page.locator(".review-preview").getByText("clarity")).toBeVisible();
  await expect(page.locator(".review-preview").getByText("logic")).toBeVisible();

  await page.goto("/summarizer");
  await page.locator("textarea").fill("The draft has a thesis. The supporting evidence needs expansion. The conclusion needs synthesis.");
  await page.getByRole("button", { name: "Summarizer" }).click();
  await expect(page.getByRole("heading", { name: "Result" })).toBeVisible();
  await expect(page.locator(".tool-result").getByText(/The draft has a thesis/).first()).toBeVisible();

  await page.goto("/writing-tools");
  await page.locator("textarea").fill("This argument is really very clear.");
  await page.locator(".tool-form select").first().selectOption("tone");
  await page.locator(".tool-form select").nth(1).selectOption("academic");
  await page.getByRole("button", { name: "Writing Tools" }).click();
  await expect(page.getByRole("heading", { name: "Result" })).toBeVisible();
  await expect(page.getByText(/In academic terms/)).toBeVisible();

  await page.goto("/formatting");
  await page.getByLabel("Style").selectOption("APA");
  await page.getByLabel("Assignment Text").fill("Essay Title\n\nA paragraph without citations.");
  await page.getByRole("button", { name: "Check Formatting" }).click();
  await expect(page.getByRole("heading", { name: "Violations" })).toBeVisible();
  await expect(page.getByText("References", { exact: true })).toBeVisible();

  await page.goto("/ai-detector");
  await page.getByLabel("Text to Check").fill("It is important to note that this assignment will delve into the topic. Furthermore, the essay uses repeated phrasing.");
  await page.getByRole("button", { name: "Check Text" }).click();
  await expect(page.getByText(/AI-likeness signal/)).toBeVisible();

  await page.goto("/humanizer");
  await page.getByLabel("Original Text").fill("It is important to note that students utilize evidence.");
  await page.getByRole("button", { name: "Humanize Text" }).click();
  await expect(page.getByRole("heading", { name: "Rewrite" })).toBeVisible();
  await expect(page.getByText(/use evidence/)).toBeVisible();

  await page.goto("/citations");
  await page.getByLabel("Title").fill("Learning Strategies");
  await page.getByLabel("Author").fill("Morgan, Tyrese");
  await page.getByLabel("Year").fill("2026");
  await page.getByLabel("Publisher").fill("SmartReview");
  await page.getByLabel("URL").fill("https://example.com/source");
  await page.getByRole("button", { name: "Generate Citation" }).click();
  await expect(page.getByRole("heading", { name: "APA Citation" })).toBeVisible();
  await expect(page.getByText(/Learning Strategies/)).toBeVisible();

  await page.goto("/rubrics");
  await page.getByLabel("Assignment Text").fill("Essay\n\nThe draft has a claim and evidence.");
  await page.getByRole("button", { name: "Evaluate Rubric" }).click();
  await expect(page.getByText(/Rubric evaluation completed/)).toBeVisible();

  await page.goto("/documents");
  await expect(page.getByText("assignment.txt")).toBeVisible();

  await page.goto("/reviews");
  await expect(page.getByText(/Reviewed assignment.txt/)).toBeVisible();
  await page.getByRole("link", { name: "View Report" }).first().click();
  await expect(page).toHaveURL(/\/reviews\/.+/);
  await expect(page.getByRole("heading", { name: "Review Details" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Structured Preview" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Feedback Summary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Suggestions" })).toBeVisible();
  await expect(page.locator(".editor-toolbar-preview")).toHaveCount(0);
  await expect(page.getByText("Grammar", { exact: true })).toBeVisible();

  await page.evaluate((session) => {
    if (session.token) window.localStorage.setItem("smartreview-token", session.token);
    if (session.user) window.localStorage.setItem("smartreview-user", session.user);
  }, savedSession);
  await page.goto("/documents");
  await expect(page.getByRole("heading", { level: 1, name: "My Documents" })).toBeVisible();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Delete this document");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Delete" }).first().click();
  await expect(page.getByText("assignment.txt")).toHaveCount(0);

  const routes = [
    ["/dashboard", "Welcome back, Tyrese Morgan!"],
    ["/documents", "My Documents"],
    ["/reviews", "Reviews"],
    ["/rubrics", "Rubric Evaluations"],
    ["/formatting", "Formatting Checker"],
    ["/writing-tools", "Writing Tools"],
    ["/ai-detector", "AI Detector"],
    ["/humanizer", "Humanizer"],
    ["/utilities", "Utilities Hub"],
    ["/summarizer", "Summarizer"],
    ["/citations", "Citation Generator"],
    ["/profile", "Profile"],
    ["/settings", "Settings"],
    ["/help", "Help & Support"],
  ];

  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  }
});
