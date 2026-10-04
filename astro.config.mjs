import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Set PUBLIC_SITE_URL to the new site's own URL when deploying the parallel site.
const site = process.env.PUBLIC_SITE_URL || process.env.DEPLOY_PRIME_URL || process.env.URL;
const preview = process.env.PUBLIC_SITE_PREVIEW !== 'false';

export default defineConfig({
  site: site || 'http://localhost:4322',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'The Picorules Book',
      description: 'The language, concepts, and tools for modelling clinical phenotypes.',
      favicon: '/favicon.svg',
      disable404Route: true,
      expressiveCode: {
        shiki: { langAlias: { jinja2: 'jinja', env: 'dotenv', picorules: 'text' } },
      },
      customCss: ['./src/styles/docs.css'],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/asaabey/picorules-compiler-js-core' }],
      head: preview ? [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' } }] : [],
      sidebar: [
        { label: 'Back to Picorules', link: '/' },
        {
          label: 'Getting started',
          items: ['docs/introduction', 'docs/tutorial', 'docs/examples'],
        },
        {
          label: 'Language & data',
          items: ['docs/language-reference', 'docs/eadv-model', 'docs/functions-reference', 'docs/jinja2-templating'],
        },
        {
          label: 'Platforms & tools',
          items: ['docs/architecture', 'docs/fhir-integration', 'docs/openehr-integration', 'docs/picorules-studio', 'docs/ecosystem', 'docs/developers'],
        },
        {
          label: 'Research & background',
          items: [{ label: 'Whitepaper', slug: 'docs/whitepaper' }],
        },
      ],
    }),
  ],
});
