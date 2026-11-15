# Blue Nebula website and interactive prototype

A dependency-free landing page and browser prototype for Blue Nebula, a proposed local-first AI workspace.

## Run locally

```powershell
npm run dev
```

Open http://127.0.0.1:4173. Requires Node 20 or later. No dependencies or installation needed.

The website has separate Product (`/product/`), How it works (`/how-it-works/`), Why local (`/why-local/`), and Prototype (`/prototype/`) pages. Direct loads and refreshes work on each route. Template links apply a starting screen once; later refreshes preserve your edits.

After editing a page fragment in `pages/`, shared navigation in `pages/site-shell.mjs`, or the home HTML, regenerate the static pages:

```powershell
npm run build
```

```powershell
npm test
```

## Deploy with Vercel

Import this GitHub repository as a new Vercel project. Use the repository root and the Other framework preset. The checked-in `vercel.json` runs `npm run build` and publishes `dist/`. The site needs no environment variables.

## Working features

- New opening scene with a sculpted blue surface, pointer response, scroll-driven separation into four labeled workspace layers, explicit scene controls, and a visible pause button. Its layout is authored in static HTML to reserve space before JavaScript loads.
- The actual editable prototype follows the opening scene, with concise problem/solution copy and a clear distinction between the browser prototype and planned desktop product.
- Dedicated guides with a live configuration-to-code/check example, an interactive data-boundary illustration, proposed hardware profiles, scope comparisons, and links into specific prototype views.
- Redesigned light prototype with one workspace rail, contextual view headings, a properties inspector, readable source/diff/memory/check surfaces, and a compact layout on phones.
- Supplied logo, white surfaces, blue accents, and an interactive CSS3D workspace model. Scroll, drag, keyboard rotation, layer selection, and pull-apart controls change its composition; mobile retains a static explanation with interactive layers.
- Coordinated headline/scroll reveals, a sliding product-tab indicator, incoming panel/dialog transitions, reversible disclosure animations, subtle pointer responses, and a refined navy closing section. Global pause and reduced motion retain functional controls.
- Interactive workflow panels and architecture hotspots open matching states in the working browser workspace.
- Full-screen workspace with welcome/dashboard/settings templates, editable properties, undo/redo, source files, checkpoint diffs, JSON project import/export, scoped/pinned example memory, and check-run history.
- The new hero is capped at 30 paints per second, 2,304 points on desktop or 1,152 on compact screens, and a 1.6 pixel ratio. It stops offscreen, hidden, paused, or covered by the workspace. The supporting paper model stops when idle and is available in a disclosure. These are rendering budgets, not measured frame-rate guarantees.
- Editable welcome card, color tokens, spacing, preview theme, and reset.
- Generated React JSX, clipboard copy, and component download.
- Searchable example project decisions and source dialogs.
- Real local fixture checks, including failure states, plus a JSON evidence export.
- Guided workflow with pause, resume, and reset.
- Hardware profile slider, mobile and desktop navigation, keyboard tabs, native resource dialogs, FAQs, and product brief download.

## Content boundaries

This implements the landing page and browser concept, not the desktop application described in the PRD. No AI calls, repository indexing, real code execution, backend signup service, or shipping installer are provided. Product capabilities, hardware support, and roadmap stages remain explicitly proposed. Canvas settings persist only in the current browser when storage is available.

## Files

- `dist/`: the entire generated static site, ready to serve.
- `pages/` and `build-pages.mjs`: authored guide content, shared navigation, and static page generation.
- `dist/content-pages.js` and `dist/guide-pages.css`: guide interactions and responsive presentation.
- `dist/prototype-ui.js`, `dist/prototype-ui.css`, and `dist/prototype-core.mjs`: editor presentation and validated launch links.
- `dist/core.mjs`: pure state, JSX, fixture verification, and hardware selection.
- `dist/app.js`: browser interactions, dialogs, downloads, local preferences.
- `dist/motion-core.mjs`: tested scroll states and particle morph geometry.
- `dist/editorial-core.mjs` and `dist/editorial-scene.js`: current paper-layer geometry, direct manipulation, and scroll controller.
- `dist/editorial.css`: paper-model styling and supporting light palette.
- `dist/startup-landing.js` and `dist/startup.css`: current startup page composition, disclosures, typography, and responsive presentation.
- `dist/studio-core.mjs` and `dist/studio.js`: project validation, history, diffs, and the full-screen workspace.
- `dist/landing-explorer.js`: workflow and architecture interactions.
- `dist/premium-motion.js` and `dist/premium.css`: coordinated entrances, scroll reveals, bounded pointer responses, tab/panel/dialog transitions, and cancellable native disclosure animations.
- `pages/hero.mjs`, `dist/nebula-core.mjs`, `dist/nebula-hero.js`, and `dist/nebula.css`: static opening composition, tested geometry/mode policy, and the bounded canvas renderer.
- `dist/motion.css`: supporting artwork animation and accessible fallbacks.
- `server.mjs`: loopback-only development server with a bounded static root.
- `vercel.json`: static build and output settings for Vercel.

Static assets are self-hosted. The supplied PNG is presented with a CSS crop and SVG color-key filter; the source image has not been edited. The same supplied logo is used in the website header, footer, prototype header, favicon, and touch icon.
