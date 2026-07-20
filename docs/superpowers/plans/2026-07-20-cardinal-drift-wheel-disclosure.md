# Cardinal Drift Wheel Disclosure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the twelve-color Drift Diagnosis wheel while publishing and interacting with diagnosis data only at 12, 3, 6, and 9 o'clock.

**Architecture:** Replace the twelve-record public lookup with a four-record cardinal lookup keyed by wheel index while continuing to draw twelve geometric sectors. Classify sectors as cardinal or muted so event handling, accessible labels, automatic playback, and readouts operate only on the four cardinal indexes. Keep `index.editor.html`, `script.js`, and `styles.css` as authoring sources and regenerate the ignored `public/` site through `./publish.sh`.

**Tech Stack:** Static HTML, CSS, dependency-free JavaScript, Node.js `assert` regression script, Bash publish script.

## Global Constraints

- Keep twelve visible wedges and clock numerals with the current hue order.
- Only 12, 3, 6, and 9 may publish or display a diagnosis name, cause, or correction.
- Muted wedges retain darker versions of their original colors and dim further on hover.
- Automatic and keyboard navigation must use only the clockwise sequence 12, 3, 6, 9.
- Preserve Right-handed and Left-handed modes while exposing only cardinal diagnoses.
- Replace the exact 3-of-5 threshold copy with `Flags the fix when a repeated pattern appears`.
- Preserve reduced-motion behavior by showing a static cardinal diagnosis without automatic cycling.
- Generate `public/` only through `./publish.sh`.

---

### Task 1: Define the public disclosure and interaction contract

**Files:**
- Modify: `tests/editor-regression.test.js:913-980`

**Interfaces:**
- Consumes: authoring `script.js` and `index.editor.html`, plus generated `public/script.js`, `public/index.html`, and `public/styles.css`.
- Produces: regression assertions that reject non-cardinal diagnosis data, exact threshold wording, twelve-way selection, or styling that brightens muted sectors.

- [ ] **Step 1: Add cardinal-wheel assertions**

Add assertions that require `CARDINAL_INDEXES`, `CARDINAL_DRIFT_ZONES`, the exact cardinal sequence `[0, 3, 6, 9]`, `dw-sector--cardinal`, `dw-sector--muted`, `aria-hidden`, cardinal-only arrow navigation, deterministic idle cycling, and the new repeated-pattern copy. Assert the four allowed records remain and each removed diagnosis name is absent from source and published JavaScript plus the generated deploy HTML.

```js
const sourceScript = fs.readFileSync(path.join(root, "script.js"), "utf8");
const cardinalDriftIndexes = [0, 3, 6, 9];
const removedDriftLabels = [
  "Right Thumb Frame Push",
  "Right Middle Finger Squeeze",
  "Left Support Late",
  "Right Ring & Pinky Squeeze",
  "Trigger Jerk / Slapping",
  "Right-Hand Milking",
  "Follow-Through Deficit",
  "Right Thumb-Side Tension",
];

includesAll(script, [
  "CARDINAL_INDEXES = [0, 3, 6, 9]",
  "CARDINAL_DRIFT_ZONES",
  "dw-sector--cardinal",
  "dw-sector--muted",
  "CARDINAL_INDEXES[(cardinalPosition + 1) % CARDINAL_INDEXES.length]",
  "CARDINAL_INDEXES[(cardinalPosition + direction + CARDINAL_INDEXES.length) % CARDINAL_INDEXES.length]",
], "cardinal drift wheel runtime");
includesAll(index, [
  "Flags the fix when a repeated pattern appears",
  'id="driftWheel"',
], "published cardinal drift wheel");
includesAll(styles, [
  ".dw-sector--cardinal",
  ".dw-sector--muted path",
  ".dw-sector--muted:hover path",
], "cardinal and muted drift sector styles");
for (const removedLabel of removedDriftLabels) {
  for (const [label, contents] of Object.entries({ sourceScript, script, index })) {
    assert(!contents.includes(removedLabel), `${label} should scrub ${removedLabel}`);
  }
}
for (const contents of [sourceIndex, index]) {
  assert(!contents.includes("3 of your last 5"), "drift marketing copy should not publish the exact alert threshold");
}
assert.equal(cardinalDriftIndexes.length, 4);
```

- [ ] **Step 2: Run the regression script and confirm RED**

Run: `node tests/editor-regression.test.js`

Expected: FAIL because `script.js` still exposes `DRIFT_ZONES` with all twelve records and the generated page still contains the exact 3-of-5 copy.

### Task 2: Implement the cardinal-only wheel and scrub the deployed snapshot

**Files:**
- Modify: `script.js:505-795`
- Modify: `styles.css:1524-1533`
- Modify: `index.editor.html:274-283`
- Modify: `publish.sh:185-230`

**Interfaces:**
- Consumes: the existing `pt`, `sectorPath`, laser marker, readout, handedness persistence, and readout-height behavior inside `window.__peInitDriftWheel()`.
- Produces: `CARDINAL_INDEXES`, `CARDINAL_DRIFT_ZONES`, `cardinalDriftZonesFor(hand)`, twelve sector elements, and four interactive cardinal sectors.

- [ ] **Step 1: Replace the twelve diagnosis records with four cardinal records**

Use a fixed index sequence and an object keyed by sector index. Preserve the existing 12, 3, 6, and 9 copy verbatim.

```js
var CARDINAL_INDEXES = [0, 3, 6, 9];
var CARDINAL_DRIFT_ZONES = {
  0: { hour: 12, name: "Sight Lift / Wrist Up", cause: "Relaxing your wrist, which lets the gun kick upward too early.", fix: "Wrist Lock: Keep your right wrist stiff and straight throughout the entire shot." },
  3: { hour: 3, name: "Too Much Trigger Finger", cause: "Finger wrapped too deep on the trigger, hooking it toward your right side.", fix: "Pad Placement: Contact the trigger with the center of your index finger's first pad." },
  6: { hour: 6, name: "Recoil Anticipation / Flinch", cause: "Subconsciously shoving the muzzle down to fight the expected blast.", fix: "Surprise Break: Squeeze slowly so the exact moment of the shot surprises you." },
  9: { hour: 9, name: "Too Little Trigger Finger", cause: "Using only the tip of your finger, pushing the gun toward your left side.", fix: "Trigger Alignment: Adjust your finger so the trigger rests centered on your finger pad." }
};
```

Build left-handed data only from those four records by sourcing `(12 - index) % 12` and swapping handed words. Do not create placeholder records for muted indexes.

- [ ] **Step 2: Draw twelve sectors but expose behavior only on cardinal sectors**

Iterate indexes `0...11`. Apply `dw-sector--cardinal`, `tabindex="0"`, `role="button"`, and the cardinal diagnosis label only when `CARDINAL_INDEXES.includes(i)`. Apply `dw-sector--muted` and `aria-hidden="true"` otherwise. Keep `driftZoneColor(i)` for every path and keep every clock numeral.

- [ ] **Step 3: Restrict state changes, handedness, and readout sizing**

Guard `show(i, fireEffect)` so non-cardinal indexes return without changing state. Update `syncSectorLabels()` and `lockReadoutHeight()` to iterate `CARDINAL_INDEXES`. When handedness changes, keep `activeIndex` unchanged and refresh that permitted position rather than mirroring the selected location.

- [ ] **Step 4: Make automatic and keyboard motion cardinal-only**

Replace the random twelve-position idle selection with the next entry in `CARDINAL_INDEXES`. Attach pointer, click, focus, and key handlers only to cardinal sector nodes. Arrow keys move forward or backward within the four-entry cardinal sequence.

- [ ] **Step 5: Style active and muted sectors separately**

```css
.dw-sector { outline: none; }
.dw-sector--cardinal { cursor: pointer; }
.dw-sector path { opacity: 0.5; transition: opacity .35s ease, filter .35s ease; }
.dw-sector--cardinal.is-active path,
.dw-sector--cardinal:hover path,
.dw-sector--cardinal:focus-visible path {
  opacity: 1;
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.3));
}
.dw-sector--muted { cursor: default; }
.dw-sector--muted path { opacity: 0.22; filter: saturate(0.72) brightness(0.72); }
.dw-sector--muted:hover path { opacity: 0.13; filter: saturate(0.58) brightness(0.58); }
```

- [ ] **Step 6: Update the public-facing copy and scrub the deployed wheel markup**

Change the list item in `index.editor.html` to `Flags the fix when a repeated pattern appears`. Because the editor source is a saved authoring snapshot, have `publish.sh` replace the serialized contents of `#driftWheel` with an empty figure. That keeps obsolete diagnosis text out of the only folder Netlify publishes while the runtime rebuilds the four-position demonstration.

- [ ] **Step 7: Regenerate the deployed output and confirm GREEN**

Run: `./publish.sh`

Expected: both regression scripts finish successfully and `public/` contains only the four permitted diagnosis records.

Run: `node tests/editor-regression.test.js`

Expected: `Editor regression checks passed.`

### Task 3: Verify behavior, commit, and publish main

**Files:**
- Verify: `index.editor.html`, `script.js`, `styles.css`, `tests/editor-regression.test.js`, generated `public/`
- Commit: design, plan, source, and regression files; do not add ignored `public/`

**Interfaces:**
- Consumes: the completed cardinal wheel and repository run commands.
- Produces: verified source on `main` and a synchronized `origin/main` deployment commit.

- [ ] **Step 1: Start the range-capable local server**

Run: `python3 serve.py`

Expected: the site is available at `http://localhost:8099/public/`.

- [ ] **Step 2: Browser-check the interaction contract**

Verify automatic order 12, 3, 6, 9; cardinal pointer and keyboard selection; muted wedge dimming without a readout change; Right-handed and Left-handed cardinal copy; and no automatic motion when reduced motion is enabled.

- [ ] **Step 3: Run final repository verification**

Run: `./publish.sh && node tests/editor-regression.test.js && git diff --check && git status --short --branch`

Expected: both test scripts pass, the diff check exits zero, and only the intended source, test, and documentation files are modified or untracked.

- [ ] **Step 4: Verify the scrubbed output directly**

Run: `rg -n "Right Thumb Frame Push|Right Middle Finger Squeeze|Left Support Late|Right Ring & Pinky Squeeze|Trigger Jerk / Slapping|Right-Hand Milking|Follow-Through Deficit|Right Thumb-Side Tension" script.js public/index.html public/script.js && rg -n "3 of your last 5" index.editor.html public/index.html`

Expected: no matches.

- [ ] **Step 5: Commit and push**

```bash
git add docs/superpowers/plans/2026-07-20-cardinal-drift-wheel-disclosure.md index.editor.html publish.sh script.js styles.css tests/editor-regression.test.js
git commit -m "Limit drift wheel to cardinal examples"
git push origin main
```

- [ ] **Step 6: Verify remote synchronization**

Run: `git status --short --branch && git rev-parse HEAD && git rev-parse origin/main`

Expected: the worktree is clean, `main...origin/main` has no ahead/behind marker, and both revisions match.
