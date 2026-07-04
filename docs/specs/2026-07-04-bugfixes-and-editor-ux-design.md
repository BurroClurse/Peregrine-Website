# Peregrine site — bug fixes + editor UX pass (2026-07-04)

Punch-list from Tyler, plus a targeted UI/UX audit of the site *and* the
edit/layout/customize tooling. Recurring theme: **the editor bakes runtime or
CSS state into saved HTML, which then fights the live runtime.**

## Group A — Site bugs (no design choices)

- **#7 slide-right never fires.** `.pe-ix-pending[data-pe-ix-effect="slide-right"]`
  (specificity 0-2-0) keeps `translateX(-42px)` and outranks `.pe-ix-in`
  (`transform:none`, 0-1-0), so scroll-triggered slide/scale/rotate/blur effects
  never resolve. Fix: add `.pe-ix-pending.pe-ix-in { transform:none; opacity:1;
  filter:none }` after the pending-effect rules so the resolved state wins.
- **#4 target label frozen on "12-Dot Grid".** `data-target-loop-ready` was baked
  into saved HTML; `script.js` sees it and skips installing the frame callback.
  Fix: guard on a JS property (not a serialized attribute), strip the attribute
  on save/export, and remove it from the current HTML.
- **#1 Safari blank space above hero bg** and **#5 drift-phone distance** —
  positioning; confirm live in Safari + headless before asserting cause.

## Group B — Editor architecture

- **#2 Hide `.feature__media` from selection.** Drop it from `MOVE_SEL`/
  `data-pe-move` so clicks land on the device or image, never the empty wrapper.
  DOM/layout untouched.
- **#3 Phones scalable + group-lock.** `.device` is `width:100%; max-width:340px`
  with the screenshot at `width:100%` and chrome in `cqw`, so scaling `.device`
  width scales the whole phone. Make the phone resize as a unit (aspect-locked),
  add a **Lock to phone** toggle: locked (default) forces the inner image to fill
  and clears pinned inline sizes; unlocked resizes the inner image alone.
- **#6 Nudge vanishes behind a block.** `applyTransform` sets no `position`/
  `z-index`, so a nudged element slides under a later opaque sibling. Fix: when a
  layout offset is present, apply `position:relative` + a small raised `z-index`.

## Group C — Editor UX polish + audit

Drive edit/layout/customize headless; fix selection landing on the wrong layer,
tool/handle mis-positioning, save/export round-trip gaps, and the
"baked runtime attribute" class of bug generally. Keep current design language.

## Verification

`python3 serve.py` + `node tests/editor-regression.test.js` + headless puppeteer
for animation/editor behavior (MCP Chrome tabs are `document.hidden`).
