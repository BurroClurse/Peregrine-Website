# Home Wordmark 12% Black-Point Design

## Goal

Lift the darkest tones in the metallic `Peregrine` wordmark to a 12% black floor on the home page's hero heading and top-left navigation logo.

## Scope

- Create `assets/peregrine-wordmark-metallic-blackpoint-12.png` from the existing transparent 531 x 120 wordmark.
- Preserve the source alpha channel and dimensions exactly.
- Apply a black-point lift to the RGB channels: map source black to 12% black (`#1F1F1F`) while preserving white, highlights, and the metallic gradient.
- Update only the two home-page `<img>` elements in `index.editor.html`: `.hero__title-brand` and the top-left `.brand__logo`.
- Regenerate `public/` through the established `./publish.sh` workflow.

## Out of Scope

- The wordmark and navigation on `/how-it-works/` and `/what-you-need/` remain unchanged.
- No copy, sizing, animation, layout, or accessibility changes.
- No CSS filter: the rendered result must be stable across browsers and retain the existing transparent asset behavior.

## Validation

- Confirm the adjusted PNG remains a 531 x 120 RGBA image and maps its darkest opaque source pixels to 12% black.
- Run `./publish.sh` and `node tests/editor-regression.test.js`.
- Verify both requested home-page wordmarks reference the adjusted asset and guide-page navigation references the original asset.
