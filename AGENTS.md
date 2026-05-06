Here’s your **updated AGENTS.md** with Gemini fully integrated for rubric-based reviews. I kept your structure intact and only inserted what’s necessary (no overreach, per your rules).
Source: 

---

# AGENTS.md (TanStack Version — Updated)

## Project Overview

**Project:** SmartReview AI — AI platform to review, improve, and prepare academic assignments

**Target user:** Students, educators
**Skill level:** Intermediate

**Stack:** React + TanStack Router + TanStack Query + Node/FastAPI + PostgreSQL + Cloudinary + OpenAI (+ **Gemini**) + TailwindCSS

---

## Commands

Install: `npm install` / `pip install -r requirements.txt`
Dev: `npm run dev` / `uvicorn main:app --reload`
Build: `npm run build`
Test: `npm test` / `pytest`
Lint: `npm run lint` / `ruff check .`

---

## Agent Autonomy

Use judgment to complete the user’s intended goal, not only the checklist.

If a task requires supporting work, do it:

* create missing routes (TanStack Router)
* wire loaders/actions
* fix broken flows
* add validation
* improve UX where obvious

A task is complete only when usable (see Validation Rules).

Ask only when:

* product direction changes
* paid dependency needed
* security/data risk exists
* requirements unclear

---

## Architecture (TanStack)

Frontend → TanStack Router → TanStack Query → API → Services → Storage

---

## Services

* AI Orchestrator
* Document Processor
* Formatting Analyzer
* Utilities Engine
* Auth Service
* Realtime Service (WebSockets)

---

## Subagents (MANDATORY)

### auth_agent

JWT, session persistence, route protection

### ai_agent

Prompting, structured outputs, retries, **provider routing (Gemini required for rubric reviews)**

### parser_agent

File parsing, text extraction

### formatter_agent

APA/MLA validation

### design_agent

UI consistency

### realtime_agent

WebSockets + live updates

### utils_agent

File tools, conversions

### qa_agent

Testing and validation

---

## Task System

Maintain `/tasks.md`.

### Rules

* Every feature = task
* Update only after validation
* Add missing tasks
* Uncheck broken ones

---

## Validation Rules (SMART)

### 1. Change Classification

#### A. Small UI Fix

* spacing, padding, colors

#### B. Interaction Change

* dropdowns
* modals
* navigation

#### C. Feature / Logic Change

* auth
* upload
* review flow
* API integration

---

### 2. Required Testing

#### A. Small UI Fix

* `npm run lint`
* `npm run build`

#### B. Interaction Change

* lint + build
* minimal manual test

#### C. Feature Change

* `npm test`
* lint + build
* E2E where applicable

---

### 3. UI Fix Rule (CRITICAL)

* implement only requested fix
* keep changes scoped
* do not redesign
* do not modify unrelated areas
* provide file summary

---

### 4. Completion Rules

#### UI Fix

* code updated
* build passes

#### Interaction

* works correctly
* routing intact

#### Feature

* works end-to-end
* no crashes

---

## Core Features

### Review

Grammar, clarity, logic + rubric scoring (**handled by Gemini**)

### Rubric

Criteria-based scoring + recommendations (**Gemini**)

### Formatting

APA / MLA validation

### Writing Tools

Paraphrasing, tone, grammar

### Humanization

Rewrite AI-like text

### AI Detection

Probability + explanation

### Utilities

File conversion, citations

---

## AI Rules (STRICT)

* No hallucinations
* No assumptions without validation
* Always structured outputs
* Validate before use
* Retry invalid responses
* Sanitize inputs

### Provider Routing (MANDATORY)

* **Gemini MUST be used for:**

  * Document review
  * Rubric scoring
  * Writing evaluation
  * Formatting feedback

* OpenAI may be used for:

  * lightweight utilities
  * summarization
  * fallback only

### Rubric Evaluation Contract (CRITICAL)

All rubric-based evaluations MUST:

* Use Gemini
* Return **strict JSON only**
* Follow defined schema
* Be validated before use
* Retry if invalid

Example structure:

```json
{
  "scores": {
    "clarity": number,
    "structure": number,
    "argument": number,
    "grammar": number
  },
  "feedback": {
    "clarity": string,
    "structure": string,
    "argument": string,
    "grammar": string
  },
  "summary": string
}
```

AI MUST NOT:

* return plain text
* mix text + JSON
* skip rubric fields

---

## Code Rules

* No hardcoded values
* No secrets in code
* Use env variables
* Keep code modular

---

## Security

* JWT authentication
* Input validation
* File validation
* Safe error handling
* Prevent prompt injection

---

## Realtime

* WebSockets for live updates
* Polling fallback

---

## Performance Rules

* Use TanStack Query caching
* Avoid unnecessary refetching
* Keep layout persistent
* Avoid re-renders

---

## Navigation Rules

* Use TanStack Router navigation
* No full reloads
* No `window.location.href`
* Each route fetches its own data

---

## Theme Rules

* Persist via localStorage or backend
* Apply globally
* Must not reset on navigation
* Toggle in user menu

---

## Testing Philosophy

* Deep test for features
* Light test for UI
* Do not over-test trivial changes
* Do not skip critical validation

---

## Final Principle

Build like a developer, not a checklist executor.

* Think
* Fix
* Keep scope controlled
* Validate appropriately
* Don’t overcorrect

