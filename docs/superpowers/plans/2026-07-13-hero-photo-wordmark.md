# Hero Photo and Wordmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the photo inside the existing hero iPhone and replace only the large hero title text with the supplied-reference metallic Peregrine wordmark.

**Architecture:** Keep the corrected hero phone geometry and its `object-fit: cover` crop unchanged. Overwrite the existing hero-photo asset, cache-bust its URL, and render the existing transparent metallic wordmark inside the existing `<h1>` so navigation/footer branding and heading semantics remain intact.

**Tech Stack:** Static HTML, CSS, JPEG/PNG assets, Node.js assertion scripts, local range-capable Python preview server.

## Global Constraints

- Preserve the hero phone's 280px desktop maximum width, established screen aspect ratio, island spacing, side buttons, and responsive sizing.
- Replace only the image displayed inside the hero iPhone.
- Replace only the large hero title; leave navigation and footer branding unchanged.
- Do not alter the supplied photo beyond browser-side centered cropping.
- Author in `index.editor.html`; regenerate `public/` with `./publish.sh` rather than editing generated files.

---

### Task 1: Hero photo and metallic wordmark

**Files:**
- Modify: `tests/editor-regression.test.js:114-130`
- Modify: `index.editor.html:125-139`
- Modify: `styles.css:438-468`
- Modify: `styles.css:1164-1167`
- Replace: `assets/web/peregrine-training-setup.jpg`
- Verify generated: `public/index.html`, `public/styles.css`, `public/assets/web/peregrine-training-setup.jpg`

**Interfaces:**
- Consumes: `assets/peregrine-wordmark-metallic.png` at 531x120 with alpha transparency; `.device--hero .device__screen img` centered-cover behavior.
- Produces: `.hero__title-brand` as a responsive image inside the hero `<h1>`; cache-busted hero photo URL `assets/web/peregrine-training-setup.jpg?v=2`.

- [ ] **Step 1: Write failing regression assertions**

Add a scoped `heroBlock` assertion to `tests/editor-regression.test.js`:

```js
const heroBlock = index.slice(index.indexOf('class="hero"'), index.indexOf('id="measure"'));
assert(
  /<img class="hero__title-brand" src="assets\/peregrine-wordmark-metallic\.png\?v=2" alt="Peregrine" width="531" height="120">/.test(heroBlock) &&
    !/<span class="hero__title-brand"/.test(heroBlock),
  "hero title should use the metallic Peregrine wordmark image instead of approximate text"
);
assert(
  /src="assets\/web\/peregrine-training-setup\.jpg\?v=2" width="720" height="1280"/.test(heroBlock),
  "hero phone should reference the cache-busted replacement training photo"
);
assert(
  /\.hero__title-brand\s*\{[^}]*width:\s*calc\(531px\s*\*\s*var\(--pe-text,\s*1\)\)[^}]*max-width:\s*100%[^}]*height:\s*auto[^}]*object-fit:\s*contain/s.test(styles),
  "hero wordmark should scale responsively without distorting"
);
```

- [ ] **Step 2: Run the regression script and verify RED**

Run: `node tests/editor-regression.test.js`

Expected: FAIL with `hero title should use the metallic Peregrine wordmark image instead of approximate text` because the public hero still contains the text span.

- [ ] **Step 3: Verify and replace the hero JPEG**

Run:

```bash
file '/tmp/codex-remote-attachments/019f59bc-b9ad-7130-8121-4f98759ab440/9C628230-5CFF-482F-84E1-A69CDD0472F3/1-Photo-1.jpg'
sips -g pixelWidth -g pixelHeight -g format '/tmp/codex-remote-attachments/019f59bc-b9ad-7130-8121-4f98759ab440/9C628230-5CFF-482F-84E1-A69CDD0472F3/1-Photo-1.jpg'
cp '/tmp/codex-remote-attachments/019f59bc-b9ad-7130-8121-4f98759ab440/9C628230-5CFF-482F-84E1-A69CDD0472F3/1-Photo-1.jpg' assets/web/peregrine-training-setup.jpg
```

Expected: a valid 720x1280 JPEG replaces the existing hero-photo asset.

- [ ] **Step 4: Update the authoring hero markup**

Replace the large title span with the transparent wordmark while preserving the `<h1>` and tagline:

```html
<h1 class="hero__title" data-pe-id="pemr84w2050">
  <img class="hero__title-brand" src="assets/peregrine-wordmark-metallic.png?v=2" alt="Peregrine" width="531" height="120">
  <span class="hero__title-tag"><span class="tick" aria-hidden="true"></span>Dry-Fire Laser Trainer</span>
</h1>
```

Update the phone image to:

```html
<img src="assets/web/peregrine-training-setup.jpg?v=2" width="720" height="1280" alt="Peregrine countdown beside a laser-lit dry-fire target and training firearm" style="--pe-ix-duration: 2850ms; --pe-ix-delay: 250ms; --pe-ix-ease: ease; animation-iteration-count: 1;" data-pe-interaction="{&quot;trigger&quot;:&quot;scroll&quot;,&quot;effect&quot;:&quot;fade&quot;,&quot;ease&quot;:&quot;ease&quot;,&quot;repeat&quot;:&quot;replay&quot;,&quot;duration&quot;:2850,&quot;delay&quot;:250}" data-pe-ix-effect="fade" class="pe-ix-pending pe-ix-in" data-pe-id="pemr4ufyx92n">
```

- [ ] **Step 5: Replace text-specific hero-brand CSS with responsive image CSS**

Use:

```css
/* metallic Peregrine wordmark with the tech tagline beneath */
.hero__title-brand {
  display: block;
  width: calc(531px * var(--pe-text, 1));
  max-width: 100%;
  height: auto;
  object-fit: contain;
  object-position: left center;
  animation: heroLineIn .55s cubic-bezier(.2, .7, .2, 1) both;
}
```

Remove the obsolete mobile `.hero__title-brand { font-size: ...; }` declaration. Do not change `.device--hero` or `.device--hero .device__screen`.

- [ ] **Step 6: Publish and verify GREEN**

Run: `./publish.sh`

Expected:

```text
editor regression checks passed
Public responsive checks passed.
```

- [ ] **Step 7: Verify the rendered hero**

Run `python3 serve.py`, reload `http://localhost:8099/index.editor.html`, and inspect desktop 1280x720 plus mobile 390x844.

Verify:

- Hero phone remains 280px wide on desktop with the existing 760/1546 screen ratio.
- New photo is centered and cropped without changing phone chrome.
- Hero wordmark retains its intrinsic 531/120 ratio and fits within the copy column at both viewports.
- Navigation and footer logo markup remain unchanged.

- [ ] **Step 8: Commit and push the implementation**

Run:

```bash
git diff --check
git add index.editor.html styles.css tests/editor-regression.test.js assets/web/peregrine-training-setup.jpg docs/superpowers/plans/2026-07-13-hero-photo-wordmark.md
git diff --cached --name-only
git diff --cached --check
git commit -m "Update hero photo and wordmark"
git push -u origin main
git status --short --branch
git rev-parse HEAD origin/main
```

Expected: the design commit and implementation commit are on `origin/main`, the worktree is clean, and `HEAD` equals `origin/main`.
