# Peregrine Website Upgrade + Customize Panel v4 — Design

Date: 2026-07-02
Status: Approved by Tyler (this session)
Scope: `~/Desktop/Peregrine-Website` (index.html, styles.css, script.js, editor.js, editor.css)

## Goals

1. Fix the broken Drift section and add three high-impact interactive showpieces to the
   public site, keeping the existing colors/typography/aesthetic.
2. Rebuild the customize panel's image pipeline so adding images always works
   (no localStorage quota failures) and the insert UX has no blocking `prompt()` dialogs.
3. Place existing unused video assets; deliver Kling prompt ideas (no build work).

## A. Public site changes

### A1. Drift section rebuild (bug fix + showpiece)

Current failure: `.drift` grid lets the copy column collapse (~150px; headline wraps one
word per line) while the inserted carousel of raw 945×2048 JPGs overflows.

New layout (desktop): two columns — copy column with `minmax(360px, 1fr)`; visual column
holds the new Drift Wheel with the framed-screenshot carousel below it. Mobile: stacked.

**Drift Wheel** (new, hand-rolled SVG + small JS module in script.js):
- Clock face styled like a target ring; 12 sectors of 30°, zone colors matching the app
  (`hue = index/12`, sat 0.8, brightness ~0.81 — from `DriftAnalyzer.swift`).
- Hover/tap a sector (or its hour label): sector highlights, a red dot animates from
  center toward that clock position leaving a fading tracer, and a caption card under the
  wheel shows: zone display name, cause sentence, corrective drill. Content copied
  verbatim (right-handed variants) from `DriftAnalyzer.swift` in the app repo.
- Idle behavior: auto-cycle a zone every ~3.5s; pauses permanently after first user
  interaction. Disabled entirely under `prefers-reduced-motion`.
- Keyboard accessible: sectors are buttons; arrow keys move between zones.

**Screenshots**: the two real Drift Diagnosis screenshots (`assets/IMG_1223.JPG`,
`assets/IMG_1180.JPG`) remain in a carousel but each slide gets the standard `.device`
iPhone frame treatment used elsewhere; carousel width capped so it can't overflow.

### A2. Hero "take a shot" interaction

- Inside `#hero` (excluding form/links/buttons), CSS `cursor: crosshair`.
- Click/tap: laser ping at the point — bright dot flash + expanding ring + scorch mark
  that fades over ~1.5s; every few shots a small score chip ("+5" / "A") pops and fades.
- Implementation: one pointerdown listener + CSS keyframe animations; elements removed
  on animationend. Ignores clicks on `a, button, input, form`. Reduced-motion: single
  static dot flash, no ring/scorch.

### A3. Stat band count-up

- `#measure` chips (9, 40, 118, 10.0s, 0.38s) count from 0 to target over ~0.9s the
  first time the band enters the viewport (IntersectionObserver, once). Decimal targets
  keep one decimal place. Reduced-motion: skip animation, show final values.

### A4. Small fixes

- Drills carousel initializes on slide 1 (drills.jpg) — investigate why it can start
  mid-track and pin initial scroll position to 0.
- Copy: "orner markers" → "corner markers"; remove stray `&nbsp;` in
  "…numbered squares, and Six circle array"; tighten the Drift lede to two sentences.

### A5. Video placement (existing assets)

- `assets/video/peregrine_targets_12s_seamless_loop.MP4`: ambient
  `<video muted loop playsinline autoplay>` slide added to the Targets carousel
  (first slide), poster fallback for data-saver.
- Best-looking clip from `assets/hero/Kling/` (preview all 6 during implementation):
  low-opacity muted loop background inside `#signup` behind the CTA content
  (below the existing `.cta__bg`; text contrast preserved with an overlay gradient).
- Walkthrough video section unchanged.

## B. Customize panel v4 (editor.js / editor.css)

### B1. IndexedDB asset store

- New module in editor.js: DB `peregrineEditorAssets`, object store `assets`
  (`{id, blob, name, type, addedAt}`).
- Insert/swap flows store the File as a blob and put `pe-asset:<id>` in state
  (`insertedImages[].src`, `content[k].src`). At apply-time, editor resolves
  `pe-asset:` refs to `URL.createObjectURL` blobs.
- Migration: on load, any legacy base64 `data:` URLs in state are converted to blobs,
  stored in IndexedDB, and the state entries rewritten to `pe-asset:` refs.
- localStorage now carries only small refs → quota failures eliminated. The existing
  "Couldn't save" toast remains as a safety net but should no longer trigger.

### B2. Export writes real files

- Export flow gains an images step: every `pe-asset:` ref used by the page is written
  as `assets/edited/<id>.<ext>` and the exported HTML references those paths.
- Primary path: File System Access API (`showDirectoryPicker`) — user picks the site
  folder; editor writes `index.html` + `assets/edited/*` directly.
- Fallback (API unavailable/denied): download `index.html` plus each image file,
  with a toast listing where to put them (`assets/edited/`).

### B3. Insert UX — no blocking prompts

- "Add image" opens a small floating card (same visual language as the existing panel):
  drop zone + file picker, width slider (120–1400, default 520), aspect-ratio select
  (16:9, 4:3, 1:1, 9:16, natural), iPhone-frame toggle, live thumbnail preview,
  Insert/Cancel buttons.
- Drag & drop from Finder onto any section in Edit mode inserts at the drop target
  (uses the same host-resolution logic as `imageInsertHost`).
- Carousel-add flow reuses the same card with multi-file selection.
- `prompt()`/`confirm()` calls for image/carousel insertion are removed. (The global
  "Reset all" confirm stays.)

### B4. Stable element identity

- Replace index-based `keyFor()` ("host|TAG|index") with permanent stamps: first time
  an element is edited it gets `data-pe-id="pe-<base36 timestamp+counter>"`, which is
  saved into exported HTML. `byKey` looks up `[data-pe-id]` first, falls back to legacy
  keys for existing saved state (one-time migration maps legacy keys to new ids when
  the legacy lookup still resolves).

### Non-goals (B)

Fonts, colors, effects, section reorder/hide, undo/redo, layout drag internals stay
as-is. Editor remains dev-only (stripped at publish; Export produces the clean file).

## C. Kling prompt ideas (deliverable = list only)

Six 4–8s prompts matching the ember/laser aesthetic: target macro w/ laser dot;
over-the-shoulder score moment; falcon dive → reticle sting; laser-cartridge chamber
macro; printer target sheet; drift tracer motion graphic. Guidance: avoid content that
reads as brandishing a firearm (generation + ad-network flags).

## Testing

- Visual: puppeteer-core scroll-capture script (scratchpad) re-run at 1440px and 390px
  after changes; verify Drift section renders correctly at both.
- Editor: manual-style scripted checks via puppeteer where feasible — insert a large
  (>3MB) image twice, reload, confirm both persist (IndexedDB path); export to a temp
  dir and confirm index.html + assets/edited/* exist and reference correctly.
- Existing `tests/` folder in the website project: keep passing if it has assertions.
- Site JS remains dependency-free vanilla; editor remains a single file.
