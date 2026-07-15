# Tactile CTA Press Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the three home-page neobrutalist CTA links a physical press-in state and prevent held presses from selecting or black-highlighting their labels.

**Architecture:** Keep the interaction CSS-only in the shared `.btn--neo` component. The two guide CTAs inherit the amber offset-shadow override and the support CTA inherits its blue support variant, so one base active state can move each button into its own shadow. The regression script inspects generated `public/` output, preserving the source-to-publish workflow.

**Tech Stack:** Static HTML, CSS, Node.js assertions, `publish.sh`, headless Chrome.

## Global Constraints

- Change only the three `.btn--neo` CTAs; do not affect other buttons, editor controls, or the copyable `.signup__email` span.
- Preserve the existing guide CTA destinations and the Tally link's `target="_blank"` and `rel="noopener noreferrer"` attributes.
- The normal and hover geometry remains 5px and 3px of colored offset shadow, respectively; `:active` reaches the full 5px offset and removes that offset shadow.
- Preserve native anchor keyboard semantics and focus-visible behavior; add no JavaScript or dependencies.
- Under `prefers-reduced-motion: reduce`, do not animate or translate the button, but still collapse its offset shadow while it is held.
- Author in `styles.css`, never hand-edit `public/`, and regenerate it with `./publish.sh`.

---

### Task 1: Lock the press contract into regression coverage

**Files:**
- Modify: `tests/editor-regression.test.js:202-225`
- Test: `tests/editor-regression.test.js`

**Interfaces:**
- Consumes: generated `public/index.html` and `public/styles.css` through the existing `index` and `styles` constants.
- Produces: assertions that require the exact three-CTA source markup, scoped selection/tap-highlight properties, desktop active positioning, and reduced-motion shadow collapse.

- [ ] **Step 1: Add the failing assertions below the existing neobrutalist CTA assertions**

```js
assert.equal(
  (index.match(/class="btn btn--neo(?: btn--neo-support)?(?: [^"]*)?"/g) || []).length,
  3,
  "published home page should expose exactly three tactile neobrutalist CTAs"
);
assert(
  /\.btn--neo\s*\{[^}]*-webkit-user-select:\s*none;[^}]*user-select:\s*none;[^}]*-webkit-touch-callout:\s*none;[^}]*-webkit-tap-highlight-color:\s*transparent;/s.test(styles),
  "tactile CTAs should prevent held-label selection and WebKit tap highlighting"
);
assert(
  /\.btn--neo:active\s*\{[^}]*transform:\s*translate\(5px,\s*5px\);[^}]*box-shadow:\s*0\s+0\s+10px\s+rgba\(204,\s*40,\s*16,\s*\.3\);/s.test(styles) &&
    /\.btn--neo-support:active\s*\{[^}]*box-shadow:\s*0\s+0\s+10px\s+rgba\(138,\s*188,\s*224,\s*\.3\);/s.test(styles),
  "tactile CTAs should reach their full shadow offset while held"
);
assert(
  /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.btn--neo:hover,\s*\.btn--neo:active\s*\{\s*transform:\s*none;\s*\}[\s\S]*?\.btn--neo:active\s*\{\s*box-shadow:\s*0\s+0\s+10px\s+rgba\(204,\s*40,\s*16,\s*\.3\);\s*\}/s.test(styles),
  "reduced-motion tactile CTAs should collapse their shadow without positional movement"
);
```

- [ ] **Step 2: Run the regression test to prove it is red**

Run: `node tests/editor-regression.test.js`

Expected: failure stating `tactile CTAs should prevent held-label selection and WebKit tap highlighting` because the source does not yet declare the scoped selection properties.

### Task 2: Implement the scoped tactile press behavior

**Files:**
- Modify: `styles.css:143-181`
- Modify: `styles.css:1351-1362`
- Test: `tests/editor-regression.test.js`

**Interfaces:**
- Consumes: `.btn--neo` as the common base class, `.section__more .btn--neo` as the guide shadow override, and `.btn--neo-support` as the blue support variant.
- Produces: CSS-only pointer/keyboard active feedback in which every CTA foreground settles into its corresponding colored offset shadow.

- [ ] **Step 1: Add only the scoped held-label safeguards to the shared `.btn--neo` declaration**

```css
.btn--neo {
  width: min(240px, 100%);
  min-height: 48px;
  padding: 0 22px;
  border: 2px solid #7A150A;
  border-radius: 20px;
  background: linear-gradient(180deg, #E04930 0%, #CC2810 52%, #A91B09 100%);
  color: #0A0A0C;
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 1px 0 rgba(243, 239, 230, .2), 0 0 7px rgba(243, 239, 230, .18);
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 5px 5px 0 var(--amber), 0 0 16px rgba(204, 40, 16, .4);
}
```

- [ ] **Step 2: Keep the existing full-depth active press and add the no-motion shadow-only active override**

```css
.btn--neo:active {
  transform: translate(5px, 5px);
  box-shadow: 0 0 10px rgba(204, 40, 16, .3);
}

/* This selector must match the guide CTAs' shadow override specificity. */
.section__more .btn--neo:active {
  box-shadow: 0 0 10px rgba(204, 40, 16, .3);
}

.btn--neo-support:active {
  box-shadow: 0 0 10px rgba(138, 188, 224, .3);
}

@media (prefers-reduced-motion: reduce) {
  .btn--neo:hover, .btn--neo:active { transform: none; }
  .btn--neo:hover { box-shadow: 5px 5px 0 var(--amber), 0 0 16px rgba(204, 40, 16, .4); }
  .btn--neo:active { box-shadow: 0 0 10px rgba(204, 40, 16, .3); }
  .btn--neo-support:hover { box-shadow: 5px 5px 0 var(--recon); }
  .btn--neo-support:active { box-shadow: 0 0 10px rgba(138, 188, 224, .3); }
}
```

- [ ] **Step 3: Run the regression test to prove it is green**

Run: `node tests/editor-regression.test.js`

Expected: `editor regression checks passed`.

### Task 3: Publish, inspect, and ship the generated result

**Files:**
- Modify: `public/index.html` (generated by `publish.sh`)
- Modify: `public/styles.css` (generated by `publish.sh`)
- Verify: `styles.css`, `public/index.html`, `public/styles.css`, `tests/editor-regression.test.js`

**Interfaces:**
- Consumes: source CSS and the existing source-to-public publishing script.
- Produces: generated Netlify output with the same tactile CTA contract and one implementation commit on `main`.

- [ ] **Step 1: Regenerate the public site and rerun the regression suite**

Run: `./publish.sh && node tests/editor-regression.test.js && git diff --check`

Expected: the publisher completes, the regression script reports `editor regression checks passed`, and whitespace validation produces no output.

- [ ] **Step 2: Inspect the three generated CTA declarations and source markup**

Run: `rg -n -C 4 'btn--neo|user-select|tap-highlight|touch-callout' public/styles.css public/index.html`

Expected: `public/styles.css` and the inline production stylesheet include the four scoped selection/tap safeguards; `public/index.html` contains exactly two guide CTAs and one support CTA.

- [ ] **Step 3: Hold every CTA in desktop and touch emulation, then verify Reduced Motion**

Run: start `python3 serve.py`, open `http://localhost:8099/public/` in headless Chrome, hold each of the three `.btn--neo` elements long enough to inspect its active computed transform/shadow, and repeat with `prefers-reduced-motion: reduce` emulated.

Expected: normal-motion CTAs compute to `matrix(1, 0, 0, 1, 5, 5)` with their colored offset shadow absent while held; reduced-motion CTAs compute no translation while their colored offset shadow still collapses. No CTA label becomes selectable.

- [ ] **Step 4: Commit and push the completed implementation**

```bash
git add docs/superpowers/plans/2026-07-15-tactile-cta-press.md styles.css tests/editor-regression.test.js
git diff --cached --check
git commit -m "Make home CTAs tactile on press"
git push origin main
git status --short --branch
```

Expected: one implementation commit is pushed to `origin/main`, and the branch has no remaining worktree changes.
