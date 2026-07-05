# AGENTS.md — Peregrine marketing site (peregrinedryfire.com)

Standalone HTML/CSS/JS landing page for the Peregrine dry-fire iOS app.
No build step. The app repo lives at `~/Developer/Peregrine-iOS` (drift-zone
copy in `Test4-LaserDotDetector/Detection/DriftAnalyzer.swift` is the source
of truth for the drift wheel's text).

## Run & test

```bash
python3 serve.py                        # http://localhost:8099 (range-capable;
                                        # plain http.server breaks Safari video)
node tests/editor-regression.test.js    # regression checks (plain script — do
                                        # NOT use `node --test`)
```

serve.py sends `Cache-Control: no-cache` for html/css/js; images/video stay
cacheable (bust them with `fetch(url, {cache:'reload'})` when re-encoded).

## Files

- `index.html` — the whole page. Head carries `#pe-overrides` + `#pe-saved-state`
  (baked editor state). `?v=` cache-busters on the four asset links.
- `styles.css` — design tokens at top; drift wheel styles under `dw-`.
- `script.js` — site runtime (dependency-free; must survive editor Export).
  Drift wheel, carousels, count-up, laser ping, video handling.
- `editor.js` / `editor.css` — the dev-only Customize panel. Images live in
  IndexedDB (`peregrineEditorAssets`, `pe-asset:` refs); Export writes real
  files to `assets/edited/` via showDirectoryPicker. Strip editor refs +
  `#peDock` + `#pe-saved-state` before publishing (Export does this).
- `docs/specs/`, `docs/plans/` — design docs.

## Git

Worktree is here, but the git dir is **outside iCloud**:
`~/Developer/Peregrine-Website.git` (pointer in `.git`). iCloud once renamed
the pointer to ".git 2" — if git says "not a repository", `mv ".git 2" .git`.
If git *hangs*, iCloud evicted files: `brctl download ~/Desktop/Peregrine-Website`.

## Gotchas

- Device frames: children size chrome in `cqw` (container queries), but the
  frame's own box must stay px — an element's cqw can't reference itself.
- Editor Layout selection binds `pointerdown` on `[data-pe-move]`, not click.
- Codex-in-Chrome MCP tabs are `document.hidden`: rAF/IntersectionObserver
  are paused and `video.play()` awaits hang — verify animations in headless
  puppeteer; `navigate` to the already-open URL does not reload (use
  `location.reload()` via JS).
