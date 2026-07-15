const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const publicRoot = path.join(root, "public");
const index = fs.readFileSync(path.join(publicRoot, "index.html"), "utf8");
const editor = fs.readFileSync(path.join(root, "editor.js"), "utf8");
const styles = fs.readFileSync(path.join(publicRoot, "styles.css"), "utf8");
const editorStyles = fs.readFileSync(path.join(root, "editor.css"), "utf8");
const script = fs.readFileSync(path.join(publicRoot, "script.js"), "utf8");
const sourceIndex = fs.readFileSync(path.join(root, "index.editor.html"), "utf8");
const publisher = fs.readFileSync(path.join(root, "publish.sh"), "utf8");
const netlify = fs.readFileSync(path.join(root, "netlify.toml"), "utf8");
const privacyPage = fs.readFileSync(path.join(publicRoot, "privacy", "index.html"), "utf8");
const termsPage = fs.readFileSync(path.join(publicRoot, "terms", "index.html"), "utf8");
const howItWorksPage = fs.readFileSync(path.join(publicRoot, "how-it-works", "index.html"), "utf8");
const whatYouNeedPage = fs.readFileSync(path.join(publicRoot, "what-you-need", "index.html"), "utf8");
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
const homeWordmarkPath = "assets/peregrine-wordmark-metallic-blackpoint-12.png";
const criticalImagePaths = new Map([
  [homeWordmarkPath, "image/png"],
  ["assets/reticle-mark.png", "image/png"],
  ["assets/web/peregrine-training-setup.jpg", "image/jpeg"],
]);

function includesAll(source, patterns, context) {
  for (const pattern of patterns) {
    assert(
      source.includes(pattern),
      `${context} should include ${JSON.stringify(pattern)}`
    );
  }
}

function fingerprint(data) {
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 12);
}

includesAll(
  netlify,
  [
    'for = "/"',
    'for = "/index.html"',
    'for = "/styles.css"',
    'for = "/script.js"',
    'for = "/assets/*"',
    'Cache-Control = "public, max-age=0, must-revalidate"',
    'Cache-Control = "public, max-age=31536000, immutable"',
    'X-Content-Type-Options = "nosniff"',
    'X-Frame-Options = "DENY"',
    'Referrer-Policy = "strict-origin-when-cross-origin"',
    'Permissions-Policy = "camera=(), microphone=(), geolocation=()"',
    "Content-Security-Policy = \"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests\"",
  ],
  "Netlify resilience and security headers"
);

const inlineStylesMatch = index.match(
  /<style data-peregrine-styles>([\s\S]*?)<\/style>/
);
assert(inlineStylesMatch, "public index should inline the production stylesheet");
assert.equal(
  inlineStylesMatch[1],
  styles,
  "public inline styles should match the generated inspection stylesheet"
);
assert(
  !/<link\b[^>]*href="styles\.css(?:\?[^\"]*)?"/.test(index),
  "public index should not depend on a separate production stylesheet request"
);
assert(
  sourceIndex.includes('href="styles.css') && sourceIndex.includes('href="editor.css'),
  "authoring index should retain source and editor stylesheet links"
);

for (const [criticalImagePath, mime] of criticalImagePaths) {
  const encoded = fs.readFileSync(path.join(root, criticalImagePath)).toString("base64");
  assert(
    index.includes(`data:${mime};base64,${encoded}`),
    `public index should embed critical image ${criticalImagePath}`
  );
  assert(
    !index.includes(`src="${criticalImagePath}`),
    `public index should not request critical image ${criticalImagePath}`
  );
  assert(
    sourceIndex.includes(`src="${criticalImagePath}`),
    `authoring index should keep editable critical image ${criticalImagePath}`
  );
}

const scriptVersion = index.match(/src="script\.js\?v=([0-9a-f]{12})"/);
assert(scriptVersion, "public runtime should use a SHA-256 content fingerprint");
assert.equal(
  scriptVersion[1],
  fingerprint(Buffer.from(script)),
  "public runtime fingerprint should match generated script content"
);

const versionedAssetPattern =
  /(?:https:\/\/peregrinedryfire\.com\/)?(assets\/[A-Za-z0-9_.\/ -]+\.[A-Za-z0-9]+)(?:\?v=([0-9a-f]{12}))?/g;
for (const [label, deployedText] of Object.entries({ index, styles, script })) {
  for (const match of deployedText.matchAll(versionedAssetPattern)) {
    const assetPath = path.join(publicRoot, match[1]);
    assert(fs.existsSync(assetPath), `${label} references missing ${match[1]}`);
    assert.equal(
      match[2],
      fingerprint(fs.readFileSync(assetPath)),
      `${label} should fingerprint ${match[1]}`
    );
  }
}

includesAll(
  publisher,
  [
    "function fingerprint(data)",
    "function versionAssetRefs(text)",
    "function inlineCriticalImageRefs(text)",
    "data-peregrine-styles",
  ],
  "publisher resilience pipeline"
);

assert(
  !index.includes('href="editor.css') &&
    !index.includes('src="editor.js') &&
    !index.includes('id="peDock"'),
  "public index should not include the editor shell"
);

for (const match of index.matchAll(/class="([^"]*)"/g)) {
  const classes = match[1].split(/\s+/);
  assert(
    !(classes.includes("reveal") && classes.includes("in")),
    "public reveal elements should not be published in their completed state"
  );
  for (const transient of ["pe-in", "pe-ix-in", "pe-ix-active", "pe-ix-run"]) {
    assert(
      !classes.includes(transient),
      `public index should strip transient runtime class ${transient}`
    );
  }
}

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
  (index.match(/class="btn btn--neo" href="\/(?:how-it-works|what-you-need)\/"/g) || []).length === 2,
  "published guide CTAs should use the shared neobrutalist button class"
);
assert(
  index.includes('class="section__more section__more--how"'),
  "published setup-guide CTA should retain extra separation from the steps"
);
assert(
  index.includes('class="signup__contact"') &&
    index.includes('class="btn btn--neo btn--neo-support signup__support-link"') &&
    index.includes('href="https://tally.so/r/QKW7Vk"') &&
    index.includes('target="_blank"') &&
    index.includes('rel="noopener noreferrer"'),
  "public support section should keep its safe external Tally link and support neobrutalist class"
);
includesAll(
  styles,
  [
    ".btn--neo {",
    "width: min(240px, 100%);",
    "border: 2px solid #7A150A;",
    "border-radius: 20px;",
    "background: linear-gradient(180deg, #E04930 0%, #CC2810 52%, #A91B09 100%);",
    "color: #0A0A0C;",
    "text-shadow: 0 1px 0 rgba(243, 239, 230, .2), 0 0 7px rgba(243, 239, 230, .18);",
    "box-shadow: 5px 5px 0 var(--amber), 0 0 16px rgba(204, 40, 16, .4);",
    ".btn--neo:active { transform: translate(5px, 5px); box-shadow: 0 0 10px rgba(204, 40, 16, .3); }",
    ".btn--neo-support {",
    "border-color: var(--ink);",
    "color: var(--ink);",
    "box-shadow: 5px 5px 0 var(--recon);",
    ".btn--neo-support:active { box-shadow: 0 0 10px rgba(138, 188, 224, .3); }",
    ".section__more--how { margin-top: 42px; }",
  ],
  "neobrutalist CTA styling"
);
assert(
  /\.btn--neo-support\s*\{[^}]*border-color:\s*var\(--ink\);/s.test(styles) &&
    !/\.btn--neo-support\s*\{[^}]*border-color:\s*var\(--recon\);/s.test(styles),
  "support CTA should reserve recon for its offset shadow rather than outlining the foreground button"
);
assert(
  !index.includes("data-tally-src") &&
    !index.includes("https://tally.so/widgets/embed.js"),
  "public support section should not embed the Tally form"
);
assert(
  index.includes('<a href="/privacy/">Privacy</a>') &&
    index.includes('<a href="/terms/">Terms</a>'),
  "public footer should link to the published Privacy Policy and Terms"
);
includesAll(
  publisher,
  [
    "privacy/index.html",
    "terms/index.html",
    "how-it-works/index.html",
    "what-you-need/index.html",
  ],
  "publisher static-page copy list"
);
includesAll(
  privacyPage,
  ["Peregrine — Privacy Policy", "Tally", "90 days", "iCloud Backup"],
  "published Privacy Policy"
);
assert(
  !privacyPage.includes("Data Not Collected"),
  "published Privacy Policy should not make a Data Not Collected claim"
);
includesAll(
  termsPage,
  ["Peregrine — Supplemental Terms of Use", "Tyler Beattie", "Standard EULA", "Travis County"],
  "published Supplemental Terms"
);
assert(
  /\.signup__contact\s*\{[^}]*margin:\s*clamp\(120px,\s*15vw,\s*180px\)\s+0\s+0;/s.test(styles),
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
const howSectionIndex = index.search(/<section\b[^>]*\bid="how"/);
const measureSectionIndex = index.search(/<section\b[^>]*\bid="measure"/);
const featuresSectionIndex = index.search(/<section\b[^>]*\bid="features"/);
const driftSectionIndex = index.search(/<section\b[^>]*\bid="drift"/);
const kitSectionIndex = index.search(/<section\b[^>]*\bid="kit"/);
assert(
  measureSectionIndex >= 0 && measureSectionIndex < howSectionIndex,
  "the measurement band should appear before How it works"
);
assert(
  howSectionIndex >= 0 && howSectionIndex < featuresSectionIndex,
  "the feature blocks should follow How it works"
);
assert(
  kitSectionIndex > driftSectionIndex,
  "What you need should remain in its current position after the Drift section"
);
const featureOrder = Array.from(
  index.matchAll(/<div\b[^>]*\bclass="[^"]*\bfeature\b[^"]*"[^>]*\bid="([^"]+)"/g),
  (match) => match[1]
);
assert.deepEqual(
  featureOrder,
  ["targets", "drills", "live", "history"],
  "feature blocks should follow the training flow from target through progress"
);
assert(
  /\.feature\s*\+\s*\.feature\s*\{[^}]*margin-top:\s*clamp\(18px,\s*2\.4vw,\s*28px\);/s.test(styles),
  "every adjacent feature block should retain the same compact responsive gap"
);
assert(
  /#features\s*>\s*\.feature\.reveal\.pe-reveal-ready\s*\{[^}]*transform:\s*translateY\(12px\);/s.test(styles),
  "feature-card entrance motion should stay inside the compact mobile gap"
);
assert(
  !/<div\b[^>]*\bid="targets"[^>]*\bdata-pe-anim=/.test(index),
  "the target block should not translate into the compact gap above Progress while it enters"
);
includesAll(
  index,
  ['href="/how-it-works/"', 'href="/what-you-need/"'],
  "homepage setup-guide links"
);
includesAll(
  howItWorksPage,
  [
    "How Peregrine Works | Dry-Fire Laser Training on iPhone",
    "Print the target in Peregrine",
    "Set your iPhone",
    "Scan Target",
    "Free Shoot",
    'href="/what-you-need/"',
  ],
  "How It Works guide"
);
includesAll(
  whatYouNeedPage,
  [
    "What You Need for Peregrine | Laser Training Cartridge Setup",
    "unloaded handgun",
    "red laser training cartridge",
    "standard letter paper",
    "stable phone stand",
    "TRT",
    'href="/how-it-works/"',
  ],
  "What You Need guide"
);
const guideBackButton = /<a class="btn btn--ghost" href="\/" onclick="if \(history\.length > 1\) \{ history\.back\(\); return false; \}">Back to Peregrine<\/a>/;
assert(
  guideBackButton.test(howItWorksPage) && guideBackButton.test(whatYouNeedPage),
  "guide Back to Peregrine buttons should use browser history before falling back to the home page"
);
assert(
  /<div class="guide-actions guide-actions--how">[\s\S]*?See what you need[\s\S]*?Back to Peregrine/.test(
    howItWorksPage
  ) &&
    /\.guide-actions--how\s*\{[^}]*flex-wrap:\s*nowrap[^}]*gap:\s*8px/s.test(styles),
  "How It Works guide actions should keep See what you need and Back to Peregrine together on phones"
);
assert(
  !howItWorksPage.includes("Drift Diagnosis") &&
    !whatYouNeedPage.includes("Drift Diagnosis") &&
    !howItWorksPage.includes("Download") &&
    !whatYouNeedPage.includes("Download"),
  "setup guides should stay focused and not add Drift details or target downloads"
);
assert(
  /<li class="kit-card"[^>]*>[\s\S]*?GearTRTInsert\.png[\s\S]*?<h3 class="kit-card__title(?: [^"]*)?"[^>]*>A TRT dry-fire insert, dry fire mag, or a trigger reset device<\/h3>/.test(index),
  "published What you need card should list the TRT insert, dry fire mag, and trigger reset device together"
);
assert(
  /\.device--hero\s*\{[^}]*max-width:\s*280px/s.test(styles) &&
    /\.device--hero\s+\.device__screen\s*\{[^}]*aspect-ratio:\s*760\s*\/\s*1546/s.test(styles) &&
    /\.device--hero\s+\.device__screen img\s*\{[^}]*height:\s*100%[^}]*object-fit:\s*cover[^}]*object-position:\s*center/s.test(styles),
  "hero phone should keep the established iPhone proportions while cropping its custom photo"
);
const heroBlock = index.slice(index.indexOf('class="hero"'), index.indexOf('id="measure"'));
assert(
  /<img class="hero__title-brand" src="data:image\/png;base64,[^"]+" alt="Peregrine" width="531" height="120">/.test(heroBlock) &&
    !/<span class="hero__title-brand"/.test(heroBlock),
  "hero title should use the metallic Peregrine wordmark image instead of approximate text"
);
assert(
  /src="data:image\/jpeg;base64,[^"]+" width="720" height="1280"/.test(heroBlock),
  "hero phone should embed the replacement training photo"
);
assert(
  /\.hero__title-brand\s*\{[^}]*width:\s*calc\(531px\s*\*\s*var\(--pe-text,\s*1\)\)[^}]*max-width:\s*100%[^}]*height:\s*auto[^}]*object-fit:\s*contain/s.test(styles),
  "hero wordmark should scale responsively without distorting"
);
assert.equal(
  (sourceIndex.match(/src="assets\/peregrine-wordmark-metallic-blackpoint-12\.png\?v=blackpoint12"/g) || []).length,
  2,
  "only the home hero and navigation wordmarks should reference the 12% black-point asset"
);
assert(
  !sourceIndex.includes('src="assets/peregrine-wordmark-metallic.png?v=2"'),
  "the home page should not retain the original wordmark asset"
);
assert(
  howItWorksPage.includes('/assets/peregrine-wordmark-metallic.png?v=') &&
    whatYouNeedPage.includes('/assets/peregrine-wordmark-metallic.png?v=') &&
    !howItWorksPage.includes(homeWordmarkPath) &&
    !whatYouNeedPage.includes(homeWordmarkPath),
  "setup-guide navigation should retain the original wordmark asset"
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

function interactionConfig(pattern, label) {
  const match = index.match(pattern);
  assert(match, `public index should include ${label} interaction`);
  return JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
}

const motionConfigs = {
  hero: interactionConfig(/<img\b(?=[^>]*width="720")[^>]*data-pe-interaction="([^"]+)"/, "hero image"),
  measure: interactionConfig(/<section\b[^>]*id="measure"[^>]*data-pe-interaction="([^"]+)"/, "measurement band"),
  measurePulse: interactionConfig(/<div\b[^>]*class="band__inner[^>]*data-pe-interaction="([^"]+)"/, "measurement pulse"),
  built: interactionConfig(/<div\b[^>]*class="section__head[^>]*data-pe-interaction="([^"]+)"[^>]*>[\s\S]*?<h2\b[^>]*>Built to train<\/h2>/, "Built to train"),
  live: interactionConfig(/<div\b[^>]*id="live"[^>]*data-pe-interaction="([^"]+)"/, "Live feature"),
  targets: interactionConfig(/<figure\b[^>]*class="tcard tcard--video tcard--target-loop[^>]*data-pe-interaction="([^"]+)"/, "target strip"),
  driftDivider: interactionConfig(/<div\b[^>]*class="divider pe-ix-pending"[^>]*data-pe-interaction="([^"]+)"/, "drift divider"),
  drift: interactionConfig(/<div\b[^>]*class="drift pe-ix-pending"[^>]*data-pe-interaction="([^"]+)"/, "drift section"),
};

assert.deepEqual(motionConfigs.hero, { trigger: "scroll", effect: "fade", ease: "ease", repeat: "once", duration: 900, delay: 150 });
assert.deepEqual(motionConfigs.measure, { trigger: "scroll", effect: "fade", ease: "smooth", repeat: "replay", duration: 900, delay: 100 });
assert.deepEqual(motionConfigs.measurePulse, { trigger: "scroll", effect: "pulse", ease: "snap", repeat: "replay", duration: 700, delay: 50 });
assert.deepEqual(motionConfigs.built, { trigger: "scroll", effect: "slide-right", ease: "smooth", repeat: "replay", duration: 850, delay: 100 });
assert.deepEqual(motionConfigs.live, { trigger: "scroll", effect: "fade", ease: "smooth", repeat: "once", duration: 650, delay: 100 });
assert.deepEqual(motionConfigs.targets, { trigger: "scroll", effect: "slide-right", ease: "smooth", repeat: "replay", duration: 850, delay: 100 });
assert.deepEqual(motionConfigs.driftDivider, { trigger: "scroll", effect: "fade", ease: "ease", repeat: "replay", duration: 700, delay: 0 });
assert.deepEqual(motionConfigs.drift, { trigger: "scroll", effect: "fade", ease: "ease", repeat: "replay", duration: 700, delay: 0 });

const interactionRuntime = script.slice(
  script.indexOf("/* --- Webflow-inspired custom interactions"),
  script.indexOf("/* --- walkthrough video")
);
includesAll(
  interactionRuntime,
  [
    "function replayDuration(cfg)",
    "Math.max(300, Math.min(550, Math.round(duration / 100) * 50))",
    "var ixPlayed = new WeakSet()",
    "var ixConfigs = new WeakMap()",
    "var ixTimers = new WeakMap()",
    "var ixScrollObserver = null",
    "entry.intersectionRatio >= 0.18",
    "!entry.isIntersecting",
    "threshold: [0, 0.18]",
    "pe-ix-active",
    'if (cfg.effect === "pulse") el.classList.add("pe-ix-run")',
    'el.classList.remove("pe-ix-active", "pe-ix-in", "pe-ix-run")',
  ],
  "shared scroll interaction runtime"
);
assert.equal(
  (interactionRuntime.match(/new IntersectionObserver/g) || []).length,
  1,
  "custom scroll interactions should share one observer"
);
assert(
  !interactionRuntime.includes("void el.offsetWidth"),
  "custom interactions should restart without a forced layout read"
);
includesAll(
  script,
  [
    'el.classList.add("pe-reveal-ready")',
    'el.classList.add("pe-anim-ready")',
    'el.classList.add("pe-ix-pending", "pe-ix-ready")',
  ],
  "fail-open motion registration"
);
includesAll(
  styles,
  [
    ".reveal.pe-reveal-ready",
    "[data-pe-anim].pe-anim-ready",
    ".pe-ix-pending.pe-ix-ready",
  ],
  "runtime-scoped hidden motion states"
);
assert(
  !/\.reveal\s*\{[^}]*opacity:\s*0/s.test(styles),
  "static reveal content should not be hidden before runtime registration"
);
assert(
  !/\[data-pe-anim\]\s*\{[^}]*opacity:\s*0/s.test(styles),
  "static section animation content should not be hidden before runtime registration"
);
for (const readinessClass of ["pe-reveal-ready", "pe-anim-ready", "pe-ix-ready"]) {
  assert(
    !new RegExp(`class="[^"]*\\b${readinessClass}\\b`).test(index),
    `public HTML should strip ${readinessClass} from saved class attributes`
  );
}
assert(
  /\.pe-ix-active\s*\{[^}]*will-change:\s*opacity,\s*transform/s.test(styles),
  "active entrances should receive a temporary compositor hint"
);
assert(
  /\.pe-ix-pending\s*\{[^}]*transition-property:\s*opacity,\s*transform/s.test(styles) &&
    /\.pe-ix-pending\.pe-ix-ready\[data-pe-ix-effect="blur"\]\s*\{[^}]*transition-property:\s*opacity,\s*transform,\s*filter/s.test(styles),
  "only blur entrances should add filter to the transition pipeline"
);

const flapRuntime = script.slice(
  script.indexOf("/* --- stat band split-flap"),
  script.indexOf("/* --- laser ping")
);
includesAll(
  flapRuntime,
  [
    "var gen = 0, flapFrame = null",
    "function cancelFlaps()",
    "function animateFlapCell(cell)",
    "cell.animate(",
    "threshold: [0, 0.35]",
    "!e.isIntersecting",
  ],
  "single-scheduler split-flap runtime"
);
assert(
  !flapRuntime.includes("void cell.offsetWidth") &&
    (flapRuntime.match(/requestAnimationFrame\(/g) || []).length === 2,
  "split-flap digits should share one frame scheduler without forced layout"
);
assert(
  !styles.includes(".chip__flap-cell.is-flipping") && !styles.includes("@keyframes peFlap"),
  "split-flap motion should use the Web Animations API instead of restartable CSS classes"
);

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
  index.indexOf('id="kit"')
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

const featureBlocks = Array.from(
  index.matchAll(/<div\b(?=[^>]*\bclass="[^"]*\bfeature\b[^"]*")[^>]*\bid="([^"]+)"[^>]*>/g)
);
const targetFeatureIndex = featureBlocks.findIndex((match) => match[1] === "targets");
assert.notEqual(targetFeatureIndex, -1, "published page should include the target feature block");
const indexTargetBlock = index.slice(
  featureBlocks[targetFeatureIndex].index,
  featureBlocks[targetFeatureIndex + 1].index
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
