The UI must be rebuilt and stabilized using the latest design references.

Read FIRST:
- AGENTS.md
- tasks.md
- /Design/design.json
- /Design/light/shabre_light_mode_design.png
- /Design/dark/shabre_dark_mode_design.png

Goal:
Build a fully functional SmartReview AI frontend using the provided light and dark designs as the strict source of truth.

----------------------------------
CORE RULES
----------------------------------
- Do NOT redesign anything.
- Match the provided designs exactly (layout, spacing, cards, colors, typography).
- Use reusable components (Sidebar, Topbar, Card, Layout).
- No broken links.
- No placeholder pages without proper UI states.
- No hardcoded fake data (except clearly labeled mock states).
- Every page must call its actual API and render real results.
- DO NOT redirect users back to the dashboard unless explicitly required.

----------------------------------
THEME SYSTEM (REQUIRED)
----------------------------------
- Implement full light and dark mode based on provided designs.
- Add theme control in user profile dropdown:
  - User clicks profile avatar
  - Dropdown opens
  - "Theme" option exists
  - Options:
    - Light Mode
    - Dark Mode
- Persist theme (localStorage or user settings)
- Apply theme globally

----------------------------------
AUTH PAGES

/login
- Functional login form
- Calls real auth API
- On success → redirect to /dashboard
- Error + loading states required

/signup
- Functional signup form
- Calls real auth API
- On success → redirect to /dashboard
- Error + loading states required

----------------------------------
REQUIRED PAGES (ALL MUST WORK)

1. /dashboard
2. /documents
3. /reviews
4. /reviews/[id]
5. /rubrics
6. /formatting
7. /writing-tools
8. /ai-detector
9. /humanizer
10. /utilities
11. /settings
12. /help

----------------------------------
CRITICAL BEHAVIOR RULE

Each page MUST:
- Call its own API endpoint
- Fetch real data
- Render actual results

DO NOT:
- Redirect to dashboard
- Use static demo data
- Fake responses

----------------------------------
PAGE REQUIREMENTS

/dashboard
- Welcome: “Welcome back, Tyrese Morgan!”
- Upload card (connected to upload API)
- AI tools grid (links to pages)
- Recent reviews (real API data)
- Stats cards (real user data)
- Activity + deadlines (real or empty state)
- Must NOT be overcrowded

/documents
- Fetch user documents
- Show table/list
- Upload button triggers real upload flow

/reviews
- Fetch reviews from API
- Show scores, dates, types
- "View Report" links to /reviews/[id]

/reviews/[id]
- Fetch review detail from API
- Show:
  - extracted text preview
  - grammar feedback
  - clarity feedback
  - logic feedback
  - suggestions
- Must NOT redirect anywhere

/rubrics
- Upload rubric
- Select document
- Call rubric API
- Display results

/formatting
- Style selector: APA, MLA, Custom
- Call formatting API
- Show violations

/writing-tools
- Input text
- Tool selector (paraphrase, grammar, tone)
- Call API and show output

/ai-detector
- Input/upload
- Call detection API
- Show probability + explanation

/humanizer
- Input text
- Output rewritten version
- Side-by-side view

/utilities
- DOCX → PDF
- Merge PDF
- Split PDF
- Summarizer
- Paraphraser
- Each must call its own endpoint

/settings
- Profile info
- Theme selection
- Preferences

/help
- FAQ
- Support info
- Contact section

----------------------------------
TESTING (MANDATORY)

Run:
- npm run lint
- npm run build
- Playwright tests

Test:
- navigation between all pages
- API calls for each page
- light mode
- dark mode
- mobile + desktop

Capture screenshots:
- login
- signup
- dashboard (light)
- dashboard (dark)
- documents
- reviews
- review detail

----------------------------------
COMPLETION RULE

Do NOT mark tasks complete unless:
- page exists
- API is called successfully
- real data renders
- navigation works
- UI matches design
- theme toggle works
- no crashes