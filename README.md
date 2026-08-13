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
Edits are easiest back in the design tool. Re-export `Saurab Dhir Portfolio.dc.html`, copy it over `index.html`, then **run `git diff index.html` and re-add everything the export dropped.** The export never ships these:

1. `lang="en"` on the `<html>` tag (the export ships a bare `<html>`)
2. `<title>` + `<meta name="description">` in `<head>`
3. The whole SEO head block after the description: canonical, favicon link, Open Graph / Twitter tags, and the JSON-LD `@graph` (Person + Docula Organization + WebSite)
4. The loop button — grey icon button with the pixel loop-arrow SVG, not the design tool's `LOOP: ON/OFF` text label
5. The wider grass platforms (`width:240px` pulled `60px` outward, vs the export's `180px` at the stage edges)
6. The Docula link as `https://getdocula.com/` — the export ships it as `http://`

Anything added to `<head>` later (og:image, etc.) goes in item 3 at the same time it goes into `index.html`, or the next re-export loses it.

Keep `support.js` and `globe.js` next to `index.html` — the page won't render without them.

## SEO files
- `robots.txt` / `sitemap.xml` — reference `https://saurabdhir.com/`; keep absolute and https.
- `favicon.svg` — pixel sky/grass mark, referenced from the head block.
- `_config.yml` — `exclude:` keeps `src/` and `README.md` from being *published*. Without it, `/src/Saurab Dhir Portfolio.dc.html` is served as a title-less duplicate of the whole site and competes with the real page.

## Deploy
Push to `master`; GitHub Pages rebuilds automatically.

**Never delete or edit `CNAME`.** That file *is* the custom-domain setting, and it drives the 301 from `saurab-dhir.github.io/Personal-website-V2` to the real domain — the redirect that retires the old indexed URL. Keep it permanently.
