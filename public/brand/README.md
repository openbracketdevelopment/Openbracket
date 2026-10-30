# OpenBracket logo family

Original geometric bracket mark with shallow extruded faces, paired with custom vector lettering inspired by early computing. The central opening suggests space for an idea. All SVGs have transparent backgrounds and use paths/polygons rather than external fonts, filters, raster images, or linked resources.

- `openbracket-horizontal-dark.svg`: white lettering, red dimensional mark, for dark backgrounds.
- `openbracket-horizontal-light.svg`: charcoal lettering, red dimensional mark, for light backgrounds.
- `openbracket-stacked-dark.svg` / `openbracket-stacked-light.svg`: centered vertical lockups.
- `openbracket-icon.svg`: red dimensional bracket symbol for either background.
- `*-mono-black.svg` / `*-mono-white.svg`: single-color, flat versions for stamps, vinyl, and other one-ink applications.
- `logo-preview.svg` / `logo-preview.png`: comparison sheet. These have intentional backgrounds; the individual assets are transparent.
- `index.html`: local browser gallery with links to each asset.

Brand red: #DE3736. Highlight: #F17B70. Side planes: #A12726 / #922522 / #822020. Wordmark: #FFFFFF or #171815.

Preserve proportions and allow clear space of at least one bracket-stem width. Recommended digital minimum widths: horizontal 280px; stacked 220px; icon 24px. Below 32px, the flat icon may reproduce more cleanly. The descriptor is intentionally secondary; use the icon instead of shrinking full lockups into tiny placements. The preview includes a small-scale check.

Source: `scripts/generate-brand.mjs`. Run `node scripts/generate-brand.mjs` to regenerate the SVG family. The lettering is drawn directly in the source and requires no font installation. The favicon copy in `app/icon.svg` should be refreshed after changes to the icon. The previous logo remains at `public/images/ob-logo-reversed.png`.
