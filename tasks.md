## Current Sprint: TanStack & Gemini Completion

Goal: Finalize the migration by completing the API surface and integrating Gemini as the primary AI provider.

## Current Sprint: Workspace UI Refinement

Goal: align the review and formatting workspaces with the dark glassmorphic design references while keeping the shared shell stable.

### Review + Formatting UI
- [x] Rebuild the review workspace into a responsive 2x2 step-card layout with a stacked mobile flow
- [x] Add a reusable button primitive with primary, secondary, outline, and ghost variants
- [x] Add shared card/section surface primitives for the review and formatting screens
- [x] Route `/formatting` to the full formatting checker workspace instead of the legacy generic tool form
- [x] Verify the updated UI with `npm run lint` and `npm run build`
- [x] Redesign the formatting checker for a 1300px viewport with compact step composition, tabbed document input, and a sticky review toolbar
- [x] Apply the glassmorphic shell treatment across shared page surfaces and tighten the sidebar New Review CTA
- [x] Redesign the Utilities Hub to match the new dark dashboard reference with smart tools and file utility cards
- [x] Redesign the Profile screen to match the new dark account-management reference
- [x] Redesign the Settings screen to match the new dark preferences reference
- [x] Redesign the Citation Generator to match the new dark dual-mode reference

### API & Tools Implementation
- [x] Migrate all `/api/v1/tools` endpoints to `server-api.js` (AI Detect, Citations, Formatting, Humanize, Paraphrase, Summarize)
- [x] Migrate `/api/v1/utilities` endpoints (DOCX to PDF, PDF Merge/Split)
- [x] Ensure all tool responses match the strict JSON schemas defined in `AGENTS.md`

### Gemini Integration (MANDATORY)
- [x] Replace grounded fallback in `ai-service.js` with actual Gemini Pro API calls
- [x] Implement strict JSON output enforcement for Gemini responses
- [x] Verify Gemini handles: Document Review, Rubric Scoring, and Formatting Feedback

### Realtime & UX
- [x] Connect WebSocket server to actual document processing/AI job status
- [x] Implement TailwindCSS utility classes for consistent UI (as per stack requirements)
- [x] Verify end-to-end flow from Upload -> AI Processing (Realtime) -> Result Display

## Completed: TanStack Architecture Migration
...
Last updated: 2026-04-28

## Build Behavior

Prefer practical progress over strict literalism.

When implementing a feature:
- inspect the surrounding app
- identify missing dependencies, pages, routes, and states
- implement what is necessary for a usable result
- update this file with any newly discovered tasks
- verify the full user flow

Do not wait for the user to list every obvious subtask.

## Task Management Rules

- Only mark `[x]` after the feature is implemented, tested, and verified.
- Keep production-only integrations unchecked until they are exercised by tests or a real environment.
- Design source of truth: `Design/design.json`, `Design/light/dashboard.png`, `Design/dark/dashboard.png`, and `Design/dark/dashbaordv2.png`.
- Do not move to new feature work until Sprint 1.6 remediation remains complete.
- Quick UI or interaction fixes can be marked complete after implementation plus a minimal manual check; they do not need lint, build, or E2E.

## Current Sprint: Database Connectivity

Goal: keep Prisma connected to the live Neon database across auth and document flows.

### Prisma Runtime
- [x] Switch Prisma to the pg adapter for live Postgres connectivity
- [x] Add direct URL support for Prisma CLI migrations and commands
- [x] Verify signup and login against the live database after the Prisma adapter change

## Current Sprint: Document Editor Rich Text

Goal: preserve Word formatting when documents open in the editor.

### DOCX Editor
- [x] Convert DOCX uploads to HTML before loading into the editor
- [x] Preserve bold, paragraphs, lists, tables, and spacing where supported
- [x] Carry rich document HTML through the document API responses
- [x] Open uploaded documents in the editor from the documents list
- [x] Replace the document detail textarea with a Tiptap rich-text editor
- [x] Persist editor HTML alongside plain text on save
- [x] Verify the Tiptap editor route loads, edits, saves, and reloads in browser E2E

### APA Formatting
- [x] Add APA preset controls for font, size, spacing, and margins in the document editor
- [x] Render the editor inside a paper-like page frame with APA defaults
- [x] Verify APA controls update the live editor layout in browser E2E
- [x] Add explicit page break markers to the editor surface
- [x] Verify page break insertion survives save and reload in browser E2E

## Current Sprint: Auth Centering

Goal: center the login and signup screens and show a submit loader.

### Auth UI
- [x] Center login and signup cards in the viewport
- [x] Add submit loader to auth forms

### Universal Loader
- [x] Add a shared loading component for auth checks and route loading

## Current Sprint: Document Preview Polish

Goal: make every uploaded document preview look like a Word document with structure.

### Preview UI
- [x] Render uploaded documents inside a shared Word-style editor preview
- [x] Show structured previews on review detail, upload card, and workspace
- [x] Keep document listing metadata-only with title, type, word count, and upload time
- [x] Preserve DOCX HTML while falling back to structured text preview for other files

### Button Layout
- [x] Standardize action button padding and vertical alignment
- [x] Align document row actions so Open in Editor sits properly with Delete

### Document Route
- [x] Route Open in Editor to a stable document detail/editor page
- [x] Remove the document detail shortcut into the workspace chunk-load path
- [x] Make the document editor show full document text and allow saves
- [x] Remove the preview from the document editor route so the page is edit-only

## Current Sprint: Sprint 1.8 — Review Flow Refactor

Goal: Move review flow from dashboard to a dedicated workspace under /reviews, based on rubric scoring.

### Refactoring
- [x] Remove dashboard upload flow
- [x] Convert dashboard to summary-only page
- [x] Add upload-for-review action to /reviews
- [x] Create document review workspace (/reviews/workspace)
- [x] Display extracted document text in editor-style view
- [x] Add rubric input/upload/select UI
- [x] Implement rubric-based review API flow
- [x] Show criterion scores, explanations, recommendations and checklist
- [x] Add E2E test for upload → preview → rubric → review result

### Workspace Refinement
- [x] Keep review uploads client-side so the page does not refresh during document submission
- [x] Add rubric upload at the top of the review workspace
- [x] Highlight review suggestions directly inside the document preview
- [x] Show a detailed change report for rubric-driven edits
- [x] Keep review detail pages synced with highlighted suggestions and report data
- [x] Hide editor toolbar on read-only review detail pages

## Current Sprint: Sprint 1.7 — Navigation, Theme Persistence, Sidebar Fixes

Goal: Fix slow navigation, page reloads, theme reset, and sidebar layout issues.

### Navigation
- [x] Client-side navigation implemented using Next.js Link
- [x] Removed redundant AuthGuard/AppFrame from pages to prevent remounting
- [x] Full page reloads eliminated for internal routes

### Theme Persistence
- [x] Theme state moved to root AppFrame
- [x] Blocking script added to root layout to prevent theme flicker
- [x] Theme persists across navigation and browser refresh

### Sidebar Fixes
- [x] Sidebar changed to fixed layout for full-height coverage
- [x] Sidebar background covers all navigation links in both modes
- [x] Sidebar navigation made scrollable for long lists
- [x] Workspace padding adjusted for fixed sidebar

### Testing
- [x] Playwright tests added for theme persistence
- [x] Playwright tests added for client-side navigation (no-reload witness)
- [x] Playwright tests added for sidebar layout and scrollability

## Current Sprint: Sprint 1.6 — Fix & Stabilization

Goal: fix fake-complete or incomplete Sprint 1 features and stabilize the application for use.

### Auth UI
- [x] Login page matches design (with SR logo and headers)
- [x] Login page redesigned to match the new dark split-panel reference
- [x] Signup page matches design (with SR logo and headers)
- [x] Auth pages do not use dashboard sidebar layout

### Sidebar + Navigation
- [x] Sidebar spacing/icons fixed
- [x] Dashboard route fixed
- [x] Assignment Review route fixed (Unified with Dashboard upload flow)
- [x] New Review button routes correctly and is prominent (52px height)
- [x] All sidebar links tested and functional

### Theme
- [x] Light/dark toggle fixed
- [x] Theme persists via localStorage
- [x] Notification/help/profile icons readable in both themes (fixed .icon-button background)

### Profile + Logout
- [x] Profile is protected via AuthGuard (wrapped in FeaturePage)
- [x] Profile page works (displays user data from localStorage)
- [x] Logout added to profile dropdown
- [x] Logout clears session and redirects to login

### JWT
- [x] EXP timestamp error fixed (using numeric timestamp in SignJWT)
- [x] Expired tokens handled safely in AuthGuard (redirects to /login)

### Upload + Review
- [x] Documents upload works (verified pdf, docx, txt, pptx)
- [x] Assignment review upload works (verified end-to-end)
- [x] File validation works (type, size, empty file)
- [x] Extracted text preview works (added heading and verified content)
- [x] Review flow works end-to-end (deterministic mock results stored in Prisma)

### General UI Consistency
- [x] Button sizes and rounded corners (14px for primary)
- [x] Spacing and padding (increased dashboard and page-shell padding)
- [x] Sidebar brand mark (consistent 'SR' mark)
- [x] Mobile responsiveness (Sidebar collapses to bottom bar)
- [x] Fixed layout overlap and sticky header click interception

## Current Sprint: Dashboard Polish

Goal: tighten the dashboard stat cards so the top-left icons are visually centered and aligned.

### Stat Cards
- [x] Centered all four dashboard stat-card icons inside perfect square tiles
- [x] Standardized icon tile sizing, spacing, and SVG scale
- [x] Verified card alignment in the browser on the dashboard

### Profile Menu
- [x] Profile dropdown opens and closes from the arrow control
- [x] Profile dropdown closes when clicking outside or pressing Escape
- [x] Profile avatar initials render inside a filled circular badge
