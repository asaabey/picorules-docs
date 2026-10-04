# Picorules website

Astro static landing page and Starlight documentation, deployed from this
repository's `master` branch to the existing `picorules-docs` Netlify project.

Run `npm run check` and `npm run build` to validate changes. `npm run dev` and
`npm run preview` bind to `0.0.0.0`. Generated `dist/` and `.astro/` are ignored.

The landing page is `src/pages/index.astro`; reusable components are in
`src/components/`. Shared styles are in `src/styles/`. Keep the spacious ivory
and forest palette, locally served Newsreader and DM Sans, and phenotype focus.

The 13 numbered authoring chapters remain in `src/docs/`, registered in
`src/docs/index.ts`. `npm run docs:import` refreshes their Starlight snapshots in
`src/content/docs/docs/` and the AI reference in `public/references/`. Follow the
authoritative Picorules rule documentation and compiler semantics when updating
technical content. The four unnumbered legacy Markdown files are not imported.

The whitepaper is maintained in the sibling `picorules-whitepaper` repository.
`npm run whitepaper:import` requires Pandoc and copies its full web edition and
PDF into this repository. Normal site builds use snapshots and need no sibling
repositories. Keep authorship, citations, acknowledgements, and draft status.

Production indexing and canonical URLs are configured in `netlify.toml`;
previews stay `noindex`. Preserve legacy hash redirects and the separate Studio
links. Clinical validation and software test evidence must remain distinct.

The former React site is preserved at tag `legacy-react-site-2026-10-04`.
See README.md for deployment and rollback details.
