# Cardinal Drift Wheel Disclosure Design

## Scope

Limit the public Drift Diagnosis demonstration to four cardinal clock positions:
12, 3, 6, and 9. Preserve the complete twelve-wedge clock silhouette, its current
rainbow hue order, the right/left-handed toggle, and the existing laser-style
selection feedback.

The authoring sources remain `index.editor.html`, `script.js`, and `styles.css`.
The Netlify-facing `public/` output must continue to be generated only through
`./publish.sh`.

## Disclosure boundary

- Publish diagnosis names, cause text, and correction text only for 12, 3, 6,
  and 9 o'clock.
- Remove the other eight diagnosis records from the source and generated
  JavaScript. Do not expose them through rendered HTML, accessible labels,
  keyboard focus, or interaction state.
- Replace `Flags the fix when 3 of your last 5 shots drift the same way` with
  `Flags the fix when a repeated pattern appears`.
- Keep the wheel's marketing statement that clock positions map to causes and
  fixes; the four visible examples demonstrate that claim without publishing
  the complete lookup table.

## Interaction design

- Keep twelve visible, colored wedges and all twelve clock numerals.
- Mark 12, 3, 6, and 9 as active demonstration wedges. They retain the current
  colored treatment, hover/focus response, laser pulse, readout update, mouse,
  touch, and keyboard selection behavior.
- Mark 1, 2, 4, 5, 7, 8, 10, and 11 as muted demonstration-only wedges. They
  retain their current hue but use a darker, lower-opacity version at rest and
  dim further on hover. They do not activate, pulse, move the diagnosis marker,
  update the readout, receive keyboard focus, or identify a diagnosis.
- Automatic playback follows the fixed clockwise sequence 12, 3, 6, 9 and then
  repeats. Hovering the wheel pauses playback; leaving resumes it. Selecting a
  cardinal wedge stops playback as it does today.
- Keyboard arrow navigation moves only among the four cardinal wedges.
- Under `prefers-reduced-motion: reduce`, show a static cardinal diagnosis and
  do not start automatic playback.

## Handedness behavior

- Preserve both Right-handed and Left-handed controls and the persisted choice.
- Right-handed mode publishes only the four right-handed cardinal records.
- Left-handed mode mirrors the permitted cardinal records: 12 and 6 retain
  their vertical meaning, while 3 and 9 exchange direction and handed wording.
- Switching handedness keeps the selected clock position when possible and
  refreshes the corresponding permitted readout; it never reveals a muted
  position.

## Verification

1. Add regression assertions before implementation and confirm they fail.
2. Assert that only four diagnosis objects are present and that the eight
   removed diagnosis names and exact threshold wording are absent from both
   source and published output.
3. Assert that the cardinal index sequence, muted class, and cardinal-only
   keyboard/automatic behavior are present.
4. Regenerate `public/` with `./publish.sh` and run
   `node tests/editor-regression.test.js`.
5. Browser-check both handedness modes, automatic cycling, cardinal hover and
   selection, muted-wedge hover, and reduced-motion behavior.

