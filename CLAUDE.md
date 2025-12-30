# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains the **Picorules Documentation Site**, a React-based web application that provides interactive documentation for the Picorules clinical decision support language used in the TKC (The Kidney Centre) system.

### Purpose

This is a **documentation frontend** that presents Picorules language specifications, syntax reference, and development best practices in an accessible, searchable web interface. The documentation content is derived from the parent `tkc-picorules-rules` repository's CLAUDE.md file.

### Technology Stack

- **Framework**: React 19.2.0 with TypeScript 5.9.3
- **Build Tool**: Vite 7.2.4
- **Key Dependencies**:
  - `react-markdown` (v10.1.0) - Markdown rendering with React components
  - `remark-gfm` (v4.0.1) - GitHub Flavored Markdown support
- **Development Tools**:
  - ESLint 9.39.1 - Code quality
  - TypeScript ESLint - Type-safe linting
  - Vite plugin for React with Fast Refresh

## Repository Structure

```
picorules-docs/
├── src/
│   ├── docs/                    # Documentation content
│   │   ├── index.ts             # Documentation registry & types
│   │   ├── overview.md          # Picorules overview & architecture
│   │   ├── language.md          # Language syntax & patterns
│   │   ├── ruleblocks.md        # Working with ruleblocks
│   │   └── templates-and-development.md  # Templates & dev notes
│   ├── App.tsx                  # Main application component
│   ├── main.tsx                 # React entry point
│   ├── App.css                  # Application styles
│   ├── index.css                # Global styles
│   └── assets/                  # Static assets (icons, images)
├── public/                      # Public static files
│   └── vite.svg                 # Vite logo
├── dist/                        # Build output (generated)
├── node_modules/                # Dependencies (generated)
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript base config
├── tsconfig.app.json            # App-specific TypeScript config
├── tsconfig.node.json           # Node-specific TypeScript config
├── eslint.config.js             # ESLint configuration
├── package.json                 # Project metadata & dependencies
└── package-lock.json            # Locked dependency versions
```

## Application Architecture

### Component Structure

#### Main Application ([App.tsx](src/App.tsx))
The `App` component provides the core documentation browser interface:

**Features**:
1. **Sidebar Navigation**:
   - Displays all documentation topics
   - Search/filter functionality
   - Active topic highlighting

2. **Content Area**:
   - Renders selected documentation as markdown
   - Uses `react-markdown` with GFM support
   - Displays footer with metadata

**State Management**:
- `selectedDocId` - Currently selected documentation page
- `query` - Search filter text
- `filteredDocs` - Computed docs matching search query

**Key Behaviors**:
- Auto-switches to first visible doc if current selection is filtered out
- Real-time search filtering on title and description
- Markdown rendering with GitHub Flavored Markdown extensions

### Documentation Registry ([src/docs/index.ts](src/docs/index.ts))

**DocPage Interface**:
```typescript
interface DocPage {
  id: string;           // Unique identifier
  title: string;        // Display title
  description: string;  // Short summary for sidebar
  content: string;      // Full markdown content
}
```

**Documentation Pages**:
1. **overview** - "Picorules Overview"
   - High-level motivation, repository layout, core architecture

2. **language** - "Language & Syntax"
   - Statement types, compiler directives, idiomatic patterns

3. **ruleblocks** - "Working with Ruleblocks"
   - Naming conventions, update workflows, citation usage

4. **templates** - "Templates & Development Notes"
   - Template pack structure, development guardrails

**Import Pattern**: Documentation files are imported using Vite's `?raw` suffix to load markdown as string literals:
```typescript
import overview from './overview.md?raw';
```

## Documentation Content

The markdown files in [src/docs/](src/docs/) are structured to cover four main areas:

### 1. Overview ([overview.md](src/docs/overview.md))
- What Picorules is and why it exists
- Repository layout of the parent `tkc-picorules-rules` repo
- EADV model architecture concepts
- Compilation flow and ruleblock chaining

### 2. Language & Syntax ([language.md](src/docs/language.md))
- Two statement types: Functional (`=>`) and Conditional (`:`)
- Compiler directives (`#define_ruleblock`, `#define_attribute`, `#doc`)
- Common Picorules patterns and idioms
- Special operators and functions

### 3. Ruleblocks ([ruleblocks.md](src/docs/ruleblocks.md))
- File and output naming conventions
- Common ruleblock types (global, diagnostic, risk assessment)
- Variable naming conventions (`_ld`, `_last`, `is_*`, `cd_*`)
- Citation and documentation workflow
- Update workflow steps

### 4. Templates & Development ([templates-and-development.md](src/docs/templates-and-development.md))
- Template pack structure (`.json` + `.txt` pairs)
- Reusable frame templates
- Development principles and best practices
- Git workflow patterns
- Tooling integration

## Development Workflow

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint
```

### Development Server
- Runs on `http://localhost:5173` by default (Vite default)
- Hot Module Replacement (HMR) enabled
- Fast refresh for React components

### Build Process
1. TypeScript compilation (`tsc -b`)
2. Vite bundling and optimization
3. Output to `dist/` directory
4. Minified and optimized for production

## Styling Approach

The application uses CSS with BEM-like naming conventions:

**Key Classes**:
- `.docs-app` - Main application container
- `.sidebar` - Left navigation panel
  - `.sidebar__header` - Header with search
  - `.nav` - Navigation list
  - `.nav__item` - Individual navigation items
  - `.nav__item--active` - Active state
- `.content` - Main content area
- `.footer` - Footer with metadata

**Style Files**:
- [index.css](src/index.css) - Global styles and CSS reset
- [App.css](src/App.css) - Component-specific styles

## Working with This Repository

### Adding New Documentation Pages

1. **Create the markdown file** in [src/docs/](src/docs/):
   ```markdown
   # Page Title
   Content here...
   ```

2. **Import in index.ts**:
   ```typescript
   import newPage from './new-page.md?raw';
   ```

3. **Add to docs array**:
   ```typescript
   {
     id: 'new-page',
     title: 'Page Title',
     description: 'Short description for sidebar',
     content: newPage,
   }
   ```

### Updating Existing Documentation

1. Edit the relevant `.md` file in [src/docs/](src/docs/)
2. Save the file - HMR will auto-refresh in development
3. No code changes needed in TypeScript files

### Modifying Styles

1. For global styles: Edit [index.css](src/index.css)
2. For component styles: Edit [App.css](src/App.css)
3. Follow existing BEM-like naming patterns

### TypeScript Configuration

The project uses three TypeScript configs:
- [tsconfig.json](tsconfig.json) - Base configuration
- [tsconfig.app.json](tsconfig.app.json) - Application source code
- [tsconfig.node.json](tsconfig.node.json) - Vite config and build scripts

## Important Notes

### Content Source
- **DO NOT** treat this repository as the source of truth for Picorules documentation
- Content is **derived from** the parent `tkc-picorules-rules` repository's CLAUDE.md
- This is a **visualization layer** only
- When documentation needs updating, update the source CLAUDE.md first, then regenerate these markdown files

### Relationship to Parent Repository
- The parent repository is `/home/asaabey/projects/tkc/tkc-picorules-rules`
- This docs site is a sub-project within that repository
- The markdown files should be kept in sync with the parent CLAUDE.md

### Build Output
- The `dist/` directory is generated and should not be committed
- The `node_modules/` directory is managed by npm
- Both are excluded in [.gitignore](.gitignore)

### Vite Configuration
- Uses default Vite React plugin ([vite.config.ts](vite.config.ts))
- Minimal configuration - relies on Vite defaults
- Build output optimized automatically

### Markdown Rendering
- Uses `react-markdown` with `remark-gfm` plugin
- Supports GitHub Flavored Markdown features:
  - Tables
  - Task lists
  - Strikethrough
  - Autolinks
  - Code blocks with syntax highlighting

## Common Modifications

### Changing the Sidebar Title
Edit [App.tsx](src/App.tsx) line 38-42:
```tsx
<p className="eyebrow">TKC Picorules</p>
<h1>Documentation</h1>
<p className="subtitle">
  Summaries derived from the repository's CLAUDE.md guide.
</p>
```

### Customizing Search Behavior
Edit the `filteredDocs` useMemo in [App.tsx](src/App.tsx) lines 11-19 to change search logic.

### Adding Footer Information
Edit [App.tsx](src/App.tsx) lines 74-77:
```tsx
<footer className="footer">
  Generated from `CLAUDE.md`. Last updated today—refresh from source as
  the repository evolves.
</footer>
```

## Deployment

### Static Site Hosting
The built site (in `dist/`) is a static SPA and can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

### Build for Deployment
```bash
npm run build
# dist/ directory now contains deployable assets
```

### Preview Locally
```bash
npm run preview
# Serves the built dist/ directory
```

## Troubleshooting

### Build Errors
- Ensure TypeScript has no errors: `npx tsc --noEmit`
- Check ESLint: `npm run lint`
- Verify all markdown files exist and are properly imported

### HMR Not Working
- Restart the dev server
- Clear browser cache
- Check Vite server is running on correct port

### Markdown Not Rendering
- Verify markdown file is imported with `?raw` suffix
- Check `react-markdown` and `remark-gfm` are installed
- Ensure markdown content is valid

## Git Workflow

This repository appears to be a single-commit initial setup. When making changes:
1. Create feature branches for significant changes
2. Keep commits focused and descriptive
3. Test build before committing (`npm run build`)
4. Run linting before committing (`npm run lint`)

## References

- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [react-markdown Documentation](https://github.com/remarkjs/react-markdown)
- [remark-gfm Documentation](https://github.com/remarkjs/remark-gfm)
- Parent repository CLAUDE.md: `/home/asaabey/projects/tkc/tkc-picorules-rules/CLAUDE.md`
