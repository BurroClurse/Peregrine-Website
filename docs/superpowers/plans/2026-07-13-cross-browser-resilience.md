# Cross-Browser Page Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the published Peregrine landing page retain its styling and content when external resources fail, while content-fingerprinting static media and adding safe production cache/security headers.

**Architecture:** `publish.sh` will turn the generated HTML and versioned CSS into one atomic styled response, fingerprint all local assets plus `script.js`, and retain the current source/generated boundary. The three motion systems will become progressive enhancements by hiding an element only after JavaScript registers it with a working runtime. Netlify will revalidate HTML while keeping fingerprinted resources fresh in the browser.

**Tech Stack:** Bash, dependency-free Node.js, static HTML/CSS/JavaScript, Netlify TOML, Node assertion scripts, local range-capable Python server, headless Chrome, Safari.

## Global Constraints

- Work in `/Users/tylerbeattie/Developer/Peregrine-Deploy` on `main`, as explicitly authorized by the user.
- Preserve and include the existing uncommitted TRT copy, compact-title CSS, and regression assertion.
- Keep `index.editor.html`, `styles.css`, and `script.js` as authoring sources; generate `public/` only through `./publish.sh`.
- Do not add a service worker, dependency, build framework, redesign, copy rewrite, animation timing change, or section reorder.
- Keep `prefers-reduced-motion` behavior.
- Do not hand-edit generated files in `public/`.
- Follow red-green TDD for every production behavior change.
- Use `node tests/editor-regression.test.js` as a plain script, never `node --test`.
- Finish by committing every repository change and pushing `main` to `origin/main`.

---

### Task 1: Atomic styled output and content fingerprints

**Files:**
- Modify: `tests/editor-regression.test.js`
- Modify: `publish.sh`
- Generated: `public/index.html`
- Generated: `public/styles.css`
- Generated: `public/script.js`

**Interfaces:**
- Consumes: source HTML from `index.editor.html`, source styles from `styles.css`, source runtime from `script.js`, and local files below `assets/`.
- Produces: `fingerprint(data)` returning the first 12 lowercase hexadecimal SHA-256 characters; `versionAssetRefs(text)` returning text whose local asset references carry their content fingerprint; generated HTML containing `<style data-peregrine-styles>` and `script.js?v=<fingerprint>`.

- [ ] **Step 1: Add failing publishing assertions**

Add `node:crypto`, source/publisher constants, a fingerprint helper, and these assertions to `tests/editor-regression.test.js`:

```js
const crypto = require("node:crypto");

const sourceIndex = fs.readFileSync(path.join(root, "index.editor.html"), "utf8");
const publisher = fs.readFileSync(path.join(root, "publish.sh"), "utf8");

function fingerprint(data) {
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 12);
}

const inlineStylesMatch = index.match(
  /<style data-peregrine-styles>([\s\S]*?)<\/style>/
);
assert(inlineStylesMatch, "public index should inline the production stylesheet");
assert.equal(
  inlineStylesMatch[1],
  styles,
  "public inline styles should match the generated inspection stylesheet"
);
assert(
  !/<link\b[^>]*href="styles\.css(?:\?[^\"]*)?"/.test(index),
  "public index should not depend on a separate production stylesheet request"
);
assert(
  sourceIndex.includes('href="styles.css') && sourceIndex.includes('href="editor.css'),
  "authoring index should retain source and editor stylesheet links"
);

const scriptVersion = index.match(/src="script\.js\?v=([0-9a-f]{12})"/);
assert(scriptVersion, "public runtime should use a SHA-256 content fingerprint");
assert.equal(
  scriptVersion[1],
  fingerprint(Buffer.from(script)),
  "public runtime fingerprint should match generated script content"
);

const versionedAssetPattern =
  /(?:https:\/\/peregrinedryfire\.com\/)?(assets\/[A-Za-z0-9_.\/ -]+\.[A-Za-z0-9]+)(?:\?v=([0-9a-f]{12}))?/g;
for (const [label, deployedText] of Object.entries({ index, styles, script })) {
  for (const match of deployedText.matchAll(versionedAssetPattern)) {
    const assetPath = path.join(publicRoot, match[1]);
    assert(fs.existsSync(assetPath), `${label} references missing ${match[1]}`);
    assert.equal(
      match[2],
      fingerprint(fs.readFileSync(assetPath)),
      `${label} should fingerprint ${match[1]}`
    );
  }
}

includesAll(
  publisher,
  ["function fingerprint(data)", "function versionAssetRefs(text)", "data-peregrine-styles"],
  "publisher resilience pipeline"
);
```

- [ ] **Step 2: Run the regression script and verify RED**

Run:

```bash
node tests/editor-regression.test.js
```

Expected: FAIL with `public index should inline the production stylesheet`.

- [ ] **Step 3: Implement deterministic publishing**

In the inline Node program inside `publish.sh`, import crypto and add these helpers:

```js
const crypto = require("crypto");

function fingerprint(data) {
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 12);
}

function versionAssetRefs(text) {
  const pattern = /((?:https?:\/\/peregrinedryfire\.com\/)?assets\/[A-Za-z0-9_.\/ -]+\.[A-Za-z0-9]+)(?:\?v=[^"'`\s)<]*)?/g;
  return text.replace(pattern, (full, reference) => {
    const rel = reference.startsWith("http")
      ? new URL(reference).pathname.replace(/^\//, "")
      : reference;
    const sourceFile = path.join(SRC, rel);
    if (!fs.existsSync(sourceFile)) return full;
    return `${reference}?v=${fingerprint(fs.readFileSync(sourceFile))}`;
  });
}
```

Replace source copying for CSS/JavaScript with generated strings and an atomic inline style:

```js
let generatedStyles = versionAssetRefs(readIfExists(path.join(SRC, "styles.css")));
let generatedScript = versionAssetRefs(readIfExists(path.join(SRC, "script.js")));
if (!generatedStyles) throw new Error("Cannot publish without styles.css");
if (!generatedScript) throw new Error("Cannot publish without script.js");
if (/<\/style/i.test(generatedStyles)) {
  throw new Error("styles.css cannot contain a closing </style> sequence");
}

html = versionAssetRefs(html);
html = html.replace(
  /<link\b[^>]*href="styles\.css(?:\?[^\"]*)?"[^>]*>/,
  `<style data-peregrine-styles>${generatedStyles}</style>`
);
html = html.replace(
  /(src="script\.js)(?:\?v=[^"]*)?"/g,
  `$1?v=${fingerprint(Buffer.from(generatedScript))}"`
);

fs.writeFileSync(path.join(DEST, "index.html"), html);
fs.writeFileSync(path.join(DEST, "styles.css"), generatedStyles);
fs.writeFileSync(path.join(DEST, "script.js"), generatedScript);
```

Build the deploy scan from `html`, `generatedStyles`, and `generatedScript`, and copy only `robots.txt` plus `sitemap.xml` through the existing plain-file copy loop. Keep the existing missing-asset failure.

- [ ] **Step 4: Regenerate and verify GREEN**

Run:

```bash
./publish.sh
```

Expected: `assets: 26/26`, `editor regression checks passed`, and `Public responsive checks passed.`

Run again:

```bash
node tests/editor-regression.test.js
node tests/public-responsive.test.js
```

Expected: both scripts exit 0.

---

### Task 2: Make motion fail open without JavaScript

**Files:**
- Modify: `tests/editor-regression.test.js`
- Modify: `tests/public-responsive.test.js`
- Modify: `styles.css`
- Modify: `script.js`
- Modify: `publish.sh`

**Interfaces:**
- Consumes: `.reveal`, `[data-pe-anim]`, and `[data-pe-interaction]` markup already present in the authoring page.
- Produces: `.pe-reveal-ready`, `.pe-anim-ready`, and `.pe-ix-ready` runtime-only classes. Static markup without those classes remains visible.

- [ ] **Step 1: Add failing fail-open assertions**

Add these checks to `tests/editor-regression.test.js`:

```js
includesAll(
  script,
  [
    'el.classList.add("pe-reveal-ready")',
    'el.classList.add("pe-anim-ready")',
    'el.classList.add("pe-ix-pending", "pe-ix-ready")',
  ],
  "fail-open motion registration"
);
includesAll(
  styles,
  [
    ".reveal.pe-reveal-ready",
    "[data-pe-anim].pe-anim-ready",
    ".pe-ix-pending.pe-ix-ready",
  ],
  "runtime-scoped hidden motion states"
);
assert(
  !/\.reveal\s*\{[^}]*opacity:\s*0/s.test(styles),
  "static reveal content should not be hidden before runtime registration"
);
assert(
  !/\[data-pe-anim\]\s*\{[^}]*opacity:\s*0/s.test(styles),
  "static section animation content should not be hidden before runtime registration"
);
for (const readinessClass of ["pe-reveal-ready", "pe-anim-ready", "pe-ix-ready"]) {
  assert(!index.includes(readinessClass), `public HTML should strip ${readinessClass}`);
}
```

Add to `tests/public-responsive.test.js`:

```js
[
  ".reveal.pe-reveal-ready",
  "[data-pe-anim].pe-anim-ready",
  ".pe-ix-pending.pe-ix-ready",
].forEach((needle) => {
  assert(styles.includes(needle), `fail-open public styles should include ${needle}`);
});
```

- [ ] **Step 2: Run the regression scripts and verify RED**

Run:

```bash
node tests/editor-regression.test.js
node tests/public-responsive.test.js
```

Expected: editor regression FAILS because the readiness classes do not exist; responsive checks may also fail on the new selector assertion.

- [ ] **Step 3: Scope hidden CSS states to readiness classes**

Update the motion rules in `styles.css` to use this structure:

```css
.reveal { opacity: 1; transform: none; transition: opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1); }
.reveal.pe-reveal-ready { opacity: 0; transform: translateY(26px); }
.reveal.pe-reveal-ready.in { opacity: 1; transform: none; }

[data-pe-anim] { opacity: 1; transform: none; transition: opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1); }
[data-pe-anim].pe-anim-ready { opacity: 0; will-change: transform, opacity; }
[data-pe-anim].pe-anim-ready.pe-in { opacity: 1; transform: none; }
[data-pe-anim].pe-anim-ready[data-pe-anim="rise"] { transform: translateY(44px); }
[data-pe-anim].pe-anim-ready[data-pe-anim="fade"] { transform: none; }
[data-pe-anim].pe-anim-ready[data-pe-anim="zoom"] { transform: scale(0.9); }
[data-pe-anim].pe-anim-ready[data-pe-anim="slideL"] { transform: translateX(-52px); }
[data-pe-anim].pe-anim-ready[data-pe-anim="slideR"] { transform: translateX(52px); }

.pe-ix-pending {
  transition-property: opacity, transform;
  transition-duration: var(--pe-ix-duration);
  transition-timing-function: var(--pe-ix-ease);
  transition-delay: var(--pe-ix-delay);
}
.pe-ix-pending.pe-ix-ready { opacity: 0; }
```

Add `.pe-ix-ready` to every blur/transform starting-state selector so no custom interaction offset or filter applies before runtime registration.

- [ ] **Step 4: Register readiness only with working JavaScript paths**

Update the three initializers in `script.js`:

```js
reveals.forEach(function (el) { el.classList.remove("pe-reveal-ready"); });
if (reduce || !("IntersectionObserver" in window)) {
  reveals.forEach(function (el) { el.classList.add("in"); });
} else {
  reveals.forEach(function (el) {
    el.classList.remove("in");
    el.classList.add("pe-reveal-ready");
    io.observe(el);
  });
}
```

```js
var els = document.querySelectorAll("[data-pe-anim]:not(.pe-anim-ready)");
if (reduce || !("IntersectionObserver" in window)) {
  els.forEach(function (el) {
    el.classList.remove("pe-anim-ready");
    el.classList.add("pe-in");
  });
  return;
}
els.forEach(function (el) {
  el.classList.remove("pe-in");
  el.classList.add("pe-anim-ready");
  ao.observe(el);
});
```

In `initInteractions`, remove `pe-ix-ready` during reset. For scroll-triggered elements, call `ensureInteractionObserver()` first; only if the observer exists, add both readiness classes, store the config, and observe:

```js
ensureInteractionObserver();
if (!ixScrollObserver) {
  el.classList.add("pe-ix-in");
} else {
  el.classList.add("pe-ix-pending", "pe-ix-ready");
  ixConfigs.set(el, cfg);
  ixScrollObserver.observe(el);
}
```

Add the three readiness classes to `publish.sh`'s transient class set.

- [ ] **Step 5: Regenerate and verify GREEN**

Run:

```bash
./publish.sh
node tests/editor-regression.test.js
node tests/public-responsive.test.js
```

Expected: all commands exit 0 and both regression success messages appear.

---

### Task 3: Add production cache and security headers

**Files:**
- Modify: `tests/editor-regression.test.js`
- Modify: `netlify.toml`

**Interfaces:**
- Consumes: Netlify static header rules.
- Produces: immediately revalidated HTML/inspection CSS, immutable fingerprinted JavaScript/media, and restrictive site-wide security headers compatible with current resources.

- [ ] **Step 1: Add failing header assertions**

Read `netlify.toml` in `tests/editor-regression.test.js` and add:

```js
const netlify = fs.readFileSync(path.join(root, "netlify.toml"), "utf8");
includesAll(
  netlify,
  [
    'for = "/"',
    'for = "/index.html"',
    'for = "/styles.css"',
    'for = "/script.js"',
    'for = "/assets/*"',
    'Cache-Control = "public, max-age=0, must-revalidate"',
    'Cache-Control = "public, max-age=31536000, immutable"',
    'X-Content-Type-Options = "nosniff"',
    'X-Frame-Options = "DENY"',
    'Referrer-Policy = "strict-origin-when-cross-origin"',
    'Permissions-Policy = "camera=(), microphone=(), geolocation=()"',
    "Content-Security-Policy = \"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests\"",
  ],
  "Netlify resilience and security headers"
);
```

- [ ] **Step 2: Run the regression script and verify RED**

Run:

```bash
node tests/editor-regression.test.js
```

Expected: FAIL because `netlify.toml` contains no header rules.

- [ ] **Step 3: Add exact Netlify header rules**

Append these rules to `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/styles.css"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/script.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
node tests/editor-regression.test.js
```

Expected: `editor regression checks passed` and exit 0.

---

### Task 4: Cross-browser verification, repository completion, and delivery

**Files:**
- Verify: `index.editor.html`
- Verify: `styles.css`
- Verify: `script.js`
- Verify: `publish.sh`
- Verify: `netlify.toml`
- Verify: `tests/editor-regression.test.js`
- Verify: `tests/public-responsive.test.js`
- Verify: `docs/superpowers/specs/2026-07-13-cross-browser-resilience-design.md`
- Verify: `docs/superpowers/plans/2026-07-13-cross-browser-resilience.md`

**Interfaces:**
- Consumes: the completed source changes and generated `public/` output.
- Produces: verified commits on `main`, pushed to `origin/main`, with local and remote heads equal.

- [ ] **Step 1: Run the complete clean publish gate**

Run:

```bash
./publish.sh
node tests/editor-regression.test.js
node tests/public-responsive.test.js
git diff --check
```

Expected: publish reports all referenced assets copied; both test scripts pass; `git diff --check` prints nothing.

- [ ] **Step 2: Verify resource-failure and responsive browser states**

Start the repository server:

```bash
python3 serve.py
```

Use headless Chrome/CDP to verify 390 x 844, 768 x 1024, and 1440 x 900. Disable script execution with `Emulation.setScriptExecutionDisabled` and assert computed styles for the hero device, first feature, drift block, and footer remain visible. Inspect the resulting screenshots and confirm no horizontal overflow.

Use actual Safari against `http://localhost:8099/public/` to inspect the mobile/tablet-responsive page, wordmarks, hero phone, navigation, and motion. Confirm video requests return `206 Partial Content` in the server log.

- [ ] **Step 3: Review and stage every repository change**

Run:

```bash
git status --short --branch
git diff --stat
git diff --check
git add -A
git diff --cached --name-only
git diff --cached --check
git diff --cached --stat
```

Expected: the staged set includes the approved resilience work, this plan, and the existing TRT changes; no generated `public/` files are staged; both whitespace checks print nothing.

- [ ] **Step 4: Commit all remaining work**

Run:

```bash
git commit -m "Harden cross-browser site loading"
```

Expected: commit succeeds on `main` and includes all staged files.

- [ ] **Step 5: Push and verify remote equality**

Run:

```bash
git push origin main
git rev-parse HEAD
git rev-parse origin/main
git status --short --branch
```

Expected: push succeeds, the two hashes match, and status reports `main...origin/main` with no remaining changes.
