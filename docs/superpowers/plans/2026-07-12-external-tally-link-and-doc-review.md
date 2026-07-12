# External Tally Link and Documentation Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the embedded website questionnaire with a direct link to Tally, then safely publish the reviewed iOS repository guidance and pre-release audit.

**Architecture:** The website support block will contain one fixed external HTTPS anchor and a separate plain-text email address; it will load no third-party iframe or script. The iOS documentation changes remain documentation-only and will be corrected for factual accuracy and credential safety before commit.

**Tech Stack:** Static HTML/CSS, Node assertion tests, Bash publishing script, Markdown, Xcode project configuration.

## Global Constraints

- Tally form URL: `https://tally.so/r/QKW7Vk`.
- The website must not embed a Tally iframe or load Tally's embed script.
- `support@peregrinedryfire.com` remains selectable plain text, not a mail link.
- External links use `target="_blank"` with `rel="noopener noreferrer"`.
- Never commit the value of an internal unlock credential.
- Do not modify application behavior in the iOS documentation commit.

---

### Task 1: Website External Questionnaire Link

**Files:**
- Modify: `tests/editor-regression.test.js`
- Modify: `index.editor.html`
- Modify: `styles.css`
- Verify generated/ignored output: `public/index.html`, `public/styles.css`

**Interfaces:**
- Consumes: existing `.signup__contact` support block and `publish.sh`.
- Produces: `.signup__support-link` pointing to the fixed Tally URL and the existing `.signup__email` plain text.

- [x] **Step 1: Replace embed assertions with direct-link assertions**

```js
assert(
  index.includes('class="btn btn--ghost signup__support-link"') &&
    index.includes('href="https://tally.so/r/QKW7Vk"') &&
    index.includes('target="_blank"') &&
    index.includes('rel="noopener noreferrer"'),
  "public support section should link to the hosted Tally bug-report form"
);
assert(
  !index.includes("data-tally-src") &&
    !index.includes("https://tally.so/widgets/embed.js"),
  "public support section should not embed the Tally form"
);
```

- [x] **Step 2: Run the regression test and verify RED**

Run: `node tests/editor-regression.test.js`

Expected: FAIL because the current public page embeds Tally instead of linking to it.

- [x] **Step 3: Replace the iframe and loader with one external anchor**

```html
<a class="btn btn--ghost signup__support-link" href="https://tally.so/r/QKW7Vk" target="_blank" rel="noopener noreferrer">Open bug report form</a>
```

Remove the iframe-specific CSS and add a 44px minimum target size and centered margin for `.signup__support-link`. Preserve `.signup__email` selection styles.

- [x] **Step 4: Publish and verify GREEN**

Run: `./publish.sh`

Expected: editor regression and responsive checks pass.

Run: `git diff --check`

Expected: exit 0 with no output.

---

### Task 2: iOS Guidance and Audit Documentation

**Review outcome:** The user approved the factual and privacy corrections. The literal credential is redacted, the scheme explanation reflects the actual project settings, and the audit distinguishes user-initiated external support navigation from automatic data transmission.

**Files:**
- Modify: `/Users/tylerbeattie/Developer/Peregrine-iOS/CLAUDE.md`
- Modify: `/Users/tylerbeattie/Developer/Peregrine-iOS/AGENTS.md`
- Create: `/Users/tylerbeattie/Developer/Peregrine-iOS/docs/Combined_Pre_Release_Audit_2026-07-11.md`

**Interfaces:**
- Consumes: actual Xcode Public Test configuration and the current external Tally support flow.
- Produces: consistent build/test guidance and a credential-safe point-in-time audit.

- [x] **Step 1: Correct test-scheme guidance**

Use this meaning in both repository-guidance files:

```markdown
Run unit tests with the internal development scheme; reserve Public Test for tester-facing build and archive verification. Public Test has `ENABLE_TESTABILITY = YES`, so lack of testability is not the reason for the workflow split.
```

- [x] **Step 2: Make the audit safe and current**

Remove the literal unlock value, add a dated post-audit note for the external Tally support form, and update the support URL status without weakening the remaining App Store Connect deployment check.

- [ ] **Step 3: Verify documentation scope**

Run: `rg -n 'PeregrineAdvancedUnlock\\s*=\\s*"[^\"]+"|mailto:' CLAUDE.md AGENTS.md docs/Combined_Pre_Release_Audit_2026-07-11.md`

Expected: no credential value and no stale mail-flow claim.

Run: `git diff --check`

Expected: exit 0 with no output.

---

### Task 3: Commit and Push

**Files:**
- Website: stage only the external-link plan, HTML, CSS, and regression test.
- iOS: stage only `CLAUDE.md`, `AGENTS.md`, and the corrected combined audit.

- [ ] **Step 1: Run final website publish checks and review both diffs**

```bash
./publish.sh
git diff --check
git diff --stat
git -C /Users/tylerbeattie/Developer/Peregrine-iOS diff --check
git -C /Users/tylerbeattie/Developer/Peregrine-iOS status --short --branch
```

Expected: both website scripts pass, both whitespace checks are silent, and only the scoped files appear.

- [ ] **Step 2: Commit website main with `Link support form to Tally`**

```bash
git add index.editor.html styles.css tests/editor-regression.test.js docs/superpowers/plans/2026-07-12-external-tally-link-and-doc-review.md
git commit -m "Link support form to Tally"
```

- [ ] **Step 3: Commit iOS documentation with `Correct release audit guidance`**

```bash
git -C /Users/tylerbeattie/Developer/Peregrine-iOS add CLAUDE.md AGENTS.md docs/Combined_Pre_Release_Audit_2026-07-11.md
git -C /Users/tylerbeattie/Developer/Peregrine-iOS commit -m "Correct release audit guidance"
```

Expected: only the corrected repository guidance and credential-safe audit are committed.

- [ ] **Step 4: Push both `main` branches and verify they match `origin/main`**

```bash
git push origin main
git status --short --branch
git -C /Users/tylerbeattie/Developer/Peregrine-iOS push origin main
git -C /Users/tylerbeattie/Developer/Peregrine-iOS status --short --branch
```
