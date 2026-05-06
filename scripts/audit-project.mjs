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
    `src/pages/${page}.tsx`,
    `app/${page}/page.js`,
    `src/app/${page}/page.js`,
    `pages/${page}.js`,
    `src/pages/${page}.js`
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
