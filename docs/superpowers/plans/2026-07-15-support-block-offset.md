# Support Block Offset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the CTA support and bug-report block 40px lower on small screens and up to 60px lower on wide screens while preserving all existing spacing inside the block.

**Architecture:** The support content remains in its existing `.signup__contact` wrapper. A single responsive CSS margin change moves that wrapper as a unit, and the Node assertion script checks the generated public stylesheet so the authored source and deploy output cannot drift.

**Tech Stack:** Static HTML, CSS, Node.js `assert`, Bash publishing script.

## Global Constraints

- Modify authoring sources only; regenerate `public/` exclusively with `./publish.sh`.
- Preserve the existing support copy, Tally external-link safety attributes, and copyable email behavior.
- Preserve the 18px spacing after the support title and button.
- The required support wrapper margin is `clamp(120px, 15vw, 180px) 0 0`.

---

### Task 1: Lock the lower support-block placement with a generated-site regression

**Files:**
- Modify: `tests/editor-regression.test.js:263-266`
- Modify: `styles.css:1085-1088`
- Generated: `public/index.html`, `public/styles.css`

**Interfaces:**
- Consumes: the published `styles` string produced by `./publish.sh`.
- Produces: an assertion that verifies the support wrapper’s responsive offset in the Netlify-facing stylesheet.

- [ ] **Step 1: Write the failing test**

Replace the existing support-spacing assertion pattern with:

```js
/\.signup__contact\s*\{[^}]*margin:\s*clamp\(120px,\s*15vw,\s*180px\)\s+0\s+0;/s
```

and keep the existing assertion message: `public support section should have responsive separation from the launch signup`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/editor-regression.test.js`

Expected: `AssertionError` with `public support section should have responsive separation from the launch signup`, because the generated stylesheet still uses `clamp(80px, 10vw, 120px)`.

- [ ] **Step 3: Write minimal implementation**

In `styles.css`, replace only the `.signup__contact` margin with:

```css
margin: clamp(120px, 15vw, 180px) 0 0;
```

Leave `.signup__support-link { margin: 18px auto 0; }` and
`.signup__email-fallback { margin-top: 18px !important; }` unchanged.

- [ ] **Step 4: Regenerate deploy output and verify the test passes**

Run:

```bash
./publish.sh
node tests/editor-regression.test.js
node tests/public-responsive.test.js
```

Expected: the publisher completes successfully and both Node scripts exit 0.

- [ ] **Step 5: Review and commit**

Run:

```bash
git diff --check
git diff -- styles.css tests/editor-regression.test.js docs/superpowers/specs/2026-07-15-support-block-offset-design.md docs/superpowers/plans/2026-07-15-support-block-offset.md
git status --short
```

Stage the two source files and the design/plan documents, then commit on
`main` with message `Lower CTA support block` and push with
`git push origin main`.
