# Hostinger Node.js deployment

This app runs as a **single Node.js server** (`server.cjs`) that serves:
- the React frontend from `dist/`
- API routes from `/api/*` (login, clients, cases, etc.)

## What to deploy
Recommended: deploy the **whole repository**.

Minimum required files:
- `server.cjs` (startup file)
- `package.json` and `package-lock.json`
- `dist/` (created by `npm run build`)

> Don’t move `index.html` out of `dist/`. Vite builds the production HTML into `dist/index.html`.

## Quick steps (Hostinger Panel)
1. Push your project to GitHub.
2. In Hostinger → **Websites** → **Manage** → **Node.js**:
   - **Node Version**: 18+
   - **Application root**: repository root
   - **Application startup file**: `server.cjs`
   - **Install command**: `npm install`
   - **Run command**: `npm start`
3. Add environment variables (recommended):
   - `JWT_SECRET` = any long random string
   - (Hostinger provides `PORT` automatically)
4. Restart the Node.js app from the Hostinger panel.

## Build behavior on Hostinger
This repo includes:
- `postinstall: npm run build`

That means Hostinger will automatically build the frontend during `npm install`.

## Local Hostinger-like smoke test
In PowerShell:
- `./deployment/hostinger-smoke-test.ps1`

This runs: install → build → start → checks UI + login API.

## Common problems
- **Login not working / Request failed**: usually the server isn’t started with `server.cjs`.
- **Blank page**: `dist/` missing or build failed.
- **Wrong startup file**: using `production-server.js` serves UI only (no `/api`).
