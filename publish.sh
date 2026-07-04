#!/usr/bin/env bash
#
# publish.sh — build a clean, upload-ready copy of the Peregrine site.
#
# Produces a deploy folder (default ~/Developer/Peregrine-Deploy) containing ONLY
# what the live site needs, straight from the dev files on disk — no browser Export.
#
# It:
#   • strips the editor from index.html (dock, editor.js/css links, #pe-saved-state,
#     data-pe-id and transient edit attrs) while KEEPING applied customizations
#     (#pe-overrides / #pe-fonts) and runtime hooks (data-pe-anim / -interaction / -ix);
#   • copies the real script.js / styles.css (this is what fixed the "stale script.js
#     on Netlify" bug) and cache-busts their ?v= so browsers never serve an old copy;
#   • copies ONLY the assets index.html/styles.css/script.js actually reference
#     (skips raw footage and source files), rebuilding assets/ fresh each run.
#
# The deploy folder is disposable build output — this script wipes and repopulates it.
#
# Usage:  ./publish.sh              # -> ~/Developer/Peregrine-Deploy
#         ./publish.sh /some/dir    # -> custom deploy folder
#
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${1:-$HOME/Developer/Peregrine-Deploy}"

if [ ! -d "$DEST" ]; then
  echo "❌ Deploy folder not found: $DEST" >&2
  echo "   Create it first, or pass a path: ./publish.sh /path/to/deploy" >&2
  exit 1
fi
if [ ! -f "$SRC/index.html" ]; then
  echo "❌ No index.html next to publish.sh ($SRC)" >&2
  exit 1
fi

V="$(date +%Y%m%d-%H%M%S)"

# Rebuild assets/ from scratch so nothing stale (old CTA clips, unreferenced footage)
# ever lingers in the upload.
rm -rf "$DEST/assets"

node - "$SRC" "$DEST" "$V" <<'NODE'
const fs = require("fs"), path = require("path");
const [, , SRC, DEST, V] = process.argv;

// ---- clean index.html ----
let h = fs.readFileSync(path.join(SRC, "index.html"), "utf8");
h = h.replace(/\n?[ \t]*<link\b[^>]*href="editor\.css[^"]*"[^>]*>/g, "");
h = h.replace(/\n?[ \t]*<script\b[^>]*src="editor\.js[^"]*"[^>]*><\/script>/g, "");
h = h.replace(/\n?[ \t]*<script id="pe-saved-state"[^>]*>[\s\S]*?<\/script>/g, "");
h = h.replace(/\n?[ \t]*<!--\s*Customize panel[\s\S]*?-->/g, "");
h = h.replace(/\n?[ \t]*<div class="pe-dock" id="peDock">[\s\S]*?<\/div>/g, "");
// editor identity + transient edit attrs — keep data-pe-anim / -interaction / -ix*
h = h.replace(/\s+data-pe-(?:id|move|edit|img|key|bg|inserted|carousel-inserted|carousel-ready|target-loop-ready|drift-ready|asset)="[^"]*"/g, "");
h = h.replace(/\s+contenteditable="[^"]*"/g, "");
// cache-bust code refs so browsers drop stale JS/CSS after every publish
h = h.replace(/(href="styles\.css)\?v=[^"]*"/g, `$1?v=${V}"`);
h = h.replace(/(src="script\.js)\?v=[^"]*"/g, `$1?v=${V}"`);
fs.writeFileSync(path.join(DEST, "index.html"), h);

let warned = false;
for (const bad of ['id="peDock"', "editor.js", 'id="pe-saved-state"', "assets/edited/", 'src=""']) {
  if (h.includes(bad)) { console.warn("⚠️  cleaned index.html still contains:", bad); warned = true; }
}

// ---- code + static root files ----
for (const f of ["script.js", "styles.css", "robots.txt", "sitemap.xml"]) {
  const from = path.join(SRC, f);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(DEST, f));
  else console.warn("⚠️  missing root file:", f);
}

// ---- referenced assets only ----
const scan = ["index.html", "styles.css", "script.js"]
  .map(f => { try { return fs.readFileSync(path.join(SRC, f), "utf8"); } catch { return ""; } })
  .join("\n");
const refs = [...new Set((scan.match(/assets\/[A-Za-z0-9_.\/-]+\.[A-Za-z0-9]+/g) || [])
  .map(s => s.replace(/\?.*$/, "")))].sort();
let copied = 0; const missing = [];
for (const rel of refs) {
  const from = path.join(SRC, rel), to = path.join(DEST, rel);
  if (!fs.existsSync(from)) { missing.push(rel); continue; }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  copied++;
}
console.log(`✅ index.html cleaned · code synced · ${copied}/${refs.length} referenced assets copied · v=${V}`);
if (missing.length) { console.warn("⚠️  referenced but MISSING (not copied):\n  " + missing.join("\n  ")); warned = true; }
process.exit(warned ? 2 : 0);
NODE
NODE_STATUS=$?

# Drop dev-only cruft that earlier manual copies may have left in the deploy root.
( cd "$DEST" && rm -rf \
    editor.js editor.css tests docs serve.py serve_tmp.py __pycache__ \
    OLDindex.html OLDindex3.html indexOLD.html index-3.html __test.html __preview.html \
    CLAUDE.md DESIGN.md README.md DO_NOT_USE.md publish.sh .DS_Store 2>/dev/null ) || true

echo "📦 Deploy ready: $DEST"
if [ "${NODE_STATUS:-0}" -eq 2 ]; then
  echo "   ⚠️  finished with warnings above — review before uploading."
fi
echo "   → drag the folder onto Netlify, or: netlify deploy --prod --dir \"$DEST\""
