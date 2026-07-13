# Motion Smoothness Design

Date: 2026-07-13

## Purpose

Make the website's motion feel consistently smooth while preserving the energy of selected replay-on-scroll effects. The “Built to train” side entrance is the reference case: it should have a deliberate first entrance and a quicker repeat entrance when the visitor scrolls away and returns.

## Current Findings

- The generated public page holds a stable frame cadence in headless Chrome at a 1440 × 900 desktop viewport and at a 390 × 844 mobile viewport with 4× CPU throttling.
- The perceived roughness comes primarily from motion policy rather than sustained frame collapse. Current scroll effects range from 650 ms to 2,850 ms, every configured scroll interaction replays, and “Built to train” takes 2,550 ms plus a 150 ms delay.
- A single viewport pass can overlap the stat-band flap animation, multiple entrance transitions, the crosshair loop, the canvas field, and video work.
- The split-flap implementation uses multiple animation-frame loops and a forced layout read to restart each cell animation. It should be consolidated so it cannot compete with the nearby “Built to train” entrance.
- Reduced-motion handling already disables the principal entrance and decorative animations and must remain authoritative.

## Motion Policy

### First entrance and replay timing

Each scroll interaction has two runtime phases:

1. The first entrance uses the duration, delay, easing, and effect stored in `data-pe-interaction`.
2. A later replay uses half of the first duration, rounded to the nearest 50 ms and clamped to 300–550 ms. Replay delay is always 0 ms.

The runtime tracks whether each element has completed its first entrance. This state is transient and is not written into authoring HTML or editor state.

### Replay selection

Keep replay-on-scroll for lightweight, section-orienting motion:

- The measurement band and its number-flap sequence
- The “Built to train” section heading
- The printable-target strip
- The drift-section divider and heading accents

Use one-time entrances for heavier or redundant presentation motion:

- Hero image and hero title treatment
- Large feature rows, including the Live feature
- Video stages and media backgrounds
- Final call-to-action content

Hover, click, carousel, drift-wheel laser, crosshair, canvas, and video-loop behavior remain interactive or continuous as they are today. They are verified as part of the performance pass but are not converted into scroll entrances.

### Initial timing normalization

The authoring markup will use these first-entrance targets:

| Element | First entrance | Repeat entrance |
| --- | ---: | ---: |
| Measurement band | 900 ms, 100 ms delay | 450 ms, no delay |
| Measurement pulse | 700 ms, 50 ms delay | 350 ms, no delay |
| “Built to train” | 850 ms, 100 ms delay | 450 ms, no delay |
| Live feature | 650 ms, 100 ms delay, once | None |
| Printable-target strip | 850 ms, 100 ms delay | 450 ms, no delay |
| Drift divider | 700 ms, no delay | 350 ms, no delay |
| Drift heading accent | 700 ms, no delay | 350 ms, no delay |
| Hero image | 900 ms, 150 ms delay, once | None |

Existing 700–800 ms `.reveal` and `data-pe-anim` entrances that are already one-time remain unchanged unless verification shows a conflict.

## Runtime Design

### One interaction observer

`script.js` will manage all scroll-based `data-pe-interaction` elements with one shared `IntersectionObserver` instead of creating an observer per element.

- An entrance starts after the element reaches an intersection ratio of 0.18.
- A replaying element is re-armed only after it has fully left the observer root. This creates hysteresis and prevents animation state from flipping near the viewport boundary.
- One-time elements are unobserved after their first entrance.
- Before each entrance, the runtime selects the first-run or replay timing variables and then applies the visible class.
- A short-lived active class supplies `will-change: transform, opacity` only while an entrance is running. It is removed on completion or cancellation.
- `filter` transitions apply only to effects that actually use a filter. Fade and slide effects animate only `opacity` and `transform`.

The existing `repeat` control in the Customize panel remains the source of truth. No new saved-state fields or editor controls are required because repeat timing is derived consistently from the configured first duration.

### Split-flap scheduling

The measurement numbers will use one shared animation-frame scheduler for all cells. Cell flips use the Web Animations API when available, avoiding the current forced layout read. If that API is unavailable, digits still update and settle correctly without a forced animation restart.

Leaving the viewport cancels the active generation and settles every cell on its final character. Re-entering starts one fresh generation using the faster replay entrance timing.

### Page visibility and cleanup

Transient timers, animations, and active motion classes must clean up when a run completes. Existing `prefers-reduced-motion` behavior stays in force. This change does not add new page-visibility behavior; browser animation-frame suspension and the existing video lifecycle remain unchanged.

## Authoring and Publishing

Durable interaction settings are edited in `index.editor.html`; interaction behavior and presentation are implemented in `script.js` and `styles.css`. The generated `public/` folder is never hand-edited. After implementation, `./publish.sh` regenerates the public page and copies the exact runtime files Netlify will serve.

`editor.js` does not need new controls or saved fields. The Customize panel must continue to preview, apply, remove, save, and export interactions without writing transient first-run/replay state into saved markup.

## Accessibility and Compatibility

- `prefers-reduced-motion: reduce` shows content immediately and disables entrance, pulse, flap, and decorative replay motion.
- Content is never left transparent when `IntersectionObserver` is unavailable.
- Keyboard, pointer, carousel, and drift-wheel behavior is unchanged.
- The implementation remains dependency-free and compatible with the browsers currently supported by the static site.

## Verification

Implementation follows test-first development.

1. Extend `tests/editor-regression.test.js` with failing assertions for the shared observer, first-run/replay timing policy, full-exit re-arming, transient active class, reduced-motion fallback, normalized source settings, and removal of the split-flap forced-layout restart.
2. Run the regression script and confirm it fails for the intended missing behavior before production changes.
3. Implement the minimal runtime, style, markup, and editor-preservation changes.
4. Run `./publish.sh`, `node tests/editor-regression.test.js`, `node tests/public-responsive.test.js`, and `git diff --check`.
5. Profile the generated `public/` page in headless Chrome at desktop DPR 2 and mobile DPR 3 with 4× CPU throttling. Exercise every configured entrance in both directions. Confirm no long JavaScript tasks during the pass and no recurring frame gaps above 33 ms attributable to an entrance effect.
6. Confirm “Built to train” uses the full first entrance, fully leaves the observer root before re-arming, and then returns with the shorter replay timing.
7. Confirm reduced-motion mode reveals all content without running entrance or split-flap motion.

## Non-Goals

- Redesigning the website's visual language
- Removing the branded canvas, crosshair, drift-wheel, video, or carousel effects
- Adding third-party animation libraries
- Changing page copy, layout, media, or editor workflows unrelated to motion smoothness
