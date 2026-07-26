# Eolas Companion — Platform Alpha 0.6.0

**Play More. Research Less.**

Eolas Companion is a mobile-first game companion platform. Palworld is the first reference Companion Pack rather than the identity of the application itself.

## Versioning

- **Eolas Platform:** `0.6.0-alpha`
- **Palworld Companion Pack:** `0.1.0-alpha`

Platform releases cover shared navigation, progress, accessibility, offline support, notebooks, recommendations, and reusable UI. Companion Pack releases cover game-specific data and mechanics.

## Repository structure

```text
/
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── engine/
│   ├── app.js
│   └── styles.css
├── games/
│   └── palworld/
│       ├── data.js
│       └── manifest.json
├── icons/
├── docs/
└── ALPHA_TEST_GUIDE.md
```

The root remains deployable directly through GitHub Pages. Existing local progress from Alpha 0.5 is migrated automatically.

## Deploying the replacement structure

Extract the ZIP and upload **everything inside the extracted folder** to the root of the renamed `eolas-companion` repository. Replace the existing files and keep `.nojekyll`.

After GitHub Pages finishes deploying, fully close and reopen the site or installed PWA. Refresh twice if an older cached build appears.

## Alpha Notebook privacy

The notebook is optional, hidden by default, and stored only in the current browser profile. It is not authenticated. Export the notebook as Markdown when it is ready for sprint review.

## Project documentation

Start with:

- [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md)
- [`docs/ROADMAP.md`](docs/ROADMAP.md)
- [`docs/TEAM_CHARTER.md`](docs/TEAM_CHARTER.md)
- [`docs/COMPANION_SPEC.md`](docs/COMPANION_SPEC.md)
