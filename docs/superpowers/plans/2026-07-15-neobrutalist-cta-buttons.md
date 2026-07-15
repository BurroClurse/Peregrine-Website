# Neobrutalist CTA Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the two resource links and the external bug-report link prominent, tactile Peregrine CTAs without changing their behavior.

**Architecture:** Keep the site-wide ghost button unchanged. Add a scoped `.btn--neo` treatment for the two resource links and layer `.btn--neo-support` on the existing Tally link for its bone/recon variation. The authoring inputs remain `index.editor.html` and `styles.css`; `./publish.sh` continues to generate every relevant file in `public/`.

**Tech Stack:** Static HTML, CSS custom properties, Node.js `assert` regression script, Bash publish script.

## Global Constraints

- Preserve the existing text, URLs, placement, form behavior, and all Tally `target`/`rel` safety attributes.
- The two guide links must have identical laser-red neobrutalist styling.
- The Tally link must share the geometry and interaction but use a bone fill and recon-blue hard shadow.
- Do not alter the global `.btn--ghost` or navigation CTA styling.
- Keep visible keyboard focus and disable button movement under `prefers-reduced-motion: reduce`.
- Change authoring files only; regenerate `public/` through `./publish.sh`.

---

### Task 1: Define published CTA regression expectations

**Files:**
- Modify: `tests/editor-regression.test.js:185-192`

**Interfaces:**
- Consumes: generated `public/index.html` as `index` and generated `public/styles.css` as `styles`.
- Produces: assertions that document the required published class names, the unchanged external-link safety attributes, and the required role-specific CSS tokens.

- [ ] **Step 1: Replace the current support-button assertion and add the guide CTA assertion**

```js
assert(
  (index.match(/class="btn btn--neo" href="\/(?:how-it-works|what-you-need)\/"/g) || []).length === 2,
  "published guide CTAs should use the shared neobrutalist button class"
);
assert(
  index.includes('class="btn btn--neo btn--neo-support signup__support-link"') &&
    index.includes('href="https://tally.so/r/QKW7Vk"') &&
    index.includes('target="_blank"') &&
    index.includes('rel="noopener noreferrer"'),
  "public support section should keep its safe external Tally link and support neobrutalist class"
);
includesAll(
  styles,
  [
    ".btn--neo {",
    "background: var(--laser);",
    "box-shadow: 4px 4px 0 var(--ink);",
    ".btn--neo-support {",
    "background: var(--bone);",
    "box-shadow: 4px 4px 0 var(--recon);",
  ],
  "neobrutalist CTA styling"
);
```

- [ ] **Step 2: Run the regression script to verify the new expectation fails**

Run: `node tests/editor-regression.test.js`

Expected: `AssertionError` stating `published guide CTAs should use the shared neobrutalist button class`, because the generated page still contains ghost buttons.

### Task 2: Add scoped neobrutalist CTA styles and classes

**Files:**
- Modify: `index.editor.html:163,345,383`
- Modify: `styles.css:142` (after the current shared button styles)
- Modify: `styles.css:1291-1300` (inside the existing reduced-motion media query)

**Interfaces:**
- Consumes: `.btn` typography/layout, palette variables `--ink`, `--laser`, `--laser-soft`, `--bone`, and `--recon`, and the test assertions from Task 1.
- Produces: `.btn--neo` and `.btn--neo-support` CSS classes applied to all three requested anchors.

- [ ] **Step 1: Add the shared class to the two guide links and the shared-plus-support class to the Tally link**

```html
<p class="section__more"><a class="btn btn--neo" href="/how-it-works/">Read the full setup guide</a></p>
<p class="section__more"><a class="btn btn--neo" href="/what-you-need/">See everything you need</a></p>
<a class="btn btn--neo btn--neo-support signup__support-link" href="https://tally.so/r/QKW7Vk" target="_blank" rel="noopener noreferrer">Open bug report form</a>
```

- [ ] **Step 2: Add the role-specific button treatments after `.btn--ghost:hover`**

```css
.btn--neo {
  min-height: 48px;
  padding: 0 22px;
  border: 2px solid var(--ink);
  border-radius: 4px;
  background: var(--laser);
  color: var(--ink);
  font-size: 14px;
  box-shadow: 4px 4px 0 var(--ink);
}
.btn--neo:hover {
  transform: translate(2px, 2px);
  background: var(--laser-soft);
  box-shadow: 2px 2px 0 var(--ink);
}
.btn--neo:active { transform: translate(4px, 4px); box-shadow: none; }
.btn--neo-support {
  background: var(--bone);
  box-shadow: 4px 4px 0 var(--recon);
}
.btn--neo-support:hover {
  background: var(--bone);
  box-shadow: 2px 2px 0 var(--recon);
}
```

- [ ] **Step 3: Preserve motion preferences in the existing reduced-motion block**

```css
.btn--neo:hover, .btn--neo:active { transform: none; }
.btn--neo:hover { box-shadow: 4px 4px 0 var(--ink); }
.btn--neo-support:hover { box-shadow: 4px 4px 0 var(--recon); }
```

- [ ] **Step 4: Regenerate the published output**

Run: `./publish.sh`

Expected: the script completes successfully and writes the updated clean `public/index.html` and `public/styles.css` without editor assets.

- [ ] **Step 5: Run the regression script to verify the implementation passes**

Run: `node tests/editor-regression.test.js`

Expected: it ends with `Editor regression checks passed.`

- [ ] **Step 6: Inspect the generated output and source diff**

Run: `git diff --check && git diff -- index.editor.html styles.css tests/editor-regression.test.js public/index.html public/styles.css`

Expected: only the three requested CTA classes, scoped style rules, their regression checks, and generated public counterparts change; no whitespace errors are reported.

- [ ] **Step 7: Commit the implementation**

```bash
git add index.editor.html styles.css tests/editor-regression.test.js public/index.html public/styles.css
git commit -m "Style prominent neobrutalist CTAs"
```
