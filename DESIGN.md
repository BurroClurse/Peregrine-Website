# Peregrine — Website Design Notes

A single-page, cinematic landing site for **Peregrine**, a dry-fire laser training app for
iPhone. The page should feel like an extension of the app: dark, precise, instrument-like.

## Audience & job
- Audience: both competitive shooters (IDPA/USPSA standards, classifiers, par times) and
  everyday dry-fire practitioners. Tone: credible, plain, not salesy.
- Job: explain what Peregrine is, show real screens, and capture launch emails
  (Coming Soon — app not yet on the App Store).

## Palette (from the app)
- `--ink #0a0a0c` base, `--surface #15151b` cards
- `--laser #ff3a23` hot crosshair red — the action/signature accent
- `--recon #8abce0` cool blue — data & precision (matches the app's target/data labels)
- `--amber #e6a063` / `--gold #f4d49a` — warm, used sparingly (wordmark, scores)
- `--bone #f2efe6` text, `--mute #9a958c` secondary

## Type
- Display: **Saira Condensed** (800/900) — tall, athletic, tactical headlines
- Technical/labels/data/buttons: **Chakra Petch** — squared, instrument-panel feel
- Body: **Archivo** — sturdy, neutral with a touch of character

## Signature
A thin hot-red laser **crosshair that acquires target on load** (vertical + horizontal lines
sweep in and converge, reticle pulses once). Reused as quiet section dividers (a hairline with
a center tick). Straight from the app splash. Everything else stays quiet so this is THE element.

## Sections
1. Nav (transparent over hero, solidifies on scroll) + Coming Soon CTA
2. Hero — crosshair signature, metallic wordmark lockup, headline, email signup, splash screen
3. Stat band — the app's real metrics vocabulary (Shots · Score · Pts/min · Par · Split)
4. Features — alternating rows, each paired with a real screen (Live, Drills, Targets, History)
5. How it works — 3 genuine steps (numbering justified)
6. What you need — gear grid mirroring Settings → Instructions (tier chips: amber Required,
   blue Highly recommended, green Nice to have)
7. See it in action — portrait 9:16 walkthrough video (with sound)
8. Coming Soon — closing email capture
9. Footer — safety note, minimal links

## Expandability
- Video section is a self-contained block: replace the `.video-frame` placeholder with a
  `<video>` or embed.
- Email forms are styled and show inline confirmation; wire `data-form` to a real endpoint later.
- Screens live in `assets/web/`; regenerate from `assets/screens/*_clean.png` via the PIL steps.
