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
V="$(date +%Y%m%d-%H%M%S)"

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

node - "$SRC" "$DEST" "$SOURCE_INDEX" "$V" <<'NODE'
const fs = require("fs");
const path = require("path");
const [, , SRC, DEST, SOURCE_INDEX, V] = process.argv;

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
html = html.replace(/(href="styles\.css)(?:\?v=[^"]*)?"/g, `$1?v=${V}"`);
html = html.replace(/(src="script\.js)(?:\?v=[^"]*)?"/g, `$1?v=${V}"`);

fs.writeFileSync(path.join(DEST, "index.html"), html);

let warned = false;
for (const bad of ['id="peDock"', "editor.js", 'id="pe-saved-state"', 'href="editor.css', 'src=""']) {
  if (html.includes(bad)) {
    console.warn("Clean public index.html still contains:", bad);
    warned = true;
  }
}

for (const rel of ["script.js", "styles.css", "robots.txt", "sitemap.xml"]) {
  if (!copyFile(rel)) {
    console.warn("Missing root file:", rel);
    warned = true;
  }
}

const deployScan = [
  html,
  readIfExists(path.join(SRC, "styles.css")),
  readIfExists(path.join(SRC, "script.js")),
].join("\n");

const assetRefPattern = /(?:https?:\/\/[^"'\s)]+\/)?(assets\/[A-Za-z0-9_.\/ -]+\.[A-Za-z0-9]+)(?:\?[^"'\s)]*)?/g;
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
console.log(`Source: ${path.basename(SOURCE_INDEX)} · assets: ${copied}/${refs.size} · v=${V}`);

if (missing.length) {
  console.warn("Referenced but missing assets:\n  " + missing.join("\n  "));
  warned = true;
}

process.exit(warned ? 2 : 0);
NODE
