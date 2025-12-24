# Hostinger deployment (Node.js)

This project is a **Vite (React)** SPA + a **Node/Express** server (`server.cjs`) that:
- serves the built frontend from `dist/`
- exposes API endpoints under `/api/*`

## What to upload
Upload the **entire repository** (recommended) OR at minimum:
- `dist/`
- `server.cjs`
- `package.json` + `package-lock.json`
- `public/` (optional; assets should already be in `dist/` after build)

> Note: `dist/` is committed/kept intentionally for deployment.

## Hostinger setup
1. In Hostinger, create a **Node.js app**.
2. Select a Node version **>= 18**.
3. Set **Application startup file** to:
   - `server.cjs`
4. Set **Install command** to:
   - `npm install`
5. Set **Run command** to:
   - `npm start`

### Environment variables
- `PORT` is provided by Hostinger automatically.
- (Recommended) Set `JWT_SECRET` to a long random value.

## Build behavior
This repo has a `postinstall` hook:
- `postinstall: npm run build`

So on Hostinger:
- `npm install` will automatically build `dist/`.

## Smoke test locally
```bash
npm install
npm run build
npm start
```
Then open `http://localhost:3000` (or the `PORT` you set).

