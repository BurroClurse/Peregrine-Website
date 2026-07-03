# Peregrine — Website

Single-page marketing site for **Peregrine**, the dry-fire laser training app for iPhone.
Plain HTML/CSS/JS — no build step, no dependencies.

## Run it

Use the included **range-capable** server so the walkthrough video plays in Safari:

```bash
cd ~/Desktop/Peregrine-Website
python3 serve.py          # → http://localhost:8099
```

> ⚠️ Don't use `python3 -m http.server` for the video. It never sends HTTP
> `206 Partial Content`, and Safari/iOS refuse to play a `<video>` without it —
> you press play and nothing happens. `serve.py` adds byte-range support, which
> fixes it. (Chrome is more forgiving, so the bug looks "random" across browsers.)

## Structure

```
index.html        # all markup, one page
styles.css        # all styles (design tokens at top of file)
script.js         # nav, scroll reveals, cosmos particles, carousels, per-section anims, video, email
serve.py          # range-capable local server (so video plays in Safari)
editor.css        # styles for the Customize panel  (delete before publishing)
editor.js         # the Customize panel logic        (delete before publishing)
assets/
  favicon.svg
  peregrine-wordmark.png   # app logo (reference)
  icons/          # gear icons from the app (Firearm, Cartridge, Printer, Stand, TRT)
  web/            # web-optimized images, target cards, video-poster.jpg
  screens/        # source screenshots + *_clean.png (status bars cropped)
  video/          # Peregrine_Intro_720.mp4 (walkthrough, ~7.5 MB, used by the page)
DESIGN.md         # design rationale, palette, type, sections
```

## The Customize panel (editor)

Two buttons sit bottom-right: **✎ Edit** (a quick toggle for click-to-edit) and **☰ Customize**
(opens the full panel). You can also add `#edit` to the URL. With no code you can:

- change the **display + body fonts** and **text size** — the metallic **Peregrine logo keeps
  its own font** and is never affected
- change **every app color** (laser red, amber, gold, recon blue, green, background)
- toggle + tune **effects**: cosmos particles **with a density slider**, hero crosshair, and
  film grain **with a strength slider** (grain now uses a *soft-light* blend so it's actually
  visible on the dark theme)
- give **any individual section** its own **entrance animation** (rise / fade / zoom / slide) and
  **accent glow** — the ✦ button on each row in the Sections list
- **Edit text & images**: turn it on, then click any heading/paragraph to retype it, or any
  image to swap in your own
- **Move & resize blocks** (Layout mode): turn it on, then **drag any block** — text, image, a
  whole feature card, even the **drift wheel** — to reposition it. A floating toolbar appears to
  **scale** it up/down, **align** text, **reset**, or **hide/remove** it. Arrow keys nudge the
  selection; Delete hides it.
- add **image/video backgrounds to any section**, including the bundled motion MP4 in
  `assets/hero/1783014209067_g0wdb146me.mp4` (Background media group)
- add a **Motion spacer** block when the MP4 needs its own adjustable space between sections;
  reorder it in the Sections list, then select it in Layout mode and use **Height**
- **reorder / show / hide / remove** sections, delete added sections that are no longer visible,
  and **add blocks** (heading, statement, image, image+text, quote, divider)
- **Undo / Redo** any change — the ↶ ↷ buttons in the panel header, or ⌘Z / ⇧⌘Z

> The drift "clock" diagram is an SVG (not a photo), so it can't be *swapped* like an image — but
> in Layout mode you can move, scale, or hide it like any other block.

Changes auto-save to *your browser* while you work. To make them part of the local
`index.html`, click **Save changes to index.html** in the Customize panel. If your browser
allows direct file writing, choose this folder's `index.html` and replace it; otherwise the
button downloads an updated `index.html` for you to put in this folder.

To publish a clean page without the editing controls:

1. Click **Export clean public index.html** — it downloads a clean copy with your changes baked in.
2. Replace this folder's `index.html` with that file.
3. Before going live, delete `editor.css`, `editor.js`, and the `#peDock` button cluster in
   `index.html` (the export already drops the editor references for you).

Use **Reset all changes** to discard everything and reload the original.

## Common edits (by hand)

- **Colors / fonts / tokens:** the `:root` block at the top of `styles.css`.
- **Copy:** all in `index.html`.
- **Email signups:** `script.js` → `CONFIG` at the top.
  - `notifyEmail` is set to `tylerjbeattie@gmail.com`. With no `formEndpoint`, submitting the
    form opens the visitor's email app pre-addressed to you (they hit send).
  - For silent collection straight to your inbox, make a free form at Formspree/Getform/Basin
    and paste its URL into `CONFIG.formEndpoint`.
- **Walkthrough video:** embedded in `#watch` as a portrait `<video controls>` playing
  `assets/video/Peregrine_Intro_720.mp4` (9:16, ~50s, with sound, 7.5 MB). Swap the file or
  `<source src>` and regenerate `assets/web/video-poster.jpg` to change it. **If it won't play,
  it's the server, not the file** — use `python3 serve.py` (see "Run it" above). Tapping the
  phone frame also starts playback.
- **Drills / Targets carousels:** the `<div class="carousel">` blocks in `index.html`. Add a
  `.carousel__slide` to add an image; arrows + dots are wired automatically.
- **Regenerate screenshots:** drop new captures in `assets/screens/`, crop the status bar
  (`*_clean.png`), then re-run the PIL resize step in `DESIGN.md` to refresh `assets/web/`.

## Search / indexing (SEO)

Domain: **peregrinedryfire.com** (registered at Porkbun). The HTML is already
crawler-friendly (real spaced text, semantic tags, headings, alt text). Added:

- **Canonical URL**, **Open Graph** + **Twitter card** tags with **absolute** image URLs
  (`https://peregrinedryfire.com/assets/web/wordmark-lockup.jpg`).
- **JSON-LD** (`SoftwareApplication`) block in `<head>` — invisible to visitors, read by
  Google/AI. When the app is live, add `"downloadUrl"` / `"url"` with the App Store link.
- **`robots.txt`** (allow all + sitemap reference) and **`sitemap.xml`** at the site root.

All URLs use the **non-`www`** form (`https://peregrinedryfire.com/`). If you decide to serve
from `www.` instead, update the canonical/OG/sitemap/robots URLs to match and set a host redirect
so only one form is indexed. After going live, submit the site in **Google Search Console** and
add the sitemap there.

## Notes

- Responsive desktop + mobile; respects `prefers-reduced-motion`; keyboard-focus styles included.
- Safe to delete (build leftovers): `assets/video/ffmpeg2pass-0.log*`, the 55 MB
  `assets/video/Peregrine_Intro_1080.mp4` original (a copy lives in `~/Desktop/Peregrine_Documents`),
  and `__petest.html` (a throwaway editor test page).
