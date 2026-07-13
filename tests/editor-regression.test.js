const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const publicRoot = path.join(root, "public");
const index = fs.readFileSync(path.join(publicRoot, "index.html"), "utf8");
const editor = fs.readFileSync(path.join(root, "editor.js"), "utf8");
const styles = fs.readFileSync(path.join(publicRoot, "styles.css"), "utf8");
const editorStyles = fs.readFileSync(path.join(root, "editor.css"), "utf8");
const script = fs.readFileSync(path.join(publicRoot, "script.js"), "utf8");
const savedStateMatch = index.match(/<script id="pe-saved-state" type="application\/json">([\s\S]*?)<\/script>/);
const savedState = savedStateMatch ? JSON.parse(savedStateMatch[1]) : {};
const targetImagePaths = [
  "assets/Targets/1784E6BC-CE6A-429B-B56A-A8C77A595D92.png",
  "assets/Targets/4202330E-81B4-4D61-9EC3-438902F6603C.png",
  "assets/Targets/764305A7-9DB5-45A0-B804-192E9E7DD2D1.png",
  "assets/Targets/D039F987-DE6A-4D7D-B9ED-800424419CE5.png",
  "assets/Targets/D9722DB0-6513-41C9-933F-BF64B38ADD6F.png",
  "assets/Targets/EDAD10A4-CD61-409D-8A73-2C9A2E0FCA5A.png",
];
const heroBackgroundVideoPath = "assets/hero/1783014209067_g0wdb146me.mp4";
const driftDiagnosisImagePaths = [
  "assets/drift-diagnosis-silhouette.jpeg",
  "assets/drift-diagnosis-circle.jpeg",
];

function includesAll(source, patterns, context) {
  for (const pattern of patterns) {
    assert(
      source.includes(pattern),
      `${context} should include ${JSON.stringify(pattern)}`
    );
  }
}

includesAll(
  index,
  [
    'href="styles.css?v=',
    'src="script.js?v=',
  ],
  "public index shell"
);

assert(
  !index.includes('href="editor.css') &&
    !index.includes('src="editor.js') &&
    !index.includes('id="peDock"'),
  "public index should not include the editor shell"
);

const launchSignupFormMatch = index.match(
  /<form\b[^>]*\bname="launch-signup"[^>]*>[\s\S]*?<\/form>/
);
assert(launchSignupFormMatch, "public index should include the launch signup form");
assert(
  /\bnetlify-honeypot="bot-field"/.test(launchSignupFormMatch[0]),
  "published launch signup form should enable Netlify honeypot protection"
);
assert.equal(
  (launchSignupFormMatch[0].match(/\bname="bot-field"/g) || []).length,
  1,
  "published launch signup form should contain exactly one bot-field input"
);
assert(
  /<p\b[^>]*\bhidden\b[^>]*\bdata-netlify-honeypot-field(?:="")?[^>]*>[\s\S]*?\bname="bot-field"/.test(
    launchSignupFormMatch[0]
  ),
  "published launch signup honeypot should stay hidden from people"
);
assert(
  script.includes("new URLSearchParams(new FormData(form))"),
  "published signup runtime should include every form field in the AJAX submission"
);
assert(
  index.includes('class="signup__contact"') &&
    index.includes('class="btn btn--ghost signup__support-link"') &&
    index.includes('href="https://tally.so/r/QKW7Vk"') &&
    index.includes('target="_blank"') &&
    index.includes('rel="noopener noreferrer"'),
  "public support section should link to the hosted Tally bug-report form"
);
assert(
  !index.includes("data-tally-src") &&
    !index.includes("https://tally.so/widgets/embed.js"),
  "public support section should not embed the Tally form"
);
assert(
  /\.signup__contact\s*\{[^}]*margin:\s*clamp\(80px,\s*10vw,\s*120px\)\s+0\s+0;/s.test(styles),
  "public support section should have responsive separation from the launch signup"
);
assert(
  index.includes('class="signup__email"') &&
    index.includes('>support@peregrinedryfire.com</span>') &&
    /\.signup__email\s*\{[^}]*user-select:\s*all/s.test(styles) &&
    !index.includes('mailto:support@peregrinedryfire.com'),
  "public support address should be copyable plain text, not a mail link"
);
const publishedEmails = [...`${index}\n${script}`.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)]
  .map((match) => match[0].toLowerCase());
assert.deepEqual(
  [...new Set(publishedEmails)],
  ["support@peregrinedryfire.com"],
  "published HTML and runtime should contain only the Peregrine support address"
);
assert(
  script.includes('notifyEmail: "support@peregrinedryfire.com"') &&
    !/notifyEmail:\s*"[^"]+@gmail\.com"/.test(script),
  "published signup fallback should use the support address without exposing personal Gmail"
);

assert(
  !index.includes('<a href="#watch">Watch</a>') && index.includes('<a href="#watch">Watch it</a>'),
  "watch navigation should read as a video action, not a device category"
);
assert(
  /\.device--hero\s*\{[^}]*max-width:\s*280px/s.test(styles) &&
    /\.device--hero\s+\.device__screen\s*\{[^}]*aspect-ratio:\s*760\s*\/\s*1546/s.test(styles) &&
    /\.device--hero\s+\.device__screen img\s*\{[^}]*height:\s*100%[^}]*object-fit:\s*cover[^}]*object-position:\s*center/s.test(styles),
  "hero phone should keep the established iPhone proportions while cropping its custom photo"
);
assert(
  !/<(?:img|video)\b[^>]*src=""/.test(index) && !index.includes("data-pe-asset"),
  "published index should not contain empty or unresolved block image assets"
);
assert(
  !((savedState.interactions || {})["#features"]) &&
    !/<section[^>]+id="features"[^>]+data-pe-interaction=/.test(index),
  "feature section container should not couple Built to score with Live scoring"
);
if (savedStateMatch) {
  assert(
    (savedState.interactions || {})["id:pemr4ufyxa3g"] &&
      (savedState.interactions || {})["#live"],
    "Built to score heading and Live scoring row should keep independent interactions"
  );
} else {
  assert(
    /id="live"[^>]+data-pe-interaction=/.test(index),
    "public Live scoring row should keep its own interaction"
  );
}

includesAll(
  editor,
  [
    "peLayout",
    "insertImageIntoSelection",
    "addScrollingImagesToSelection",
    "addImageCarouselBlock",
    "Scrolling image carousel",
    "buildResizeHandles",
    "data-pe-resize-handle",
    "resizeDrag",
    "applyMediaStretch",
    "setPanelTab",
    "Structure",
    "Design",
    "Interactions",
    "Publish",
    "INTERACTION_TRIGGERS",
    "INTERACTION_EFFECTS",
    "applyInteractionToTarget",
    "buildInteractionTargets",
    "previewInteraction",
    "sanitizeFeatureSectionInteractions",
    "data-pe-interaction",
    "addTargetCarouselToSelection",
    "TARGET_IMAGE_PATHS",
    "saveWorkingHTML",
    "serializeHTML",
    "removeBlankMediaArtifacts",
    "pe-saved-state",
    "editableSections",
    "currentFeatureOrder",
    "persistFeatureOrder",
    "removeSectionFromList",
    "sanitizeTargetState",
    "hostKeyIsTargetSection",
    "toggleBlockHidden",
    "deleteBlockFromList",
    "pe-blocktoggle",
    "pe-blockstatus",
    "pickImages",
    "state.insertedCarousels",
    "state.insertedImages",
    ".pe-panel,.pe-toast,.pe-imgbadge,.pe-seltools",
    ".pe-dock,.pe-launch",
    'link[href^="editor.css"],script[src^="editor.js"]',
  ],
  "editor.js"
);

assert(
  fs.existsSync(path.join(root, heroBackgroundVideoPath)),
  `hero background video asset should exist: ${heroBackgroundVideoPath}`
);

includesAll(
  editor,
  [
    "BACKGROUND_VIDEO_PATHS",
    heroBackgroundVideoPath,
    "backgroundTargets",
    "applyBackgroundMedia",
    "pe-bg-video",
    "pickMedia",
    'accept = "image/*,video/*"',
  ],
  "editor background media support"
);

includesAll(
  editor,
  [
    "motionSpacerBlock",
    "Motion spacer",
    "pe-motion-block",
    "pe-motion-stage",
    "setMotionHeight",
    "Set motion spacer height",
    heroBackgroundVideoPath,
  ],
  "editor motion spacer block support"
);

includesAll(
  editor,
  [
    "setBlockSpacing",
    "Set selected block spacing",
    "Top padding in pixels",
    "Bottom padding in pixels",
    "setDividerOffset",
    "Move selected divider up/down",
    "Divider vertical offset in pixels",
    "setDividerLength",
    "Set divider red length",
    "Red divider length in pixels",
    "--divider-red-length",
  ],
  "editor spacing and divider adjustment controls"
);

includesAll(
  styles,
  [
    ".pe-bg-video",
    "object-fit: contain",
    "max-width: 1280px",
    ".has-pe-media-bg > :not(.pe-bg-video)",
    ".pe-motion-block",
    ".pe-motion-stage",
    ".pe-motion-stage video",
    "border: 0",
    "background: transparent",
    "mask-image: linear-gradient",
    "opacity: 0.48",
  ],
  "section video background styles"
);

includesAll(
  styles,
  [
    "--divider-red-length",
    "width: var(--divider-red-length, 132px)",
  ],
  "adjustable divider red length styles"
);

targetImagePaths.forEach((targetPath) => {
  assert(editor.includes(targetPath), `editor target carousel should reference ${targetPath}`);
  assert(fs.existsSync(path.join(root, targetPath)), `target asset should exist: ${targetPath}`);
});

driftDiagnosisImagePaths.forEach((imagePath) => {
  assert(index.includes(imagePath), `drift diagnosis block should reference ${imagePath}`);
  assert(fs.existsSync(path.join(publicRoot, imagePath)), `public drift diagnosis asset should exist: ${imagePath}`);
});

includesAll(
  index,
  [
    "carousel--drift",
    'data-carousel=""',
    "drift__shot-caption",
  ],
  "drift diagnosis screenshot carousel"
);

const driftBlock = index.slice(
  index.indexOf('id="drift"'),
  index.indexOf('id="how"')
);
const driftSlides = driftBlock.match(/class="carousel__slide/g) || [];
assert.equal(driftSlides.length, 2, "drift diagnosis carousel should only publish the two real phone screenshots");
assert(
  !driftBlock.includes('src=""') && !driftBlock.includes("data-pe-asset"),
  "drift diagnosis carousel should not publish blank uploaded-image placeholders"
);
assert(
  !driftBlock.includes("pe-inserted-carousel"),
  "drift diagnosis section should not publish hidden inserted image carousels"
);

assert(
  !index.includes("drift__shot-scroll"),
  "drift diagnosis screenshots should use the carousel instead of the vertical scroller"
);

includesAll(
  styles,
  [
    ".carousel--drift",
    ".drift__shots",
    ".drift__shot-caption",
    ".dw-aim-ring",
    "fill: none",
    ".dw-callout-arrow",
    ".dw-arrow-head",
  ],
  "drift diagnosis screenshot carousel and wheel marker styles"
);

includesAll(
  script,
  [
    'aimRing.setAttribute("r", 5.8)',
    'dot.setAttribute("r", 4.5)',
  ],
  "drift wheel aim ring should sit on the red dot border"
);

const indexTargetBlock = index.slice(
  index.indexOf('id="targets"'),
  index.indexOf('id="history"', index.indexOf('id="targets"'))
);

includesAll(
  indexTargetBlock,
  [
    'class="target-loop"',
    "tcard--target-loop",
    'data-target-loop-names="Center Circle|B-8 Bullseye|12-Dot Grid|IDPA Silhouette|Numbered Squares|Six-up Circle Array"',
    'data-target-loop-label=""',
    "assets/video/peregrine_targets_12s_seamless_loop.MP4",
  ],
  "published target video loop"
);

targetImagePaths.forEach((targetPath) => {
  assert(!indexTargetBlock.includes(targetPath), `published target loop should not include individual target slide ${targetPath}`);
});

assert(
  !indexTargetBlock.includes("carousel__arrow") && !indexTargetBlock.includes("carousel__dots") && !indexTargetBlock.includes("data-carousel"),
  "published target loop should not expose carousel controls"
);

assert(
  !indexTargetBlock.includes("display: none"),
  "published target carousel should not include editor-hidden inline styles"
);

const targetPathBlock = editor.slice(
  editor.indexOf("var TARGET_IMAGE_PATHS"),
  editor.indexOf("var BLOCKS")
);
assert(
  !targetPathBlock.includes("data:image/"),
  "target carousel paths should not embed base64 data URLs"
);

includesAll(
  script,
  [
    "__peInitCarousels",
    "__peInitInteractions",
    "__peRunInteraction",
    "initTargetLoopCaptions",
    "data-target-loop-names",
    "requestVideoFrameCallback",
    "syncWithVideoFrame",
    "data-pe-interaction",
    "pe-ix-pending",
    "data-pe-carousel-ready",
    "wrapCarouselScroll",
    "wheel",
  ],
  "script.js dynamic carousel initializer"
);

includesAll(
  script,
  [
    "carousel--phone-fixed",
    "showFixedPhoneSlide",
    "is-active",
  ],
  "fixed phone carousel behavior"
);

includesAll(
  styles,
  [
    "[data-pe-interaction]",
    ".pe-ix-pending",
    ".pe-ix-in",
    ".pe-ix-run",
    "@keyframes peIxPulse",
  ],
  "interaction styles"
);

// Fake iOS status bars were removed 2026-07 — frames show only the island.
assert(
  !index.includes("device__status") && !styles.includes(".device__status"),
  "published phones must not carry the fake iOS status bar"
);

includesAll(
  styles,
  [
    ".carousel--phone-fixed .carousel__track",
    ".carousel--phone-fixed .carousel__slide",
    ".carousel--phone-fixed .carousel__slide.is-active",
    "overflow-y: hidden",
  ],
  "fixed phone carousel styles"
);

assert(
  !styles.includes("overflow-y: auto"),
  "phone screen should not vertically scroll inside the iPhone frame"
);

includesAll(
  editorStyles,
  [
    ".pe-blocklist",
    ".pe-blockrow",
    ".pe-blockname",
    ".pe-sectionname",
    ".pe-resize-handles",
    ".pe-resize-handle",
    ".pe-size-field",
    ".pe-page",
    ".pe-page.is-active",
    ".pe-interaction-targets",
    ".pe-mini-grid",
    ".pe-icbtn--danger",
    ".pe-blockaction",
    ".pe-blockstatus",
  ],
  "editor block navigation styles"
);

assert(
  /device__island[\s\S]*?z-index:\s*2/.test(styles),
  "device island should sit above the screen"
);


/* ---------- v4: site showpieces ---------- */
includesAll(
  script,
  [
    "DRIFT_ZONES",
    "__peInitDriftWheel",
    "driftZoneColor",
    "dwLaserBloom",
    "dw-tracer-pulse",
    "dw-flash",
    "Recoil Anticipation / Flinch",
    "laser-ping",
    "laser-score",
    "chip__num",
  ],
  "script.js drift wheel / laser ping / count-up"
);
includesAll(
  script,
  [
    "heroClickScore",
    "reticleCenterX",
    "reticleCenterY",
    "reticleRadius",
    "laserBullseyeRadius",
    "+1",
    "+2",
    "+3",
    "+4",
    "+5",
  ],
  "script.js hero laser distance scoring"
);
assert(
  !script.includes('chip.textContent = shots % 2 ? "+5" : "A";'),
  "hero laser score should never alternate to a letter grade"
);
includesAll(
  index,
  [
    'id="driftWheel"',
    'id="driftReadout"',
    "drift__visual",
    "cta__video",
    "cta__scrim",
    "tcard--video",
    "tcard--target-loop",
    "assets/video/peregrine_targets_12s_seamless_loop.MP4",
  ],
  "index.html drift wheel container + ambient videos"
);
includesAll(
  styles,
  [
    ".dw-sector",
    ".dw-tracer",
    ".dw-tracer-pulse",
    ".dw-flash",
    "dwImpactFlash",
    ".laser-ping",
    ".laser-score",
    ".crosshair::before",
    ".cta__video",
    ".tcard--video video",
    ".tcard--target-loop",
    ".tcard__target-name",
    "color: var(--recon)",
    ".drift__visual",
  ],
  "styles.css v4 additions"
);

/* ---------- v4: editor asset store / export / insert card / identity ---------- */
includesAll(
  editor,
  [
    "peregrineEditorAssets",
    "pe-asset:",
    "assetPut",
    "assetGet",
    "resolveAssetImages",
    "migrateBase64Assets",
    "exportSiteWithAssets",
    "showDirectoryPicker",
    "assets/edited/",
    "openInsertCard",
    "insertPickedImage",
    "pe-insert-card",
    "data-pe-id",
    "restampPeIds",
    "migrateLegacyKeys",
  ],
  "editor.js v4 asset store + export + insert card + identity"
);
includesAll(
  editorStyles,
  [
    ".pe-insert-overlay",
    ".pe-insert-card",
    ".pe-drop",
    ".pe-insert-preview",
  ],
  "editor.css insert card styles"
);
assert(
  !editor.includes("assets/hero/Kling/") &&
    !editor.includes("assets/hero/hero_montage_draft.mp4"),
  "editor CTA presets should not reference archived ambient video drafts"
);
assert(
  fs.existsSync(path.join(publicRoot, "assets/hero/1783186733862_77gx0jlxwme.mp4")),
  "public CTA video asset should exist"
);
assert(
  fs.existsSync(path.join(publicRoot, "assets/hero/1783014209067_g0wdb146me.mp4")),
  "public motion background video asset should exist"
);
assert(
  fs.existsSync(path.join(publicRoot, "assets/video/peregrine_targets_12s_seamless_loop.MP4")),
  "public targets loop video asset should exist"
);


/* ---------- v4.1: CTA controls + per-slide carousel editing ---------- */
includesAll(
  editor,
  [
    "applyCtaMedia",
    "CTA_CLIPS",
    "Coming-soon background",
    "addSlidesToCarousel",
    "removeSlideFromCarousel",
    "persistCarousel",
    "cleanedCarouselInner",
    "+Slide",
  ],
  "editor.js v4.1 CTA + carousel slide editing"
);
includesAll(index, ["device--video", "device__home"], "index.html walkthrough device frame");
includesAll(styles, [".device--video", ".device__home", "cqw"], "styles.css device chrome scaling");

includesAll(
  styles,
  [
    ".feature__copy { order: -1; }",
    ".signup__row { flex-direction: row; gap: 8px; flex-wrap: nowrap; }",
    ".hero__copy, .cta__inner { transform: none !important; width: auto !important; max-width: 100% !important; height: auto !important; }",
    ".cta__inner > * { transform: none !important; }",
    ".signup__input { min-width: 0; height: 44px; flex-basis: 0; padding: 0 14px; font-size: 16px; }",
    ".signup__row .btn--solid { width: auto; min-height: 44px; height: 44px; padding: 0 18px; font-size: 13px; }",
    ".band__chips { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));",
    ".chip__num { font-size: clamp(16px, 5.1vw, 24px); }",
    ".chip__cap { font-size: 8px; letter-spacing: 0.14em; white-space: nowrap; }",
  ],
  "mobile responsive layout refinements"
);

console.log("editor regression checks passed");
