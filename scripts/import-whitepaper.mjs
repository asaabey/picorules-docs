import { readFile, readdir, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

// Import a reviewable snapshot. Normal site builds need neither Pandoc nor the source repo.
const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.resolve(root, '../picorules-whitepaper/whitepaper');
const sections = (await readdir(path.join(source, 'sections')))
  .filter((file) => /^\d{2}-.+\.md$/.test(file)).sort();
if (sections.length !== 14 || sections.some((file, i) => Number(file.slice(0, 2)) !== i + 1)) {
  throw new Error('Expected the abstract and 13 manuscript sections in order.');
}
const manuscript = await Promise.all(sections.map((file) => readFile(path.join(source, 'sections', file), 'utf8')));
const template = await readFile(path.join(source, 'template.tex'), 'utf8');
const acknowledgements = template.match(/\\section\*\{Acknowledgements\}\s*([\s\S]+?)\\begingroup/)?.[1].trim();
if (!acknowledgements) throw new Error('Missing manuscript acknowledgements.');

// Pandoc resolves the manuscript's BibTeX citations and creates linked references.
const rendered = execFileSync('pandoc', [
  '--from=markdown', '--to=gfm', '--wrap=none', '--citeproc',
  `--bibliography=${path.resolve(source, '../shared/references.bib')}`,
  '--metadata=link-citations:true', '--shift-heading-level-by=1',
], { input: manuscript.join('\n\n') + '\n\n# Acknowledgements\n\n' + acknowledgements, encoding: 'utf8' });
if (!rendered.includes('<div id="refs"') || rendered.includes('citation-not-found')) {
  throw new Error('The manuscript bibliography did not resolve.');
}
const body = rendered.replace('<div id="refs"', '## References\n\n<div id="refs"');
// Title-page details match whitepaper/template.tex.
const frontmatter = `---
title: 'Picorules: Composing Computable Clinical Phenotypes'
description: 'The Picorules whitepaper on reusable clinical constructs, phenotype composition, execution paths, and the Territory Kidney Care experience.'
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 2
pagination: false
---

*Reusable clinical constructs from the warehouse to the consultation*

**Asanga Sanjaya Abeyaratne** · Creator and Lead Developer, Picorules

Working paper · Draft for review · September 2026

[Download the whitepaper (PDF)](/whitepaper/picorules-whitepaper.pdf) · [View the manuscript source](https://github.com/asaabey/picorules-whitepaper/tree/master/whitepaper)

---

`;
await mkdir(path.join(root, 'src/content/docs/docs'), { recursive: true });
await mkdir(path.join(root, 'public/whitepaper'), { recursive: true });
await writeFile(path.join(root, 'src/content/docs/docs/whitepaper.md'), frontmatter + body);
await copyFile(path.join(source, 'whitepaper.pdf'), path.join(root, 'public/whitepaper/picorules-whitepaper.pdf'));
console.log(`Imported ${sections.length} whitepaper sections, linked references, acknowledgements, and PDF.`);
