The app is not acceptable yet. Perform a full audit and repair of the UI, auth, routing, and upload flows.

Read first:
- AGENTS.md
- tasks.md
- Design/design.json
- Design/light/*
- Design/dark/*
- ui_revision_prompt.md

- all relevant code (auth, layout, sidebar, upload, profile, routes)

IMPORTANT:
Do NOT trust checked tasks in tasks.md. Verify everything from code and behavior.

----------------------------------
PRIMARY GOAL
----------------------------------
1. Identify broken, incomplete, or falsely marked features
2. Fix them
3. Update tasks.md honestly:
   - uncheck anything not working
   - add missing tasks
   - keep completed tasks only if fully verified

----------------------------------
FIX THESE AREAS

1. Auth UI
- Login and signup must match design
- No sidebar/layout on auth pages
- Proper error/loading states

2. Sidebar + Navigation
- Fix broken sidebar layout, padding, icons
- Ensure each route is correct (no duplicate routes)
- Fix "Dashboard" and "Assignment Review" routing conflict
- Fix New Review button size and routing

3. Theme System
- Fix light/dark toggle
- Must persist
- Fix unreadable elements (icons, notifications, dropdowns)

4. Profile + Logout
- Profile must be a protected route
- Fix profile page functionality
- Add logout option
- Logout must clear session and redirect to login

5. JWT / Auth Bug
- Fix “EXP claim timestamp check fail”
- Handle expired tokens:
  - clear session
  - redirect to /login

6. Upload + Review Flow
- Fix upload from "My Documents"
- Ensure upload connects to real endpoint
- Validate file type and size
- Show extracted text preview
- Ensure review flow runs end-to-end

7. Routing + Pages
- Each sidebar link must go to a real page
- No redirecting back to dashboard unless intended
- Pages must call their own APIs and show results

8. UI Consistency
- Fix padding issues
- Fix icon spacing
- Fix button sizes
- Match Design/design.json strictly

----------------------------------
TASK.MD UPDATE RULES (CRITICAL)

After fixing and verifying:

1. UNCHECK tasks that are:
   - broken
   - partially implemented
   - not connected to UI
   - not tested

2. KEEP checked tasks ONLY if:
   - feature works end-to-end
   - tested successfully
   - no UI or logic issues

3. ADD NEW TASKS for discovered issues:
   - broken routes
   - missing API connections
   - UI inconsistencies
   - auth bugs
   - upload failures

4. GROUP tasks clearly under sections:
   - Auth
   - UI/Layout
   - Routing
   - Upload/Review
   - Theme
   - Bugs

5. CREATE a new section:

## Current Sprint: Sprint 1.6 — Fix & Stabilization

Include:
- all remaining issues
- all newly discovered tasks

----------------------------------
TESTING (MANDATORY)

Run:
- npm run lint
- npm run build
- npm test
- Playwright E2E tests

Verify:
- login
- signup
- logout
- protected routes
- theme toggle
- sidebar navigation
- documents upload
- assignment review flow
- expired token handling

----------------------------------
FINAL OUTPUT REQUIRED

Return:

1. List of issues found
2. List of fixes applied
3. Updated tasks.md content (FULL FILE)
4. What still remains incomplete
5. Test results (pass/fail)

----------------------------------
RULES

- No hallucinations
- No fake completion
- No hardcoded values
- No skipping tests
- Do not mark tasks complete unless verified