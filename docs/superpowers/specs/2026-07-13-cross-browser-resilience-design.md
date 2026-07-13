# Cross-Browser Page Resilience Design

**Date:** July 13, 2026

**Status:** Approved for implementation planning

## Problem

The live landing page can intermittently degrade in Safari into three visible
failure states:

1. individual wordmark or hero images show broken-resource icons;
2. motion-controlled content remains blank when the runtime is unavailable;
3. the stylesheet is unavailable and Safari renders the page as raw HTML.

The deployed files currently exist and return successful responses. The weak
point is how the browser is asked to retrieve and render them:

- Netlify's default browser-facing cache policy is
  `Cache-Control: public, max-age=0, must-revalidate`, so CSS, JavaScript, and
  media must be revalidated before a stale browser copy may be reused;
- the production page depends on a separate stylesheet request for all layout;
- `.reveal`, `[data-pe-anim]`, and `.pe-ix-pending` can hide content before
  `script.js` has successfully registered the matching animation;
- only selected assets currently carry manual `?v=` cache-busting values.

The page therefore exposes a transient resource request failure directly to
the visitor instead of retaining a usable baseline.

## Goals

- If the HTML response loads, the whole page remains styled and readable even
  when the external JavaScript request fails.
- Motion remains progressive enhancement: JavaScript may animate content, but
  it may never be required to make content visible.
- Wordmarks, the hero photograph, icons, videos, and other media are cached in
  the visitor's browser after a successful load and receive a new URL on every
  deployment.
- The authoring/public boundary remains unchanged:
  `index.editor.html`, `styles.css`, and `script.js` are source files;
  `./publish.sh` generates `public/`; Netlify publishes only `public/`.
- The site continues to respect `prefers-reduced-motion`.
- The production response includes conservative security headers that do not
  break Google Fonts, the Netlify signup form, or the external Tally link.
- Verification covers phone, tablet, and desktop layouts, including Safari.

## Non-Goals

- Do not add a service worker or offline application lifecycle.
- Do not redesign the page or change its visual appearance, copy, animation
  timing, or section order.
- Do not inline image or video binaries into the HTML.
- Do not change the Customize editor's saved-state model.
- Do not hand-edit generated files under `public/`.

## Architecture

### 1. Atomic styled HTML shell

`publish.sh` will read `styles.css`, version its local asset references, and
replace the production `<link rel="stylesheet" href="styles.css?...">` with a
single `<style data-peregrine-styles>` block in `public/index.html`.

The source page will continue linking to `styles.css` so the Customize editor
and local authoring workflow remain unchanged. `public/styles.css` will still
be generated for inspection and regression tests, but the production HTML will
not depend on a second request to obtain its layout.

This makes the HTML and its visual shell one atomic response. A successful HTML
load can no longer produce the raw, unstyled state shown in the screenshots.

### 2. Fail-open motion

Static CSS will make all content visible by default. Hidden starting states
will apply only after `script.js` registers a specific element for motion:

- `.reveal.pe-reveal-ready` for the original reveal system;
- `[data-pe-anim].pe-anim-ready` for per-section animations;
- `.pe-ix-pending.pe-ix-ready` for custom interactions.

The runtime will add the corresponding readiness class immediately before it
attaches the element to a working observer or interaction handler. Reduced
motion and unsupported-observer paths will leave the element visible and will
not add a hidden readiness state.

The publish step will remove readiness classes if the editor ever serializes
them. Therefore:

- no JavaScript means visible, static content;
- a failed `script.js` request means visible, static content;
- supported JavaScript means the current effects run normally;
- reduced-motion visitors receive visible content without animation.

### 3. Content-fingerprinted static resources

`publish.sh` will calculate a SHA-256 content fingerprint for every local
`assets/...` file referenced by generated HTML, CSS, and JavaScript. Existing
manual `?v=` values will be replaced rather than appended. The generated
`script.js` URL will use a fingerprint of the generated script content.

For example, a generated reference will have this shape:

```text
assets/peregrine-wordmark-metallic.png?v=2ec7d85ebfc3
```

The first 12 lowercase hexadecimal characters are sufficient for this static
site's cache key while keeping generated URLs readable. Unchanged files retain
the same URL across deployments and reuse the visitor's cached response.
Changed files receive a new URL automatically.

The existing asset discovery/copy pass will continue to extract the underlying
path without the query string and will fail the publish if a referenced source
asset is missing.

### 4. Browser cache and security headers

`netlify.toml` will keep HTML immediately revalidatable while allowing
versioned static resources to remain fresh in the browser:

- `/` and `/index.html`:
  `Cache-Control: public, max-age=0, must-revalidate`;
- `/script.js` and `/assets/*`:
  `Cache-Control: public, max-age=31536000, immutable`;
- `/styles.css`, retained only as an unreferenced inspection/test artifact:
  `Cache-Control: public, max-age=0, must-revalidate`.

Netlify automatically invalidates changed static assets at its edge on a new
atomic deploy. The versioned browser URLs prevent an older browser response
from being mistaken for the current deployment.

All production paths will also receive this exact content security policy:

```text
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests
```

`'unsafe-inline'` remains limited to scripts and styles because the current
page intentionally contains inline structured data, a generated inline
stylesheet, editor-authored style attributes, and the `pe-overrides` style.
All executable network scripts remain limited to this origin.

All production paths will also receive:

- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

The policy will keep `form-action 'self'`, `frame-ancestors 'none'`,
`object-src 'none'`, and `base-uri 'self'`. The Tally support link remains a
normal top-level navigation and does not require a frame or cross-origin form
permission.

## Error Handling

- A missing asset remains a publish error and prevents deployment.
- A failed JavaScript request produces a styled, readable page without motion.
- A failed image request affects only that image. Unchanged content-fingerprinted
  assets remain reusable from the browser cache across deployments after a
  successful visit.
- Failed Google Font requests fall back to the existing system font stacks.
- Video playback retains the existing helpful error state and byte-range
  handling.
- The page will not install a service worker, so there is no independent cache
  lifecycle capable of serving a stale HTML shell.

## Testing

### Automated regression coverage

Extend `tests/editor-regression.test.js` and
`tests/public-responsive.test.js` to assert that:

- generated HTML contains the inline production stylesheet and no production
  stylesheet link;
- generated HTML, CSS, and JavaScript use the correct content fingerprint for
  every local asset reference and for `script.js`;
- every referenced asset still exists in generated `public/assets/`;
- the three motion systems hide elements only when their readiness class is
  present;
- the publish step strips serialized readiness/runtime classes;
- `netlify.toml` contains the intended cache and security header rules;
- the source authoring page still links to `styles.css` and `editor.css`.

Each behavior change will follow a red-green cycle: add the assertion, verify
that it fails against the current implementation, implement the smallest
change, then rerun the full publish regression suite.

### Browser verification

After `./publish.sh` succeeds:

1. run the normal headless mobile render at 390 x 844;
2. disable external JavaScript and verify the hero, phone, sections, and footer
   remain visible and styled;
3. throttle the browser and reload twice to verify content-fingerprinted media
   is served from the browser cache;
4. verify 768 x 1024 tablet and 1440 x 900 desktop layouts;
5. inspect the page in actual Safari at phone/tablet-responsive sizes;
6. verify the walkthrough and ambient videos still receive byte-range
   responses and play when eligible;
7. after deployment, inspect live HTML, JavaScript, representative image, and
   video response headers.

## Source and Generated Files

Expected source changes:

- `publish.sh` — inline/version production resources and strip readiness state;
- `script.js` — register readiness classes only with working motion handlers;
- `styles.css` — make static content visible and scope hidden states to runtime
  readiness classes;
- `netlify.toml` — browser caching and production security headers;
- `tests/editor-regression.test.js` — publishing, versioning, motion, and header
  regressions;
- `tests/public-responsive.test.js` — visible fail-open responsive baseline.

`index.editor.html` should not require reliability-specific markup changes.
Its currently uncommitted TRT copy change must be preserved. `public/` remains
generated and ignored; it will be refreshed only through `./publish.sh`.

## Acceptance Criteria

- Loading `public/index.html` without `script.js` produces a styled page with
  all primary content visible.
- The live production HTML no longer depends on an external stylesheet request.
- Every deployed local media reference carries its correct content fingerprint.
- Repeat visits may reuse versioned static resources without revalidation.
- Existing motion behavior still runs when supported and remains disabled for
  `prefers-reduced-motion`.
- Both repository regression scripts pass after a clean publish.
- Phone, iPad/tablet, and desktop checks show no horizontal overflow, broken
  wordmark layout, empty hero phone, or raw-HTML state.
- Existing concurrent TRT copy/style/test edits remain intact and covered by
  the regenerated public output.
