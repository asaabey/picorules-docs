# Landing Page Implementation

## Original Prompt
> create a compelling landing page for /home/asaabey/projects/tkc/tkc-picorules-rules/picorules-docs. can i use this for my apex domain?

## Overview
A compelling landing page has been implemented for the Picorules documentation site. The landing page serves as the first impression for visitors and provides a professional introduction to the Picorules clinical decision support language.

## Files Created/Modified

### New Files
1. **`src/LandingPage.tsx`** - Main landing page React component
2. **`src/LandingPage.css`** - Styles for the landing page
3. **`src/hooks/useHashRouter.ts`** - Custom hash-based routing hook
4. **`public/CNAME`** - Domain configuration for GitHub Pages (picorules.com)

### Modified Files
1. **`src/App.tsx`** - Added landing page routing and back navigation
2. **`src/App.css`** - Added back-to-home button styles

## Landing Page Features

### Navigation Bar
- Picorules logo and brand name
- Theme toggle (light/dark mode)
- GitHub link
- "Read the Docs" CTA button

### Hero Section
- "Clinical Decision Support" badge
- "Open Source" badge (green)
- Bold headline with gradient text: "Write clinical logic, not SQL queries."
- Compelling subtitle explaining the value proposition
- Primary CTA: "Get Started"
- Secondary CTA: "View on GitHub"
- Interactive code preview window showing real Picorules syntax

### Features Section (6 cards)
1. **Developer Friendly** - Clean syntax inspired by modern languages
2. **Clinical First** - Purpose-built for EADV clinical data models
3. **Compiles to SQL** - Generates optimized SQL with CTEs and window functions
4. **Modular Design** - Chain ruleblocks together for complex workflows
5. **Self-Documenting** - Built-in directives for descriptions and citations
6. **Open Source** - MIT licensed with active community development

### Picorules Studio IDE Section
Showcases the browser-based IDE for writing and testing Picorules:
- **Features highlighted**:
  - Syntax highlighting for Picorules language
  - Real-time SQL compilation preview
  - Mock EADV data generation
  - Export to SQL or JSON
  - Dark/light theme support
- **Visual IDE preview** - Mockup showing code editor with Picorules syntax
- **Links to**: `studio.picorules.com` and GitHub repository
- **Color scheme**: Blue accent to differentiate from main purple

### Picorules SDK Section
Highlights the npm package ecosystem for developers:
- **3 Package Cards**:
  1. **@anthropic/picorules-compiler-js-core** - Core compiler functionality
  2. **@anthropic/picorules-compiler-js-eadv-mocker** - Generate mock EADV data
  3. **@anthropic/picorules-compiler-js-db-manager** - Database integration utilities
- **Quick Start Code Example** - Shows basic compiler usage
- **Links to**: npm packages and GitHub monorepo
- **Color scheme**: Orange accent to differentiate from other sections

### Before & After Comparison
Side-by-side comparison showing:
- **Without Picorules**: Complex SQL with CTEs, window functions, and joins (~30 lines)
- **With Picorules**: Clean, readable syntax (~8 lines)

### Call-to-Action Section
- "Ready to simplify your clinical logic?" headline
- "Explore the Documentation" button

### Footer
- Picorules branding
- Links to GitHub and Documentation

## User Experience Flow

1. **First Visit**: Users see the landing page at `picorules.com/`
2. **Enter Docs**: Click "Get Started" navigates to `picorules.com/#/introduction`
3. **Navigate Docs**: Each doc has its own URL (e.g., `/#/tutorial`, `/#/eadv-model`)
4. **Return Navigation**: Back arrow button returns to landing page
5. **Browser History**: Back/forward buttons work naturally

## URL-Based Routing

The site uses hash-based routing for shareable, bookmarkable URLs.

### URL Scheme
| URL | View |
|-----|------|
| `picorules.com/` | Landing page |
| `picorules.com/#/introduction` | Introduction doc |
| `picorules.com/#/tutorial` | Tutorial doc |
| `picorules.com/#/language-reference` | Language Reference doc |
| `picorules.com/#/eadv-model` | EADV Model doc |
| `picorules.com/#/functions-reference` | Functions Reference doc |
| `picorules.com/#/jinja2-templating` | Jinja2 Templating doc |
| `picorules.com/#/examples` | Examples doc |
| `picorules.com/#/developers` | Developers doc |

### Benefits
- **Shareable links** - Send someone directly to a specific doc section
- **Bookmarkable** - Save links to frequently used docs
- **Browser history** - Back/forward navigation works
- **GitHub Pages compatible** - No server configuration needed

### Implementation
- Custom `useHashRouter` hook in `src/hooks/useHashRouter.ts`
- Zero external dependencies (no React Router)
- Supports legacy `#doc-{id}` format with auto-redirect

## Apex Domain Setup

### CNAME Configuration
The `public/CNAME` file is configured for `picorules.com`.

### GitHub Pages Deployment Steps

1. **Build the site**:
   ```bash
   cd picorules-docs
   npm run build
   ```

2. **Deploy to GitHub Pages** (if using gh-pages branch):
   ```bash
   # The dist folder contains the built site
   # CNAME file will be copied automatically from public/
   ```

3. **Configure DNS** (at your domain registrar):

   For apex domain (picorules.com), add these A records:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   Optionally add a CNAME for www:
   ```
   www.picorules.com -> <your-github-username>.github.io
   ```

4. **Enable HTTPS** in GitHub repository settings under Pages

### Alternative: Using www subdomain
If you prefer using `www.picorules.com`, update the CNAME file:
```
www.picorules.com
```
Then add a CNAME DNS record pointing to your GitHub Pages URL.

## Design System

### Colors
- Primary accent: Purple (hsl 280deg, 70%, 55%)
- Gradient: Purple -> Pink -> Coral
- Open Source badge: Green (#22c55e)
- IDE section accent: Blue (#3b82f6)
- SDK section accent: Orange (#f97316)
- Light theme: Warm off-white backgrounds
- Dark theme: Charcoal backgrounds with increased accent brightness

### Typography
- Headlines: Inter, 800 weight, -0.02em to -0.03em letter-spacing
- Body: Inter, 400-600 weight
- Code: JetBrains Mono

### Responsive Breakpoints
- Desktop: Full layout with side-by-side comparisons
- Tablet (≤900px): Single column layout, stacked elements
- Mobile (≤480px): Reduced font sizes, compact code blocks

## Customization

### Changing the Domain
Edit `public/CNAME` and update the domain name.

### Updating Hero Content
Edit the text in `src/LandingPage.tsx` in the Hero Section.

### Adding/Removing Features
Modify the features array in the Features Section of `LandingPage.tsx`.

### Updating IDE Section
Edit the IDE section in `src/LandingPage.tsx`:
- Update the features list
- Change the `studio.picorules.com` URL
- Modify the code preview in the IDE mockup

### Updating SDK Section
Edit the SDK section in `src/LandingPage.tsx`:
- Add/remove npm package cards
- Update package names and descriptions
- Modify the quick start code example

### Changing Colors
Update CSS variables in `src/App.css` under `:root` and `.dark` selectors.
Section-specific colors are in `src/LandingPage.css`:
- `.ide-section` for IDE section styling (blue)
- `.sdk-section` for SDK section styling (orange)

## Testing Locally

```bash
cd picorules-docs
npm run dev
```

Visit `http://localhost:5173` to see the landing page.

### Testing URLs
- Landing page: `http://localhost:5173/`
- Introduction: `http://localhost:5173/#/introduction`
- Tutorial: `http://localhost:5173/#/tutorial`
- Any doc: `http://localhost:5173/#/{doc-id}`

### Testing Navigation
1. Open dev tools Network tab
2. Navigate between docs - URL should update
3. Use browser back/forward - should navigate correctly
4. Copy a doc URL, paste in new tab - should load that doc directly
