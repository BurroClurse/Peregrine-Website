# Home Wordmark 12% Black-Point Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift the black point of the home hero and top-left navigation `Peregrine` wordmarks to 12% black without affecting the setup-guide logos.

**Architecture:** Create a second transparent PNG from the existing wordmark using the deterministic RGB transform `0.12 + (0.88 * source)`. The authoring home page and its production critical-image list use this asset, while guide pages retain the original asset.

**Tech Stack:** Static HTML, Bash, FFmpeg, PNG, Node.js assertion scripts, and the existing publish script.

## Global Constraints

- The adjusted wordmark remains 531 x 120 with an unchanged alpha channel.
- Source black maps to 12% black (`#1F1F1F` after 8-bit rounding); source white remains white.
- Change only the requested home-page wordmarks; guide navigation keeps `assets/peregrine-wordmark-metallic.png`.
- Do not change layout, text, animation, or accessibility attributes.
- Author in `index.editor.html` and regenerate `public/` with `./publish.sh`; never edit generated files.

---

### Task 1: Add the scoped asset reference and regression coverage

**Files:**
- Modify: `tests/editor-regression.test.js:35-39, 91-100, 310-325`
- Modify: `publish.sh:57-61`
- Modify: `index.editor.html:66,126`

**Interfaces:**
- Consumes: `assets/peregrine-wordmark-metallic-blackpoint-12.png`, a 531 x 120 transparent PNG.
- Produces: two home-page `<img>` references to the new asset and an inline production copy of that asset.

- [x] **Step 1: Write the failing regression assertions**

Add the adjusted-asset constant beside `criticalImagePaths` and make it the home-page critical image:

```js
const homeWordmarkPath = "assets/peregrine-wordmark-metallic-blackpoint-12.png";
const criticalImagePaths = new Map([
  [homeWordmarkPath, "image/png"],
  ["assets/reticle-mark.png", "image/png"],
  ["assets/web/peregrine-training-setup.jpg", "image/jpeg"],
]);
```

After the existing hero-wordmark assertion, add:

```js
assert.equal(
  (sourceIndex.match(/src="assets\/peregrine-wordmark-metallic-blackpoint-12\.png\?v=blackpoint12"/g) || []).length,
  2,
  "only the home hero and navigation wordmarks should reference the 12% black-point asset"
);
assert(
  !sourceIndex.includes('src="assets/peregrine-wordmark-metallic.png?v=2"'),
  "the home page should not retain the original wordmark asset"
);
assert(
  howItWorksPage.includes('/assets/peregrine-wordmark-metallic.png?v=') &&
    whatYouNeedPage.includes('/assets/peregrine-wordmark-metallic.png?v=') &&
    !howItWorksPage.includes(homeWordmarkPath) &&
    !whatYouNeedPage.includes(homeWordmarkPath),
  "setup-guide navigation should retain the original wordmark asset"
);
```

- [x] **Step 2: Run the regression script and verify RED**

Run: `node tests/editor-regression.test.js`

Expected: FAIL with `only the home hero and navigation wordmarks should reference the 12% black-point asset` because both home-page image references still use the original file.

- [x] **Step 3: Update the home references and production critical-image list**

In `index.editor.html`, change exactly these two URLs while preserving all other attributes:

```html
<img class="brand__logo" src="assets/peregrine-wordmark-metallic-blackpoint-12.png?v=blackpoint12" alt="Peregrine" width="531" height="120">
<img class="hero__title-brand" src="assets/peregrine-wordmark-metallic-blackpoint-12.png?v=blackpoint12" alt="Peregrine" width="531" height="120">
```

In `publish.sh`, replace the wordmark entry in `criticalImages` with:

```js
["assets/peregrine-wordmark-metallic-blackpoint-12.png", "image/png"],
```

- [x] **Step 4: Publish and verify the scoped asset references are GREEN**

Run: `./publish.sh`

Expected: the generated `public/index.html` embeds the new PNG, while generated setup-guide pages retain fingerprinted references to the original PNG; all regression scripts pass.

### Task 2: Create and validate the adjusted PNG

**Files:**
- Create: `assets/peregrine-wordmark-metallic-blackpoint-12.png`

**Interfaces:**
- Consumes: `assets/peregrine-wordmark-metallic.png` as 8-bit RGBA source art.
- Produces: 8-bit RGBA output of the same dimensions, with `RGBout = 0.12 + (0.88 * RGBin)` and `alphaout = alphain`.

- [x] **Step 1: Generate the deterministic PNG**

Run:

```bash
ffmpeg -y -v error -i assets/peregrine-wordmark-metallic.png -vf "format=rgba,lutrgb=r='val*0.88+30.6':g='val*0.88+30.6':b='val*0.88+30.6'" -frames:v 1 -pix_fmt rgba assets/peregrine-wordmark-metallic-blackpoint-12.png
```

This leaves alpha untouched because `lutrgb` changes RGB channels only. The formula gives an 8-bit black point of `round(255 * 0.12) = 31` (`#1F1F1F`).

- [x] **Step 2: Verify dimensions, pixel format, alpha, and RGB mapping**

Run `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,pix_fmt -of default=noprint_wrappers=1 assets/peregrine-wordmark-metallic-blackpoint-12.png` and use this Node check:

```js
const { spawnSync } = require("node:child_process");
const assert = require("node:assert/strict");
function rgba(file) {
  const result = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1"]);
  assert.equal(result.status, 0, result.stderr.toString());
  return result.stdout;
}
const source = rgba("assets/peregrine-wordmark-metallic.png");
const adjusted = rgba("assets/peregrine-wordmark-metallic-blackpoint-12.png");
assert.equal(adjusted.length, source.length);
for (let i = 0; i < source.length; i += 4) {
  assert.equal(adjusted[i + 3], source[i + 3]);
  for (let channel = 0; channel < 3; channel += 1) {
    const expected = Math.round(source[i + channel] * 0.88 + 30.6);
    assert.ok(Math.abs(adjusted[i + channel] - expected) <= 1);
  }
}
```

Expected: `width=531`, `height=120`, `pix_fmt=rgba`, and no assertion error.

- [x] **Step 3: Re-publish and run the complete regression suite**

Run `./publish.sh` followed by `git diff --check`.

Expected: `editor regression checks passed`, `Public responsive checks passed.`, and no whitespace errors.

- [ ] **Step 4: Commit and push the completed change**

Run:

```bash
git add assets/peregrine-wordmark-metallic-blackpoint-12.png index.editor.html publish.sh tests/editor-regression.test.js docs/superpowers/plans/2026-07-15-wordmark-black-point.md
git diff --cached --check
git commit -m "Lift home wordmark black point"
git push origin main
git status --short --branch
```

Expected: the commit is on `origin/main` and the worktree is clean.
