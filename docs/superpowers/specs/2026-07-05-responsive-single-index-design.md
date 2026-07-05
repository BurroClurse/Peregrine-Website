# Peregrine Website Responsive Single-Index Design

## Goal

Make the Peregrine marketing site work cleanly on desktop, phones, and iPads while keeping one public `index.html` as the source of truth and preserving the current desktop design language.

## Current Findings

- The site is already structured as a single static page with `index.html`, `styles.css`, and `script.js`; there is no build step.
- `styles.css` already includes responsive breakpoints, including a `max-width: 920px` collapse for nav, hero, feature rows, and drift.
- The current public `index.html` contains many inline layout values from the Customize/Layout editor: `transform`, fixed `width`, fixed `height`, and `max-width:none`.
- The highest-risk inline layout values are in the hero phone, drift section, drift wheel, drift screenshot carousel, and final CTA.
- The current `node tests/editor-regression.test.js` expects an authoring shell with `editor.css` and `editor.js`, while the active public `index.html` is a clean export. Responsive work needs a public-export test path.
- The local checkout expects a `.git` pointer to `/Users/tylerbeattie/Developer/Peregrine-Website.git`; that git dir exists.

## Decision

Use one responsive `index.html`.

Do not create separate mobile and desktop HTML files unless a later requirement asks for a meaningfully different mobile experience. Separate files would duplicate Netlify form markup, SEO metadata, canonical URLs, asset cache-busters, editor export logic, and site runtime behavior. That would make future content and launch updates easier to drift.

## Required Backup

Before implementation changes touch site files, create a complete timestamped backup of the current website folder contents.

The backup should preserve the current public page exactly enough to restore it if the responsive changes are not preferred. It should include:

- `index.html`
- `styles.css`
- `script.js`
- `editor.js`
- `editor.css`
- `serve.py`
- `README.md`
- `assets/`
- `docs/`
- legacy/index variants currently present in the folder

The implementation plan should use a backup folder under the repo, such as:

```text
backups/2026-07-05-pre-responsive-mobile/
```

The backup folder should not be edited during responsive implementation.

## Design Principles

- Preserve the desktop visual system: dark range atmosphere, metallic Peregrine branding, laser red accent, amber/gold highlights, iPhone hardware frames, drift wheel, target video loop, walkthrough phone, and final CTA mood.
- Mobile should feel like the same site, not a simplified alternate campaign page.
- Favor CSS responsiveness and export hygiene over duplicated markup.
- Keep device frames proportional. The phone frame itself should stay pixel/clamp sized; internal chrome can continue using `cqw`.
- Avoid horizontal overflow. No section should require `overflow-x` clipping to hide broken placement.
- Keep the page useful with reduced motion enabled.

## Responsive Architecture

### HTML

Keep the semantic section order:

1. Nav
2. Hero
3. Measurement band
4. Feature rows
5. Drift diagnosis
6. How it works
7. Kit
8. Walkthrough video
9. CTA
10. Footer

Remove or neutralize inline editor layout that should not control mobile flow. Keep inline custom properties used by interactions, colors, or media tuning when they do not affect responsive placement.

### CSS

Add responsive overrides in `styles.css` that protect the mobile and tablet layouts from desktop editor positioning:

- At tablet widths, stack hero, feature rows, and drift content without changing the desktop composition.
- At phone widths, reset unsafe inline transforms for major content containers, cap phone widths with `min()`/`clamp()`, and keep forms full-width.
- For iPad portrait and landscape, avoid oversized hero/drift devices and keep content centered without off-screen translation.
- Keep the current desktop breakpoints where they work; only add targeted overrides for the broken surfaces.

### Editor Export

Update `editor.js` so clean public export does not preserve layout edits that are unsafe for responsive rendering. The editor may still allow desktop layout experimentation, but export should either:

- strip responsive-hostile inline layout from known public containers, or
- annotate layout edits so CSS can disable them below specific breakpoints.

The implementation should choose the smallest change that prevents current mobile breakage and does not break the Customize panel's normal save/export workflow.

### Tests

Add or adjust regression coverage so there are two concepts:

- Authoring-shell checks for `editor.css`, `editor.js`, editor controls, and saved state.
- Public-export checks for clean `index.html`, no editor shell, no unresolved assets, and no mobile-hostile inline layout on known section containers.

Add viewport verification with a browser automation script or equivalent screenshot/check script covering:

- desktop
- iPhone SE width
- modern iPhone width
- iPad portrait
- iPad landscape

Minimum acceptance checks:

- no horizontal document overflow
- nav menu opens and links are reachable on mobile
- hero headline, phone, and signup form fit without overlap
- measurement band wraps cleanly
- feature cards stack predictably
- drift wheel/readout/screenshots are visible and usable
- walkthrough video remains playable through `serve.py`
- CTA title, copy, and form fit on mobile
- reduced-motion mode leaves content visible

## Netlify

Netlify should continue serving the static site root. No Netlify edge split or alternate mobile route is needed.

Use the current static deployment flow:

1. Verify locally with `python3 serve.py`.
2. Run regression checks.
3. Create a Netlify preview deploy or branch deploy.
4. Check the preview on desktop, phone, and iPad before production.

## Non-Goals

- Do not redesign the site.
- Do not change the app positioning or copy except where text wrapping requires a minor line-break-safe adjustment.
- Do not create a framework build step.
- Do not replace the current editor.
- Do not change the Peregrine iOS app repo.

## Open Implementation Choice

The implementation plan should decide whether the cleanest fix is:

1. Remove unsafe inline layout directly from current `index.html` and prevent it from returning on export.
2. Leave inline layout in place but override it below breakpoints with high-specificity responsive CSS.
3. Use a hybrid: clean the worst current inline layout, then add CSS safeguards and export sanitation.

Recommended choice: hybrid. It reduces immediate mobile breakage while preventing the same class of problem from coming back.
