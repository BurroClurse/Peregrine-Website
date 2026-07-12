# Tally Support Form Design

## Goal

Replace the email-draft support flow with the Peregrine Tally bug-report form while keeping `support@peregrinedryfire.com` visible and easy to copy. The email address must not be a link or button.

## Website

The existing Support & Bug Reports area beneath the launch signup will contain the supplied Tally embed. The iframe will use `https://tally.so/embed/QKW7Vk?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`, retain its accessible title, load lazily, and use Tally's official loader so dynamic height works.

Below the form, the page will display `support@peregrinedryfire.com` as plain text for people who prefer email. CSS will explicitly permit text selection. The old bare `mailto:` link and copy describing the app's email-template workflow will be removed. Existing support-bundle privacy guidance will remain where it is still accurate.

The authoring page remains the source of truth. `publish.sh` will continue generating the clean `public/` site, including the form embed but excluding editor-only assets.

## iOS App

Settings → Help & Support will replace the current Contact Support email-draft button with a Report a Bug button that opens `https://tally.so/r/QKW7Vk` through SwiftUI's `openURL`. Opening the hosted form externally avoids adding a WKWebView, JavaScript bridge, or web-navigation state to the app.

The support address will remain visible as plain SwiftUI `Text` with native text selection enabled, allowing it to be copied without treating the address as an action. The existing generated email-template code will be removed if it has no remaining callers. Support-bundle export and its privacy behavior will not change.

## Failure Behavior

If Tally's script does not load on the website, the iframe loader's fallback assigns the embed URL directly. If the hosted form cannot be reached, the visible support email remains available to copy.

On iOS, `openURL` handles the external URL using the system browser. The selectable email address remains available independently of that action.

## Security and Privacy

Only the fixed HTTPS Tally URLs are used; no visitor-controlled URL is accepted. No secrets or personal forwarding addresses are added to either repository. The embed receives no broader permissions through an `allow` attribute. The site does not collect or relay form contents itself.

## Verification

Website regression coverage will require the exact Tally form ID and embed parameters, require one Tally loader, require the plain selectable email text, and reject any support-address `mailto:` link. Publishing tests will verify the generated `public/` output.

iOS tests will require the exact HTTPS form URL and verify the support email constant remains `support@peregrinedryfire.com`. Existing email-draft tests will be replaced or removed with the implementation they cover. The relevant website Node tests and iOS XCTest suite will be run after implementation.
