# Hero Photo and Wordmark Design

## Summary

Update the website hero without changing the corrected iPhone mockup geometry. The phone will display the newly supplied training photo, and the large hero title will use the existing transparent metallic Peregrine wordmark that matches the supplied reference image.

## Scope

- Replace only the image displayed inside the hero iPhone.
- Preserve the hero phone's 280px desktop maximum width, established screen aspect ratio, island spacing, side buttons, and responsive sizing.
- Center-crop the new 720x1280 photo inside the fixed phone screen with the existing `object-fit: cover` treatment.
- Replace only the large hero `Peregrine` title with `assets/peregrine-wordmark-metallic.png`.
- Keep the navigation and footer branding unchanged.

## Markup and Styling

- Keep the hero title as the page's `<h1>`.
- Place the transparent wordmark image inside the hero heading with accessible `alt="Peregrine"` text.
- Add a dedicated hero wordmark class with responsive width and automatic height so the asset scales cleanly without distortion.
- Retain the existing tagline beneath the wordmark and its current animation behavior.
- Store the new training photo under `assets/web/` with a descriptive filename and update the hero image's intrinsic dimensions and alt text.

## Validation

- Add regression assertions for the new hero photo reference and hero wordmark markup/styles.
- Confirm the previous plain-text hero brand is no longer published.
- Run `./publish.sh`, which regenerates `public/` and executes editor and responsive regression checks.
- Verify the rendered hero at desktop and mobile widths, confirming the phone frame remains unchanged and the wordmark does not overflow or distort.

## Out of Scope

- Navigation logo changes.
- Footer logo changes.
- Changes to the phone frame geometry or controls.
- Changes to the supplied photo beyond browser-side cropping.
