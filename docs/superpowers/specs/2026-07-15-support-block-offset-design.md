# Support Block Offset Design

## Goal

Move the existing three-line support and bug-report block lower in the CTA’s
background-video area without changing its copy, link behavior, or the 18px
gaps between its title, button, and email fallback.

## Design

The CTA support elements already share the `.signup__contact` wrapper. Change
only that wrapper’s responsive top margin from `clamp(80px, 10vw, 120px)` to
`clamp(120px, 15vw, 180px)`. This moves the whole group down by 40px at the
small breakpoint and by up to 60px on wider screens while leaving the internal
spacing rules unchanged: the support button keeps its 18px top margin and the
email fallback keeps its 18px top margin.

## Boundaries

- Keep the CTA title, description, signup form, video, scrim, and CTA padding
  unchanged.
- Keep the Tally link, safe external-link attributes, and copyable support
  email unchanged.
- Change the authoring stylesheet only; regenerate `public/` through
  `./publish.sh`.

## Verification

Extend the published-site regression assertion to require the new responsive
margin, run the test first to demonstrate the old stylesheet fails it, then
regenerate `public/` and rerun the full editor and responsive checks.
