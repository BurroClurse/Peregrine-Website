# Tactile CTA Press Design

## Goal

Make the three existing neobrutalist home-page actions feel physically pressable while preventing their labels from being selected or showing the mobile tap-highlight flash during a press.

## Scope

The shared `.btn--neo` style covers exactly three published actions:

1. `Read the full setup guide`
2. `See everything you need`
3. `Open bug report form`

Other button styles, selectable support-email text, links, and editor controls remain unchanged.

## Interaction design

- At rest, each CTA sits above its 5px colored offset shadow.
- On hover-capable devices, it moves 2px toward that shadow and the offset shadow reduces to 3px.
- While a pointer or keyboard activation is held, it moves the remaining distance to 5px and the colored offset shadow collapses. A small matching ambient glow remains, so it looks seated in the shadow rather than abruptly disappearing.
- Releasing it returns the button to its prior state through the existing short CSS transition. No JavaScript, timers, or persistent pressed class is needed.
- The support variant keeps its blue offset shadow; the two guide CTAs keep their light amber-gold offset shadow.

## Text-selection and mobile behavior

The three CTAs disable standard and WebKit text selection, the WebKit touch callout, and the WebKit tap-highlight color. This prevents a held press from selecting the label or overlaying it with the black mobile tap highlight. The rule is limited to `.btn--neo`, preserving the deliberately copyable support email.

## Accessibility and compatibility

- Native anchors/buttons retain their existing destinations, keyboard activation, semantics, and focus-visible behavior.
- Under `prefers-reduced-motion: reduce`, hover and press position changes remain disabled. The pressed state still removes the offset shadow immediately, preserving a non-motion confirmation that the control is held.
- No user input is rendered or processed, so this CSS-only change does not create an application-security surface.

## Verification

1. Extend the regression script to assert the scoped selection/tap-highlight guard and the full-depth active state for both color variants.
2. Confirm the test fails before the style change, then passes after it.
3. Regenerate `public/` with `./publish.sh` and run `node tests/editor-regression.test.js` plus `git diff --check`.
4. In a browser, hold each of the three CTAs with a pointer and touch emulation: it must align with the shadow while held, return cleanly on release, and never show selected/black-highlighted text.
5. Repeat the visual hold check with Reduce Motion enabled: no positional animation, but the offset shadow still collapses while held.
