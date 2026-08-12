# Saurab Dhir — Personal Website V2

Pixel-art portfolio: article timeline, interactive dot globe of places lived/visited, and the Docula → Mecka switch animation.

## Structure
- `index.html` — the whole site in one self-contained file (fonts, scripts, globe data inlined). This is what gets served.
- `src/` — editable source:
  - `Saurab Dhir Portfolio.dc.html` — the page (open directly in a browser; needs `support.js` + `globe.js` beside it)
  - `globe.js` — the `<pixel-globe>` web component (d3 + world-atlas dot globe)
  - `support.js` — page runtime

## Deploy
- **Namecheap hosting:** upload `index.html` to `public_html/` via cPanel File Manager.
- **GitHub Pages:** repo Settings → Pages → deploy from `master` / root. Point the domain at Pages with a CNAME if preferred.

Edits are easiest back in the design tool; re-export `index.html` after changes.
