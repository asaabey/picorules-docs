import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';

// Import a reviewable snapshot; builds do not depend on the sibling checkout.
const root = fileURLToPath(new URL('../', import.meta.url));
const localSource = path.join(root, 'src/docs');
const source = existsSync(localSource) ? localSource : path.resolve(root, '../picorules-docs/src/docs');
const index = await readFile(path.join(source, 'index.ts'), 'utf8');
const imports = new Map(
  [...index.matchAll(/import (\w+) from '\.\/([^']+)\?raw';/g)]
    .map(([, name, file]) => [name, file]),
);
const entries = [...index.matchAll(
  /\{\s*id: '([^']+)',\s*title: '([^']+)',\s*description: '([^']+)',\s*content: (\w+),?\s*\}/g,
)].map(([, id, title, description, name]) => {
  const file = imports.get(name);
  if (!file) throw new Error(`Missing source import for ${id}`);
  return { id, title, description, file };
});
if (entries.length !== imports.size) {
  throw new Error(`Parsed ${entries.length} pages for ${imports.size} imports; review index.ts.`);
}

const byId = new Map(entries.map((entry) => [entry.id, entry]));
const byFile = new Map(entries.map((entry) => [entry.file, entry]));
const destination = path.join(root, 'src/content/docs/docs');
await mkdir(destination, { recursive: true });

for (const entry of entries) {
  let markdown = await readFile(path.join(source, entry.file), 'utf8');
  // Starlight supplies the page title from frontmatter.
  markdown = markdown.replace(/^# [^\n]+\n+/, '');
  markdown = markdown.replace(/(\]\()([^\s)]+)(\))/g, (match, start, target, end) => {
    const hashId = target.replace(/^#\/?(?:doc-)?/, '');
    if (target.startsWith('#') && byId.has(hashId)) {
      return `${start}/docs/${hashId}/${end}`;
    }
    const [file, anchor] = target.replace(/^\.\//, '').split('#');
    const linked = byFile.get(file);
    if (linked) return `${start}/docs/${linked.id}/${anchor ? `#${anchor}` : ''}${end}`;
    return match;
  });
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(entry.title)}`,
    `description: ${JSON.stringify(entry.description)}`,
    '---',
    '',
  ].join('\n');
  await writeFile(path.join(destination, `${entry.id}.md`), frontmatter + markdown);
}

await mkdir(path.join(root, 'src/data'), { recursive: true });
await writeFile(
  path.join(root, 'src/data/docs.json'),
  JSON.stringify(entries, null, 2) + '\n',
);
await mkdir(path.join(root, 'public/references'), { recursive: true });
await copyFile(
  path.resolve(source, '../../picorules-language-reference.md'),
  path.join(root, 'public/references/picorules-language-reference.md'),
);
console.log(`Imported ${entries.length} documentation pages and the AI language reference from picorules-docs.`);
