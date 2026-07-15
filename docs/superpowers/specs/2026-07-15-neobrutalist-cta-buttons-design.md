# Neobrutalist CTA Buttons Design

## Scope

Make three existing secondary calls to action more prominent without changing
their copy, destinations, layout placement, or form behavior:

- `Read the full setup guide`
- `See everything you need`
- `Open bug report form`

The authoring sources remain `index.editor.html` and `styles.css`; `public/`
continues to be generated only by `./publish.sh`.

## Visual direction

Peregrine is a dark, instrument-like dry-fire training site. The two guide
links should read as equivalent primary resource actions: laser-red fills,
dark ink text, near-square corners, a dark two-pixel outline, and a crisp
offset hard shadow. Hover raises the button toward the viewer; pressing it
collapses the shadow to create a tactile switch-like response.

The Tally support link uses the same geometry and interaction, but signals its
different role with a bone fill, ink text, and a recon-blue hard shadow. This
keeps it in Peregrine's palette while separating support from the two red guide
actions.

## Implementation boundaries

- Add one shared neobrutalist button class to the two guide links and one
  support variant class to the existing Tally link.
- Keep the existing `.btn` typography, inline-flex layout, link URLs, and the
  `target="_blank" rel="noopener noreferrer"` protection unchanged.
- Scope the new CSS to the new classes, rather than changing the global ghost
  button treatment used by the navigation.
- Preserve visible keyboard focus and disable transform-based movement when
  `prefers-reduced-motion: reduce` is active.

## Verification

1. Regenerate `public/` with `./publish.sh`.
2. Extend the editor regression check to assert the published markup and
   production CSS contain the new CTA classes and role-specific styling.
3. Run `node tests/editor-regression.test.js`.
4. Inspect the generated desktop and mobile site to confirm the two guide
   buttons match, the support button remains distinct, and the Tally link
   safety attributes remain present.
