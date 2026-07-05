# Peregrine Website Responsive Single-Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Peregrine marketing site responsive on desktop, iPhone, and iPad while preserving one public `index.html` and the current desktop design.

**Architecture:** Keep the static HTML/CSS/JS architecture. Use a hybrid fix: back up the current site, add public-page regression checks, clean the worst baked desktop layout from `index.html`, add mobile/tablet CSS safeguards, and update `editor.js` clean export so unsafe layout does not return.

**Tech Stack:** Static HTML, CSS, dependency-free JavaScript, Node plain-script tests, Python `serve.py` for local range-capable preview.

## Global Constraints

- Use one responsive `index.html`; do not create separate mobile and desktop HTML files.
- Preserve the current desktop visual system and content order.
- Create a complete timestamped backup before implementation changes touch site files.
- Do not add a framework build step.
- Verify locally with `python3 serve.py`; do not use `python3 -m http.server`.
- Run `node tests/editor-regression.test.js` exactly as a plain script, not `node --test`.
- Preserve existing unrelated dirty working-tree changes.

---

### Task 1: Back Up Current Website

**Files:**
- Create: `backups/2026-07-05-pre-responsive-mobile/`

**Interfaces:**
- Consumes: current working-tree website files.
- Produces: restorable backup folder untouched by later implementation tasks.

- [ ] **Step 1: Create the backup folder**

Run:

```bash
mkdir -p backups/2026-07-05-pre-responsive-mobile
```

Expected: command exits `0`.

- [ ] **Step 2: Copy current website files into the backup**

Run:

```bash
cp -R index.html styles.css script.js editor.js editor.css serve.py README.md assets docs OLDindex.html OLDindex3.html indexOLD.html index-3.html __preview.html __test.html backups/2026-07-05-pre-responsive-mobile/
```

Expected: command exits `0`; backup folder contains the current website and assets.

- [ ] **Step 3: Verify the backup exists**

Run:

```bash
ls backups/2026-07-05-pre-responsive-mobile
```

Expected: output includes `index.html`, `styles.css`, `script.js`, `assets`, and `docs`.

### Task 2: Add Public Responsive Regression Tests

**Files:**
- Create: `tests/public-responsive.test.js`

**Interfaces:**
- Consumes: current `index.html`, `styles.css`, `editor.js`.
- Produces: failing checks for public-export responsive safety before implementation.

- [ ] **Step 1: Write the failing public responsive test**

Create `tests/public-responsive.test.js` with checks for:

```javascript
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const editor = fs.readFileSync(path.join(root, "editor.js"), "utf8");

function sectionBetween(startNeedle, endNeedle) {
  const start = index.indexOf(startNeedle);
  assert.notEqual(start, -1, `Missing start marker ${startNeedle}`);
  const end = endNeedle ? index.indexOf(endNeedle, start + startNeedle.length) : index.length;
  assert.notEqual(end, -1, `Missing end marker ${endNeedle}`);
  return index.slice(start, end);
}

function assertNoUnsafeLayout(html, label) {
  assert(!/max-width:\s*none/i.test(html), `${label} should not force max-width:none`);
  assert(!/\bwidth:\s*\d+(?:\.\d+)?px/i.test(html), `${label} should not force fixed pixel width`);
  assert(!/\bheight:\s*\d+(?:\.\d+)?px/i.test(html), `${label} should not force fixed pixel height`);
  assert(!/transform:\s*translate\(/i.test(html), `${label} should not force translate() positioning`);
}

assert(index.includes('name="viewport" content="width=device-width, initial-scale=1.0"'), "viewport meta should support responsive layout");
assert(!index.includes('src="editor.js') && !index.includes('href="editor.css'), "public index should be clean and not include editor shell");

assertNoUnsafeLayout(sectionBetween('<section class="hero"', '<section class="band"'), "hero");
assertNoUnsafeLayout(sectionBetween('<section class="section section--drift"', '<section class="section section--how"'), "drift");
assertNoUnsafeLayout(sectionBetween('<section class="cta"', '</main>'), "cta");

[
  "@media (max-width: 920px)",
  "@media (max-width: 720px)",
  "@media (max-width: 480px)",
  ".hero__device.pe-force-media-stretch",
  ".drift.pe-force-media-stretch",
  ".cta__inner",
].forEach((needle) => {
  assert(styles.includes(needle), `styles.css should include ${needle}`);
});

[
  "sanitizeResponsiveLayoutForExport",
  "stripUnsafeResponsiveLayout",
  "hero__device",
  "drift__wheel",
  "cta__inner",
].forEach((needle) => {
  assert(editor.includes(needle), `editor.js should include ${needle}`);
});

console.log("Public responsive checks passed.");
```

- [ ] **Step 2: Run it to verify RED**

Run:

```bash
node tests/public-responsive.test.js
```

Expected: FAIL because current `index.html` has unsafe inline desktop layout and `editor.js` does not yet include export sanitation.

### Task 3: Clean Current Public HTML and Add Responsive CSS Guards

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: failing `tests/public-responsive.test.js`.
- Produces: public HTML/CSS that passes static responsive safety checks and preserves desktop presentation through CSS.

- [ ] **Step 1: Remove unsafe inline layout from current public `index.html`**

Remove `transform`, fixed `width`, fixed `height`, and `max-width:none` inline declarations from hero, drift, drift screenshot carousel/device images, and CTA content containers. Keep interaction custom properties such as `--pe-ix-duration`, media opacity/filter tuning, and text alignment when they are not positioning content off-screen.

- [ ] **Step 2: Add responsive CSS safeguards**

Append targeted responsive overrides to `styles.css`:

```css
/* Public export responsive guards: neutralize desktop Layout-mode geometry below tablet widths. */
@media (max-width: 920px) {
  .hero__copy,
  .hero__title,
  .hero__lede,
  .hero__device.pe-force-media-stretch,
  .drift.pe-force-media-stretch,
  .drift__copy.pe-force-media-stretch,
  .drift__wheel.pe-force-media-stretch,
  .drift__shots.pe-force-media-stretch,
  .carousel--drift.pe-force-media-stretch,
  .carousel--drift .device.pe-force-media-stretch,
  .cta__inner {
    transform: none !important;
    max-width: 100% !important;
  }

  .hero__device.pe-force-media-stretch,
  .drift__copy.pe-force-media-stretch,
  .drift__wheel.pe-force-media-stretch,
  .drift__shots.pe-force-media-stretch,
  .carousel--drift.pe-force-media-stretch,
  .carousel--drift .device.pe-force-media-stretch,
  .cta__inner {
    width: 100% !important;
    height: auto !important;
  }

  .hero__device { justify-self: center; width: min(100%, 320px); }
  .drift__wheel { width: min(100%, 400px); }
  .cta__inner { margin: 0 auto; }
}

@media (max-width: 720px) {
  .hero { min-height: auto; padding-top: 104px; padding-bottom: 54px; }
  .hero__inner { gap: 34px; }
  .hero__device { width: min(82vw, 292px); }
  .feature { border-radius: 18px; padding: 28px 20px; }
  .drift__visual { gap: 28px; }
  .drift__readout { padding: 14px 16px; }
  .cta { padding: 72px var(--pad); }
}

@media (max-width: 480px) {
  .hero__title { font-size: clamp(38px, 12vw, 52px); }
  .section__title { font-size: clamp(30px, 10vw, 42px); }
  .feature__title { font-size: clamp(25px, 8vw, 34px); }
  .hero__device { width: min(78vw, 260px); }
  .band__chips { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; }
  .dw-hand { width: 100%; max-width: 340px; }
  .dw-hand button { flex: 1 1 0; padding-left: 10px; padding-right: 10px; }
}
```

- [ ] **Step 3: Verify GREEN for public responsive test**

Run:

```bash
node tests/public-responsive.test.js
```

Expected: PASS.

### Task 4: Prevent Unsafe Layout Returning on Clean Export

**Files:**
- Modify: `editor.js`
- Modify: `tests/public-responsive.test.js`

**Interfaces:**
- Consumes: current `editor.js` export path.
- Produces: clean-export sanitation helpers that remove responsive-hostile layout from known public containers.

- [ ] **Step 1: Add export sanitation helpers in `editor.js`**

Add functions near `scrubEditorAttrs`:

```javascript
  var RESPONSIVE_LAYOUT_EXPORT_SELECTORS = [
    ".hero__copy",
    ".hero__title",
    ".hero__lede",
    ".hero__device",
    ".drift",
    ".drift__copy",
    ".drift__lede",
    ".drift__note",
    ".drift__wheel",
    ".drift__shots",
    ".carousel--drift",
    ".carousel--drift .device",
    ".carousel--drift .device__screen img",
    ".cta__inner",
    ".cta__title",
    ".cta__sub",
    ".signup__note"
  ];
  function stripUnsafeResponsiveLayout(elm) {
    if (!elm || !elm.style) return;
    elm.style.removeProperty("transform");
    elm.style.removeProperty("width");
    elm.style.removeProperty("height");
    elm.style.removeProperty("max-width");
    if (!elm.getAttribute("style")) elm.removeAttribute("style");
    elm.classList.remove("pe-force-media-stretch");
  }
  function sanitizeResponsiveLayoutForExport(root) {
    RESPONSIVE_LAYOUT_EXPORT_SELECTORS.forEach(function (sel) {
      qsa(root, sel).forEach(stripUnsafeResponsiveLayout);
    });
  }
```

- [ ] **Step 2: Call the sanitizer only for clean public export**

In `serializeHTML(false)` and `exportSiteWithAssets()`, call:

```javascript
sanitizeResponsiveLayoutForExport(clone);
```

after `scrubEditorAttrs(clone)` and before clean HTML is returned/written.

- [ ] **Step 3: Verify public responsive test still passes**

Run:

```bash
node tests/public-responsive.test.js
```

Expected: PASS.

### Task 5: Adjust Existing Regression Coverage for Public vs Authoring Index

**Files:**
- Modify: `tests/editor-regression.test.js`

**Interfaces:**
- Consumes: current regression script that assumes `index.html` is the authoring shell.
- Produces: regression script that accepts a clean public `index.html` while still verifying editor source behavior.

- [ ] **Step 1: Replace the hard authoring-shell assertion**

Change the first `includesAll(index, [...], "index.html authoring shell")` block so it requires only public assets in `index.html`:

```javascript
includesAll(
  index,
  [
    'href="styles.css?v=',
    'src="script.js?v=',
  ],
  "public index shell"
);

assert(
  !index.includes('href="editor.css') && !index.includes('src="editor.js') && !index.includes('id="peDock"'),
  "public index should not include the editor shell"
);
```

Then keep editor capability checks against `editor.js`, not public `index.html`.

- [ ] **Step 2: Run existing regression script**

Run:

```bash
node tests/editor-regression.test.js
```

Expected: PASS, or fail only on assertions that still incorrectly assume public `index.html` contains editor shell.

### Task 6: Browser Viewport Verification

**Files:**
- Create: `tests/viewport-responsive-check.js`

**Interfaces:**
- Consumes: local `serve.py` at `http://127.0.0.1:8099`.
- Produces: automated viewport checks for overflow and critical element visibility.

- [ ] **Step 1: Create the viewport check script**

Create `tests/viewport-responsive-check.js` using Playwright/Puppeteer if available locally. It should visit `http://127.0.0.1:8099`, test desktop, iPhone SE, modern iPhone, iPad portrait, and iPad landscape, and assert no horizontal overflow plus visible hero, nav, drift, video, and CTA elements.

- [ ] **Step 2: Start local server**

Run:

```bash
python3 serve.py
```

Expected: server prints `http://localhost:8099`.

- [ ] **Step 3: Run viewport checks**

Run:

```bash
node tests/viewport-responsive-check.js
```

Expected: PASS for all configured viewports.

### Task 7: Final Verification

**Files:**
- Verify only.

**Interfaces:**
- Consumes: completed implementation.
- Produces: evidence for completion.

- [ ] **Step 1: Run all regression checks**

Run:

```bash
node tests/public-responsive.test.js
node tests/editor-regression.test.js
```

Expected: both commands PASS.

- [ ] **Step 2: Confirm backup remains present**

Run:

```bash
ls backups/2026-07-05-pre-responsive-mobile
```

Expected: output includes `index.html`, `styles.css`, `script.js`, `assets`, and `docs`.

- [ ] **Step 3: Review changed files**

Run:

```bash
git status --short
```

Expected: responsive work files are visible; pre-existing unrelated dirty files remain untouched.
