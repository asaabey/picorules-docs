# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**Picorules Documentation Site** — a React + TypeScript SPA that renders interactive documentation for the Picorules clinical decision support language. This is a **visualization layer only**; the source of truth for documentation content lives in the parent `tkc-picorules-rules` repository's CLAUDE.md.

## Commands

```bash
npm run dev       # Start dev server (localhost:5173, HMR enabled)
npm run build     # TypeScript check + Vite production build → dist/
npm run lint      # ESLint
npm run preview   # Serve production build locally
```

No test framework is configured.

## Architecture

### Routing & Pages

The app uses a custom hash-based router (`src/hooks/useHashRouter.ts`) with two route types:
- **Landing page** (`/` or no hash) — rendered by `LandingPage.tsx`, a marketing-style page with IDE and SDK sections
- **Documentation reader** (`#/{docId}`) — rendered by `App.tsx`, sidebar + markdown content viewer

Legacy `#doc-{id}` URLs are auto-redirected to `#/{id}`.

### Documentation Content Pipeline

Markdown files in `src/docs/` are imported as raw strings via Vite's `?raw` suffix and registered in `src/docs/index.ts` as a `DocPage[]` array. The `DocPage` interface defines `id`, `title`, `description`, and `content` fields.

Current docs (numbered for ordering):
`01-introduction.md` through `08-developers.md`

**To add a new doc page**: create the `.md` file, import it with `?raw` in `src/docs/index.ts`, and add an entry to the `docs` array.

### Key Components

- **`App.tsx`** — Main docs reader: sidebar navigation with search filtering, `react-markdown` content rendering (with `remark-gfm`), dark/light theme toggle (persisted to localStorage), build number display
- **`LandingPage.tsx`** — Standalone landing page component
- **`src/buildInfo.ts`** — Manual build number in `{year}.{month}.{build}` format

### Styling

Plain CSS with BEM-like naming: `index.css` (global/reset), `App.css` (docs reader), `LandingPage.css` (landing page). Dark mode via `.dark` class on `<html>`.

## Important Constraints

- **Do not treat this repo as the source of truth** for Picorules documentation. Update the parent repo's CLAUDE.md first, then regenerate the markdown files here.
- Old doc files (`overview.md`, `language.md`, `ruleblocks.md`, `templates-and-development.md`) still exist in `src/docs/` but are **not imported** — the active docs are the numbered `01-` through `08-` files.
- `dist/` is gitignored build output.
