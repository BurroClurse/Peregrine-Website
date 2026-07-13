#!/usr/bin/env bash
#
# publish.sh - refresh the Netlify-facing public/ folder from the authoring files.
#
# GitHub keeps the full working repo: index.editor.html, editor.js, editor.css,
# tests, docs, source assets, and this script. Netlify serves only public/ via
# netlify.toml.
#
# Usage:  ./publish.sh              # -> ./public
#         ./publish.sh /some/dir    # -> custom clean deploy folder
#
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${1:-$SRC/public}"

if [ "$DEST" = "$SRC" ]; then
  echo "Refusing to publish into the repo root. Use ./publish.sh or pass a separate folder." >&2
  exit 1
fi

SOURCE_INDEX="$SRC/index.editor.html"
if [ ! -f "$SOURCE_INDEX" ]; then
  SOURCE_INDEX="$SRC/index.html"
fi

if [ ! -f "$SOURCE_INDEX" ]; then
  echo "No index.editor.html or index.html found next to publish.sh ($SRC)" >&2
  exit 1
fi

mkdir -p "$DEST"

# Rebuild generated deploy files from scratch so Netlify does not receive stale
# footage, root files, or local Finder metadata.
rm -rf \
  "$DEST/assets" \
  "$DEST/index.html" \
  "$DEST/script.js" \
  "$DEST/styles.css" \
  "$DEST/robots.txt" \
  "$DEST/sitemap.xml" \
  "$DEST/.DS_Store"

node - "$SRC" "$DEST" "$SOURCE_INDEX" <<'NODE'
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const [, , SRC, DEST, SOURCE_INDEX] = process.argv;

function readIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function copyFile(rel) {
  const from = path.join(SRC, rel);
  const to = path.join(DEST, rel);
  if (!fs.existsSync(from)) return false;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  return true;
}

function fingerprint(data) {
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 12);
}

function versionAssetRefs(text) {
  const pattern = /((?:https?:\/\/peregrinedryfire\.com\/)?assets\/[A-Za-z0-9_.\/ -]+\.[A-Za-z0-9]+)(?:\?v=[^"'`\s)<]*)?/g;
  return text.replace(pattern, (full, reference) => {
    const rel = reference.startsWith("http")
      ? new URL(reference).pathname.replace(/^\//, "")
      : reference;
    const sourceFile = path.join(SRC, rel);
    if (!fs.existsSync(sourceFile)) return full;
    return `${reference}?v=${fingerprint(fs.readFileSync(sourceFile))}`;
  });
}

function inlineCriticalImageRefs(text) {
  const criticalImages = new Map([
    ["assets/peregrine-wordmark-metallic.png", "image/png"],
    ["assets/reticle-mark.png", "image/png"],
    ["assets/web/peregrine-training-setup.jpg", "image/jpeg"],
  ]);

  for (const [reference, mime] of criticalImages) {
    const sourceFile = path.join(SRC, reference);
    if (!fs.existsSync(sourceFile)) {
      throw new Error(`Cannot publish without critical image ${reference}`);
    }
    const escapedReference = reference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sourcePattern = new RegExp(`(src=["'])${escapedReference}(?:\\?v=[^"']*)?(["'])`, "g");
    if (!sourcePattern.test(text)) {
      throw new Error(`Cannot find critical image reference ${reference}`);
    }
    sourcePattern.lastIndex = 0;
    const dataUri = `data:${mime};base64,${fs.readFileSync(sourceFile).toString("base64")}`;
    text = text.replace(sourcePattern, `$1${dataUri}$2`);
  }

  return text;
}

function protectLaunchSignup(html) {
  const launchFormPattern = /<form\b(?=[^>]*\bname=(["'])launch-signup\1)[^>]*>[\s\S]*?<\/form>/i;
  if (!launchFormPattern.test(html)) {
    throw new Error('Cannot publish without the name="launch-signup" form');
  }

  return html.replace(launchFormPattern, (formHtml) => {
    const openTagMatch = formHtml.match(/^<form\b[^>]*>/i);
    if (!openTagMatch) throw new Error("Cannot read the launch signup form tag");

    const openTag = openTagMatch[0]
      .replace(/\s+netlify-honeypot(?:=(?:"[^"]*"|'[^']*'))?/gi, "")
      .replace(/>$/, ' netlify-honeypot="bot-field">');
    let protectedForm = openTag + formHtml.slice(openTagMatch[0].length);
    const botFields = protectedForm.match(/\bname=(["'])bot-field\1/gi) || [];

    if (botFields.length > 1) {
      throw new Error('Launch signup form contains duplicate name="bot-field" inputs');
    }

    if (botFields.length === 0) {
      const honeypotField = `
          <p hidden aria-hidden="true" data-netlify-honeypot-field="">
            <label>Leave this field blank:
              <input type="text" name="bot-field" tabindex="-1" autocomplete="off">
            </label>
          </p>`;
      const formNameInputPattern = /<input\b(?=[^>]*\bname=(["'])form-name\1)[^>]*>/i;

      if (formNameInputPattern.test(protectedForm)) {
        protectedForm = protectedForm.replace(
          formNameInputPattern,
          (formNameInput) => formNameInput + honeypotField
        );
      } else {
        protectedForm = protectedForm.replace(openTag, openTag + honeypotField);
      }
    }

    return protectedForm;
  });
}

let html = fs.readFileSync(SOURCE_INDEX, "utf8");

// Strip the authoring shell while keeping applied customizations and runtime
// hooks such as data-pe-anim, data-pe-interaction, and data-pe-ix-*.
html = html.replace(/\n?[ \t]*<link\b[^>]*href="editor\.css[^"]*"[^>]*>/g, "");
html = html.replace(/\n?[ \t]*<script\b[^>]*src="editor\.js[^"]*"[^>]*><\/script>/g, "");
html = html.replace(/\n?[ \t]*<script id="pe-saved-state"[^>]*>[\s\S]*?<\/script>/g, "");
html = html.replace(/\n?[ \t]*<!--\s*Customize panel[\s\S]*?-->/g, "");
html = html.replace(/\n?[ \t]*<div class="pe-dock" id="peDock">[\s\S]*?<\/div>/g, "");
html = html.replace(/\s+data-pe-(?:id|move|edit|img|key|bg|inserted|carousel-inserted|carousel-ready|target-loop-ready|drift-ready|asset)="[^"]*"/g, "");
html = html.replace(/\s+contenteditable="[^"]*"/g, "");
// Runtime completion classes can be captured when the editor saves its live
// DOM. Remove them from the public snapshot so entrance effects start fresh.
html = html.replace(/\bclass="([^"]*)"/g, (attribute, value) => {
  const classes = value.split(/\s+/).filter(Boolean);
  const isReveal = classes.includes("reveal");
  const transient = new Set([
    "pe-in",
    "pe-reveal-ready",
    "pe-anim-ready",
    "pe-ix-ready",
    "pe-ix-in",
    "pe-ix-active",
    "pe-ix-run",
  ]);
  const cleaned = classes.filter((name) => !transient.has(name) && !(isReveal && name === "in"));
  return cleaned.length ? `class="${cleaned.join(" ")}"` : "";
});
html = protectLaunchSignup(html);

let generatedStyles = versionAssetRefs(readIfExists(path.join(SRC, "styles.css")));
let generatedScript = versionAssetRefs(readIfExists(path.join(SRC, "script.js")));
if (!generatedStyles) throw new Error("Cannot publish without styles.css");
if (!generatedScript) throw new Error("Cannot publish without script.js");
if (/<\/style/i.test(generatedStyles)) {
  throw new Error("styles.css cannot contain a closing </style> sequence");
}

html = inlineCriticalImageRefs(html);
html = versionAssetRefs(html);
const stylesheetLink = /<link\b[^>]*href="styles\.css(?:\?[^\"]*)?"[^>]*>/;
if (!stylesheetLink.test(html)) {
  throw new Error("Cannot publish without the styles.css link");
}
html = html.replace(
  stylesheetLink,
  `<style data-peregrine-styles>${generatedStyles}</style>`
);
const scriptReference = /(src="script\.js)(?:\?v=[^"]*)?"/g;
if (!scriptReference.test(html)) {
  throw new Error("Cannot publish without the script.js reference");
}
scriptReference.lastIndex = 0;
html = html.replace(
  scriptReference,
  `$1?v=${fingerprint(Buffer.from(generatedScript))}"`
);

fs.writeFileSync(path.join(DEST, "index.html"), html);
fs.writeFileSync(path.join(DEST, "styles.css"), generatedStyles);
fs.writeFileSync(path.join(DEST, "script.js"), generatedScript);

let warned = false;
for (const bad of ['id="peDock"', "editor.js", 'id="pe-saved-state"', 'href="editor.css', 'src=""']) {
  if (html.includes(bad)) {
    console.warn("Clean public index.html still contains:", bad);
    warned = true;
  }
}

for (const rel of ["robots.txt", "sitemap.xml"]) {
  if (!copyFile(rel)) {
    console.warn("Missing root file:", rel);
    warned = true;
  }
}

const deployScan = [
  html,
  generatedStyles,
  generatedScript,
].join("\n");

const assetRefPattern = /(?:https?:\/\/peregrinedryfire\.com\/)?(assets\/[A-Za-z0-9_.\/ -]+\.[A-Za-z0-9]+)(?:\?[^"'\s)]*)?/g;
const refs = new Set();
let match;
while ((match = assetRefPattern.exec(deployScan))) {
  refs.add(match[1]);
}

let copied = 0;
const missing = [];
for (const rel of [...refs].sort()) {
  const from = path.join(SRC, rel);
  if (!fs.existsSync(from)) {
    missing.push(rel);
    continue;
  }
  fs.mkdirSync(path.dirname(path.join(DEST, rel)), { recursive: true });
  fs.copyFileSync(from, path.join(DEST, rel));
  copied++;
}

console.log(`Clean public site refreshed in ${path.relative(SRC, DEST) || DEST}`);
console.log(`Source: ${path.basename(SOURCE_INDEX)} · assets: ${copied}/${refs.size} · content-fingerprinted`);

if (missing.length) {
  console.warn("Referenced but missing assets:\n  " + missing.join("\n  "));
  warned = true;
}

process.exit(warned ? 2 : 0);
NODE

# Regression-check the freshly built output so editor artifacts (drag
# transforms, fixed px sizes, hidden junk) fail the deploy instead of
# shipping. The tests read ./public, so only run for the default target.
if [ "$DEST" = "$SRC/public" ]; then
  node "$SRC/tests/editor-regression.test.js"
  node "$SRC/tests/public-responsive.test.js"
fi
