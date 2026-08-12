# Saurab Dhir — Personal Website V2

Pixel-art portfolio: article timeline, interactive dot globe of places lived/visited, and the Docula → Mecka switch animation.

Live at [saurabdhir.com](https://saurabdhir.com) via GitHub Pages (`master` / root, custom domain in `CNAME`).

## Structure
Served straight from the repo root — `index.html` loads the two scripts beside it:
- `index.html` — the page (design export, plus `<title>`/description and the loop-button styling)
- `support.js` — page runtime (pulls React from unpkg at runtime)
- `globe.js` — the `<pixel-globe>` web component (d3 + world-atlas dot globe)
- `src/` — the same files as editable source, including `Saurab Dhir Portfolio.dc.html` (the design-tool original)

External runtime dependencies: Google Fonts, React/ReactDOM (unpkg), d3 + topojson (unpkg), world-atlas (jsDelivr).

## Editing
Edits are easiest back in the design tool. Re-export `Saurab Dhir Portfolio.dc.html`, then copy it to `index.html` and re-apply the two local tweaks:
1. `<title>Saurab Dhir</title>` + the `<meta name="description">` line in `<head>`
2. The loop button's green gradient (matches the grass island: `#4a9b4f` / `#3b7c40`)

Keep `support.js` and `globe.js` next to `index.html` — the page won't render without them.

## Deploy
Push to `master`; GitHub Pages rebuilds automatically. `CNAME` holds the custom domain, so leave it in place.
