# SmartReview AI

SmartReview AI is a Next.js app for reviewing academic assignments with a dashboard UI, JWT auth, upload/review APIs, and a production-mode Node server.

## Requirements

- Node.js 22+
- npm 10+
- A `.env` file in the project root

## Environment

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
USE_CLOUDINARY=false
CLOUDINARY_UPLOAD_FOLDER=smartreview-ai/uploads
LIBREOFFICE_PATH=
UPLOAD_MAX_BYTES=52428800
TEXT_MAX_CHARS=12000
JWT_EXPIRES_IN=3600
```

## Install

```powershell
npm install
```

## Start the app

Run the local server:

```powershell
npm run dev
```

The app starts on `http://127.0.0.1:3000` by default.

For production-style startup:

```powershell
npm run build
npm start
```

## Test

Run the automated test suite:

```powershell
npm test
```

Run lint:

```powershell
npm run lint
```

## What is included

- Dashboard UI with light and dark mode
- JWT signup and login routes
- Protected upload, review, and tools APIs
- WebSocket progress updates and polling fallback
- Summary and paraphrase utilities
- Cloudinary-backed upload storage when `USE_CLOUDINARY=true`
- PDF merge/split utilities using real PDF output validation
- DOCX to PDF conversion endpoint when LibreOffice headless is installed and configured
- Prisma Neon adapter with direct URL support for CLI operations

## Notes

- The app uses `server.js` for both development and production startup.
- The production E2E smoke test is in `tests/e2e-smoke.mjs`.
