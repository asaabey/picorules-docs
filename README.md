# Picorules — Astro website and documentation

The Picorules landing page and documentation, built with Astro and Starlight.
This repository replaces the former React site on the existing Netlify project.
The former application is retained at the Git tag `legacy-react-site-2026-10-04`.

The landing page centres on phenotype modelling, with Newsreader headings,
DM Sans body text, warm ivory, deep green, and a simple composition diagram.
Both fonts are served locally. The documentation uses Starlight with a matching
theme, full-text search, 13 imported chapters, and the complete whitepaper.

The landing page includes the compiler's npm install command and links to its
package, source, SDK documentation, and published companion packages.
It also includes a SQL/Picorules comparison, downloadable compiled SQL, a runnable
JavaScript example, a Studio overview, integration notes, project origins, evidence
links, and the single-file reference for AI agents. Longer examples and technical
details are expandable. Light and dark themes share the documentation's preference.

A faint SVG network sits behind the hero. Nearby forms gently follow the mouse,
then settle back into place. It is static on touch devices and with reduced
motion enabled, and does not animate continuously or intercept clicks.

## Develop

Requires Node.js 22.12+ (use an even-numbered release).

```bash
cd picorules-docs
npm ci
npm run dev
```

Open the URL printed by Astro. The default development port is 4321.

```bash
npm run check
npm run build
npm run preview
```

## Main files

- `src/pages/index.astro`: landing page content and responsive layout.
- `src/styles/global.css`: shared colours, typography, and basic styles.
- `src/components/PhenotypeFigure.astro`: accessible, static SVG illustration.
- `src/components/PhenotypeBackdrop.astro`: subtle interactive hero backdrop.
- `src/components/LanguageExample.astro`: SQL comparison and actual compiled output.
- `src/components/BrowserExample.astro`: runnable synthetic-data JavaScript example.
- `src/components/StudioSection.astro`: Studio overview and illustrative workspace.
- `public/examples/`: complete ruleblock and generated PostgreSQL output.
- `src/content/docs/docs/whitepaper.md`: searchable whitepaper snapshot with citations.
- `public/whitepaper/picorules-whitepaper.pdf`: downloadable manuscript PDF.
- `src/styles/docs.css`: Starlight documentation theme.
- `src/content/docs/docs/`: the documentation snapshot.
- `astro.config.mjs`: static output, navigation, search, and site configuration.

The landing-page positioning draws on
`../picorules-whitepaper/whitepaper/sections/01-abstract.md` and
`02-the-problem.md`: observations supply evidence, constructs define reusable
characteristics, and phenotype definitions compose clinical descriptions.
The illustration is conceptual and contains no diagnostic criteria.

## Documentation snapshot

The existing numbered documentation files are imported without changing their
technical content. The import adds Starlight frontmatter, removes the duplicate
page title, and adapts links between chapters to `/docs/<chapter>/`.

```bash
npm run docs:import
```

This refreshes the rendered snapshot from the preserved `src/docs/` authoring files.
Update those files first when refreshing technical documentation. Builds use the
checked-in snapshot and do not need an import step.
The import also refreshes `public/references/picorules-language-reference.md`.

Existing `/#/introduction`, `/#doc-introduction`, and `/#introduction` links resolve
to `/docs/introduction/` on the new site. Landing-page section anchors remain local.

## Whitepaper snapshot

The complete whitepaper is available at `/docs/whitepaper/` under **Research &
background** in the sidebar. The web edition preserves all 14 manuscript sections,
linked citations, references, acknowledgements, authorship, and draft status. Its
table of contents shows the main sections; code examples use the docs code renderer.
The PDF download is a copy of the existing manuscript PDF.

To refresh both snapshots from the sibling `picorules-whitepaper` checkout:

```bash
npm run whitepaper:import
```

The import requires Pandoc with citeproc. Rebuild the manuscript's PDF in its source
repository before importing if its content has changed. Normal site builds use the
snapshots and require neither Pandoc nor the sibling checkout. The whitepaper import
is separate from `docs:import`, which leaves the whitepaper in place.

## Landing-page example

`renal_measurements.prb` summarises the latest and lowest recorded eGFR, without
classifying disease. Two synthetic observations (44, then 52) evaluate to
`{ egfr_latest: 52, egfr_lowest: 44, renal_measurements: 1 }`. The browser loads the
compiler package only when the example is run. Its dependency is pinned to 1.1.1.

To regenerate the downloadable SQL from the complete ruleblock:

```bash
cd ../picorules-agent
node scripts/compile.mjs ../picorules-docs/public/examples/renal_measurements.prb postgresql > ../picorules-docs/public/examples/renal_measurements.postgresql.sql
```

The ruleblock has been compiled for PostgreSQL, MSSQL, and Oracle and evaluated
against synthetic and empty inputs in JavaScript. Generated SQL is not a claim of
database execution or clinical validation.

## Netlify deployment

The existing `picorules-docs` Netlify project deploys the `master` branch of this
repository. Keep these settings:

- Base directory: repository root.
- Build command: `npm run build`.
- Publish directory: `dist`.
- Node.js: 24, configured in `netlify.toml`.

No Netlify adapter is needed for this static build. The existing Netlify project
serves `picorules.com`, `www.picorules.com`, and `docs.picorules.com`.
The existing `.org` domain forwarding points visitors to `picorules.com`.

The production context in `netlify.toml` sets `PUBLIC_SITE_URL=https://picorules.com`
for canonical URLs, sitemap, and sharing metadata and `PUBLIC_SITE_PREVIEW=false`
to permit indexing. Branch deployments and deploy previews remain `noindex`.
Local builds default to preview mode and a localhost URL.

Old hash-based documentation URLs redirect in the browser to the new docs routes.
`/docs` opens the introduction, and `/picorules-language-reference.md` redirects to
the single-file reference at `/references/picorules-language-reference.md`.

For an immediate rollback, restore the previous production deploy in Netlify.
The previous deploy ID is `69d35e5d75469100084c89a2`; its source commit is
`75282d57a325e2466b766935c6718da7ed78b561`. Revert the Astro migration commit
if subsequent automatic builds should continue serving the previous application.
