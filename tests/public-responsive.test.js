const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const publicRoot = path.join(root, "public");
const index = fs.readFileSync(path.join(publicRoot, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(publicRoot, "styles.css"), "utf8");
const editor = fs.readFileSync(path.join(root, "editor.js"), "utf8");

function sectionBetween(startNeedle, endNeedle) {
  const start = index.indexOf(startNeedle);
  assert.notEqual(start, -1, `Missing start marker ${startNeedle}`);
  const end = endNeedle ? index.indexOf(endNeedle, start + startNeedle.length) : index.length;
  assert.notEqual(end, -1, `Missing end marker ${endNeedle}`);
  return index.slice(start, end);
}

function sectionById(id, nextId) {
  return sectionBetween(`id="${id}"`, nextId ? `id="${nextId}"` : null);
}

function assertNoUnsafeLayout(html, label) {
  assert(!/max-width:\s*none/i.test(html), `${label} should not force max-width:none`);
  assert(!/\bwidth:\s*\d+(?:\.\d+)?px/i.test(html), `${label} should not force fixed pixel width`);
  assert(!/\bheight:\s*\d+(?:\.\d+)?px/i.test(html), `${label} should not force fixed pixel height`);
  assert(!/transform:\s*translate\(/i.test(html), `${label} should not force translate() positioning`);
}

assert(
  index.includes('name="viewport" content="width=device-width, initial-scale=1.0"'),
  "viewport meta should support responsive layout"
);
assert(
  !index.includes('src="editor.js') && !index.includes('href="editor.css'),
  "public index should be clean and not include editor shell"
);
assert(!/<[a-z]+class=/.test(index), "public index should not contain malformed tag/class boundaries");
assert(!/"style=/.test(index), "public index should not contain malformed attribute/style boundaries");

assertNoUnsafeLayout(sectionById("hero", "measure"), "hero");
assertNoUnsafeLayout(sectionById("drift", "how"), "drift");
assertNoUnsafeLayout(sectionBetween('<section class="cta"', "</section></main>"), "cta");

[
  "@media (max-width: 920px)",
  "@media (max-width: 720px)",
  "@media (max-width: 480px)",
  ".hero__device.pe-force-media-stretch",
  ".drift.pe-force-media-stretch",
  ".cta__inner",
].forEach((needle) => {
  assert(styles.includes(needle), `styles.css should include ${needle}`);
});

[
  "sanitizeResponsiveLayoutForExport",
  "stripUnsafeResponsiveLayout",
  "hero__device",
  "drift__wheel",
  "cta__inner",
].forEach((needle) => {
  assert(editor.includes(needle), `editor.js should include ${needle}`);
});

console.log("Public responsive checks passed.");
