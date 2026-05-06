Use this as your **audit-and-repair Codex prompt**:

```text
Audit the entire SmartReview AI project.

Read first:
- AGENTS.md
- tasks.md
- ui_revision_prompt.md
- Design/design.json
- all test files
- package.json
- app/src/routes/pages/components/services

Goal:
Verify whether the implemented code truly satisfies AGENTS.md and tasks.md.

Do not trust checked tasks blindly.

Audit these areas:
1. Pages and navigation
2. Auth flow
3. Upload flow
4. File validation
5. Text extraction
6. AI review endpoint
7. Summarizer/paraphraser
8. Theme toggle
9. Light/dark design consistency
10. API calls per page
11. Tests and E2E coverage
12. No hardcoded demo-only behavior in production paths

For every feature:
- Check if code exists
- Check if it is wired to UI
- Check if it calls the correct API
- Check if tests verify it
- Check if it matches tasks.md
- Check if it matches AGENTS.md

If a feature is incomplete:
- Add or fix the code
- Add or update tests
- Run validation commands
- Update tasks.md honestly

Rules:
- No hallucinations
- No fake passing results
- No marking complete without working code and tests
- Do not delete working code unless necessary
- Keep UI aligned with Design/design.json
- Prefer small focused fixes

Run:
- npm test
- npm run lint
- npm run build
- Playwright E2E tests if available

Final report must include:
1. What passed
2. What failed
3. What was fixed
4. What remains incomplete
5. Which tasks.md items were updated
```

And here’s a starter **audit script** you can save as:

```bash
scripts/audit-project.mjs
```

```js
import fs from "fs";
import { execSync } from "child_process";

const requiredFiles = [
  "AGENTS.md",
  "tasks.md",
  "package.json",
  "Design/design.json"
];

const requiredPages = [
  "login",
  "signup",
  "dashboard",
  "documents",
  "reviews",
  "rubrics",
  "formatting",
  "writing-tools",
  "ai-detector",
  "humanizer",
  "utilities",
  "settings",
  "help"
];

function exists(path) {
  return fs.existsSync(path);
}

function run(command) {
  console.log(`\n▶ ${command}`);
  try {
    execSync(command, { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

console.log("🔍 SmartReview AI Project Audit\n");

let failures = [];

for (const file of requiredFiles) {
  if (!exists(file)) failures.push(`Missing required file: ${file}`);
}

for (const page of requiredPages) {
  const possiblePaths = [
    `app/${page}/page.tsx`,
    `src/app/${page}/page.tsx`,
    `pages/${page}.tsx`,
    `src/pages/${page}.tsx`
  ];

  if (!possiblePaths.some(exists)) {
    failures.push(`Missing page: /${page}`);
  }
}

const tasks = exists("tasks.md") ? fs.readFileSync("tasks.md", "utf8") : "";

if (tasks.includes("[x]") && !tasks.includes("E2E")) {
  failures.push("tasks.md has completed tasks but weak E2E evidence.");
}

const commands = [
  "npm test",
  "npm run lint",
  "npm run build"
];

for (const command of commands) {
  const ok = run(command);
  if (!ok) failures.push(`Command failed: ${command}`);
}

console.log("\n==============================");
console.log("AUDIT RESULT");
console.log("==============================");

if (failures.length === 0) {
  console.log("✅ Audit passed. No obvious issues found.");
} else {
  console.log("❌ Audit found issues:\n");
  failures.forEach((f, i) => console.log(`${i + 1}. ${f}`));
  process.exit(1);
}
```

Run it with:

```bash
node scripts/audit-project.mjs
```

Then tell Codex:

```text
Run node scripts/audit-project.mjs. Fix every failure it reports, add missing tests, rerun the audit, and update tasks.md only after everything passes.
```
