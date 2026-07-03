# Peregrine Site Upgrade + Editor v4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken Drift section, add three interactive showpieces (drift wheel, hero laser ping, stat count-up), place existing videos, and rebuild the customize panel's image pipeline on IndexedDB with a no-prompt insert UX and stable element identity.

**Architecture:** All site features are dependency-free vanilla JS/CSS added to the existing `script.js`/`styles.css` (they must survive editor Export, which serializes the live DOM). Editor changes live in `editor.js`/`editor.css` only. Images move from base64-in-localStorage to blobs in IndexedDB referenced by `data-pe-asset` ids; Export resolves refs to real files via the File System Access API.

**Tech Stack:** Vanilla HTML/CSS/JS, IndexedDB, File System Access API, `node tests/editor-regression.test.js` (plain script), puppeteer-core (scratchpad only) for visual verification.

**Project root:** `/Users/tylerbeattie/Desktop/Peregrine-Website` (all relative paths below are from here)

## Global Constraints

- Site JS remains dependency-free vanilla; editor remains a single file (`editor.js`).
- Do not change fonts, colors, section order, or the wordmark treatment.
- Every animation respects `prefers-reduced-motion` (site code reads the existing `reduce` var in script.js).
- Drift wheel copy must match `DriftAnalyzer.swift` (right-handed variants) verbatim.
- Regression test must pass after every task: `node tests/editor-regression.test.js` → `editor regression checks passed`.
- Bump the `?v=` cache-buster on `styles.css`/`script.js`/`editor.css`/`editor.js` links in index.html once at the end (Task 11), to `20260702-2`.

---

### Task 0: git init safety net

**Files:** Create: `.gitignore`

- [ ] **Step 1:** Create `.gitignore`:

```gitignore
.DS_Store
__pycache__/
node_modules/
assets/hero/IMG_*.MOV
assets/hero/IMG_*.mov
assets/hero/ScreenRecording_*.mov
assets/video/ffmpeg2pass-*.log*
```

- [ ] **Step 2:** `git init && git add -A && git commit -m "chore: baseline before site upgrade + editor v4"` (run in project root). Expected: clean initial commit.

---

### Task 1: Fix the Drift section layout (bug)

**Files:** Modify: `index.html:323-352` (drift section), `styles.css:964-1055` (drift block)

The copy column collapses because the inserted carousel's min-content width blows out the grid, and `.carousel--drift .pe-carousel-image` forces 945×2048 screenshots into `aspect-ratio: 3/4` with `object-fit: fill` (distortion).

- [ ] **Step 1:** In `index.html`, inside `.drift`, wrap the two visuals in a new column container and put both screenshots in standard device frames. Replace the `<figure class="drift__shots reveal in">…</figure>` block with:

```html
<div class="drift__visual reveal in">
  <figure class="drift__wheel" id="driftWheel" aria-label="Interactive drift diagnosis wheel">
    <!-- SVG built by script.js (Task 2) -->
    <div class="drift__readout" id="driftReadout" aria-live="polite"></div>
  </figure>
  <figure class="drift__shots">
    <div class="carousel carousel--drift" data-carousel="">
      <div class="carousel__viewport">
        <div class="carousel__track">
          <div class="carousel__slide"><div class="device"><span class="device__island" aria-hidden="true"></span><img src="assets/IMG_1223.JPG" width="945" height="2048" loading="lazy" alt="Peregrine Drift Diagnosis review showing shot drift causes on a silhouette target"></div></div>
          <div class="carousel__slide"><div class="device"><span class="device__island" aria-hidden="true"></span><img src="assets/IMG_1180.JPG" width="945" height="2048" loading="lazy" alt="Peregrine Drift Diagnosis review showing drift causes on a circular target"></div></div>
        </div>
      </div>
      <button class="carousel__arrow carousel__arrow--prev" type="button" aria-label="Previous">‹</button>
      <button class="carousel__arrow carousel__arrow--next" type="button" aria-label="Next">›</button>
      <div class="carousel__dots" aria-hidden="true"><button type="button" aria-label="Go to item 1" class="is-active"></button><button type="button" aria-label="Go to item 2"></button></div>
    </div>
    <figcaption class="drift__shot-caption">Real Drift Diagnosis session views</figcaption>
  </figure>
</div>
```

- [ ] **Step 2:** In `styles.css` drift block: make the grid collapse-proof and fix the image treatment:

```css
.drift {
  display: grid; grid-template-columns: minmax(340px, 1.05fr) minmax(0, 0.95fr);
  gap: clamp(32px, 6vw, 84px); align-items: start;
}
.drift__visual { display: flex; flex-direction: column; align-items: center; gap: 40px; min-width: 0; }
```

Replace the `.carousel--drift .pe-carousel-image` rules (both) with device-frame sizing:

```css
.carousel--drift { max-width: min(300px, 100%); }
.carousel--drift .carousel__slide { padding: 8px; }
.carousel--drift .device { width: 100%; }
```

Update the 920px media query: `.drift__visual { order: -1; }` replaces `.drift__wheel, .drift__shots { order: -1; }`.

- [ ] **Step 3:** Verify: `node tests/editor-regression.test.js` passes; puppeteer scroll-capture at 1440px shows two proper columns, no one-word-per-line headline. Commit: `fix: drift section grid collapse + framed screenshots`.

---

### Task 2: Interactive Drift Wheel

**Files:** Modify: `script.js` (new module before the carousel section), `styles.css` (extend drift block)

**Interfaces — Produces:** `window.__peInitDriftWheel()` (idempotent; editor re-init safe), `DRIFT_ZONES` array in script.js.

- [ ] **Step 1:** Add zone data + wheel builder to `script.js`. Content verbatim from `DriftAnalyzer.swift` (right-handed). Geometry: SVG viewBox 0 0 360 360, center (180,180); 12 sectors of 30° between radii 74 and 162, sector *i* centered on angle `i*30 - 90` degrees (i=0 → 12 o'clock up); hour numerals at radius 172.

```js
/* --- drift diagnosis wheel --- */
var DRIFT_ZONES = [
  { hour: 12, name: "Sight Lift / Wrist Up", cause: "Relaxing your wrist, which lets the gun kick upward too early.", fix: "Wrist Lock: Keep your right wrist stiff and straight throughout the entire shot." },
  { hour: 1,  name: "Right Thumb Frame Push", cause: "Pushing against the side of the gun with your right thumb.", fix: "Thumb Floating: Rest your right thumb gently on top of your support hand; do not press inward." },
  { hour: 2,  name: "Right Middle Finger Squeeze", cause: "Tightening your middle finger independently as you pull the trigger.", fix: "Firm Handshake: Relax your right grip; isolate the trigger finger so it moves alone." },
  { hour: 3,  name: "Too Much Trigger Finger", cause: "Finger wrapped too deep on the trigger, hooking it toward your right side.", fix: "Pad Placement: Contact the trigger with the center of your index finger's first pad." },
  { hour: 4,  name: "Left Support Late", cause: "Clamping down with your left support hand only after the shot has broken.", fix: "Pre-Shot Clamp: Squeeze tightly with your left support hand before touching the trigger." },
  { hour: 5,  name: "Right Ring & Pinky Squeeze", cause: "Sympathetically squeezing your lower fingers, pulling the muzzle down and toward your right side.", fix: "Support Hand Heavy: Shift 90% of your clamping force to your left support hand." },
  { hour: 6,  name: "Recoil Anticipation / Flinch", cause: "Subconsciously shoving the muzzle down to fight the expected blast.", fix: "Surprise Break: Squeeze slowly so the exact moment of the shot surprises you." },
  { hour: 7,  name: "Trigger Jerk / Slapping", cause: "Jerking the trigger quickly, pulling the gun low and toward your left side.", fix: "Straight-Back Press: Pull the trigger straight back parallel to the barrel." },
  { hour: 8,  name: "Right-Hand Milking", cause: "Squeezing your entire right hand as your index finger pulls.", fix: "Finger Isolation: Hold the gun steady; only your trigger finger should move." },
  { hour: 9,  name: "Too Little Trigger Finger", cause: "Using only the tip of your finger, pushing the gun toward your left side.", fix: "Trigger Alignment: Adjust your finger so the trigger rests centered on your finger pad." },
  { hour: 10, name: "Follow-Through Deficit", cause: "Releasing your wrist tension or looking up before the bullet exits.", fix: "Visual Lock: Keep your eyes locked on the front sight or dot until the recoil is finished." },
  { hour: 11, name: "Right Thumb-Side Tension", cause: "Tensing the thick muscle at the base of your right thumb.", fix: "Palms Vice: Clamp your palms together from both sides to cancel out lateral tension." }
];
function driftZoneColor(i) { return "hsl(" + (i * 30) + " 72% 52%)"; }

window.__peInitDriftWheel = function () {
  var host = document.getElementById("driftWheel");
  if (!host || host.querySelector("svg")) return;
  var readout = document.getElementById("driftReadout");
  var NS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 360 360");
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", "12 clock-position drift zones");
  function pt(angleDeg, r) {
    var a = (angleDeg - 90) * Math.PI / 180;
    return [180 + r * Math.cos(a), 180 + r * Math.sin(a)];
  }
  function sectorPath(centerDeg, r0, r1) {
    var a0 = centerDeg - 14, a1 = centerDeg + 14;
    var p0 = pt(a0, r0), p1 = pt(a0, r1), p2 = pt(a1, r1), p3 = pt(a1, r0);
    return "M" + p0 + " L" + p1 + " A" + r1 + " " + r1 + " 0 0 1 " + p2 +
           " L" + p3 + " A" + r0 + " " + r0 + " 0 0 0 " + p0 + " Z";
  }
  // target rings
  [162, 120, 74, 34].forEach(function (r) {
    var c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", 180); c.setAttribute("cy", 180); c.setAttribute("r", r);
    c.setAttribute("class", "dw-ring");
    svg.appendChild(c);
  });
  var tracer = document.createElementNS(NS, "line");
  tracer.setAttribute("class", "dw-tracer");
  tracer.setAttribute("x1", 180); tracer.setAttribute("y1", 180);
  tracer.setAttribute("x2", 180); tracer.setAttribute("y2", 180);
  svg.appendChild(tracer);
  var dot = document.createElementNS(NS, "circle");
  dot.setAttribute("class", "dw-dot");
  dot.setAttribute("r", 7); dot.setAttribute("cx", 180); dot.setAttribute("cy", 180);
  var sectors = [];
  DRIFT_ZONES.forEach(function (z, i) {
    var g = document.createElementNS(NS, "g");
    g.setAttribute("class", "dw-sector");
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", z.name + " (" + z.hour + " o'clock)");
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", sectorPath(i * 30, 74, 162));
    p.setAttribute("fill", driftZoneColor(i));
    var tp = pt(i * 30, 176);
    var t = document.createElementNS(NS, "text");
    t.setAttribute("x", tp[0]); t.setAttribute("y", tp[1]);
    t.setAttribute("class", "dw-hour");
    t.textContent = z.hour;
    g.appendChild(p); g.appendChild(t);
    svg.appendChild(g);
    sectors.push(g);
  });
  svg.appendChild(dot);
  host.insertBefore(svg, readout);

  var active = -1, idleTimer = null, interacted = false;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function show(i) {
    active = i;
    sectors.forEach(function (s, j) { s.classList.toggle("is-active", j === i); });
    var z = DRIFT_ZONES[i];
    var end = pt(i * 30, 118);
    dot.style.transition = reduceMotion ? "none" : "cx .6s cubic-bezier(.2,.7,.2,1), cy .6s cubic-bezier(.2,.7,.2,1)";
    dot.setAttribute("cx", end[0]); dot.setAttribute("cy", end[1]);
    tracer.setAttribute("x2", end[0]); tracer.setAttribute("y2", end[1]);
    tracer.classList.add("is-live");
    if (readout) readout.innerHTML =
      '<p class="drift__readout-label"><span class="swatch" style="background:' + driftZoneColor(i) + '"></span>' +
      z.hour + " o'clock — " + z.name + "</p>" +
      '<p class="dw-cause">' + z.cause + "</p>" +
      '<p class="dw-fix">' + z.fix + "</p>";
  }
  function stopIdle() { interacted = true; clearTimeout(idleTimer); }
  sectors.forEach(function (s, i) {
    s.addEventListener("pointerenter", function () { stopIdle(); show(i); });
    s.addEventListener("click", function () { stopIdle(); show(i); });
    s.addEventListener("focus", function () { stopIdle(); show(i); });
    s.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); sectors[(i + 1) % 12].focus(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); sectors[(i + 11) % 12].focus(); }
    });
  });
  function idleStep(i) {
    if (interacted || reduceMotion) return;
    show(i % 12);
    idleTimer = setTimeout(function () { idleStep(i + 1); }, 3500);
  }
  show(6); // start on the classic 6 o'clock flinch
  if (!reduceMotion) idleTimer = setTimeout(function () { idleStep(7); }, 3500);
};
window.__peInitDriftWheel();
```

- [ ] **Step 2:** Add wheel CSS to the drift block of `styles.css` (existing `.drift__readout` card styles are reused):

```css
.drift__wheel svg { width: 100%; max-width: 400px; height: auto; display: block; }
.dw-ring { fill: none; stroke: rgba(255,255,255,0.13); stroke-width: 1.2; stroke-dasharray: 2 2.3; }
.dw-sector { cursor: pointer; outline: none; }
.dw-sector path { opacity: 0.22; transition: opacity .35s ease, filter .35s ease; }
.dw-sector.is-active path, .dw-sector:hover path, .dw-sector:focus-visible path {
  opacity: 0.95; filter: drop-shadow(0 0 10px rgba(255,255,255,0.25));
}
.dw-hour { fill: var(--mute); font-family: var(--f-tech); font-size: 13px;
  text-anchor: middle; dominant-baseline: middle; pointer-events: none; }
.dw-sector.is-active .dw-hour { fill: var(--bone); }
.dw-dot { fill: var(--laser); filter: drop-shadow(0 0 6px rgba(255,58,35,0.9)); }
.dw-tracer { stroke: var(--laser); stroke-width: 2; opacity: 0;
  stroke-dasharray: 4 5; transition: opacity .4s ease; }
.dw-tracer.is-live { opacity: 0.75; }
.dw-cause { margin: 0 0 8px; color: #c4bfb5; font-size: 14.5px; line-height: 1.55; }
.dw-fix { margin: 0; color: var(--gold); font-family: var(--f-tech); font-size: 13px; line-height: 1.55; }
.drift__readout .swatch { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
```

- [ ] **Step 3:** Verify in browser (puppeteer screenshot of #drift): wheel renders, readout shows the 6 o'clock diagnosis. Regression test passes. Commit: `feat: interactive drift diagnosis wheel`.

---

### Task 3: Hero "take a shot" laser ping

**Files:** Modify: `script.js` (new block after reveal section), `styles.css` (hero block)

- [ ] **Step 1:** `script.js`:

```js
/* --- hero laser ping --- */
(function () {
  var hero = document.getElementById("hero");
  if (!hero) return;
  var shots = 0;
  hero.addEventListener("pointerdown", function (e) {
    if (e.target.closest("a,button,input,form,.signup")) return;
    var r = hero.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    var ping = document.createElement("span");
    ping.className = "laser-ping" + (reduce ? " laser-ping--static" : "");
    ping.style.left = x + "px"; ping.style.top = y + "px";
    hero.appendChild(ping);
    setTimeout(function () { ping.remove(); }, 1600);
    shots++;
    if (!reduce && shots % 3 === 0) {
      var chip = document.createElement("span");
      chip.className = "laser-score";
      chip.textContent = shots % 2 ? "+5" : "A";
      chip.style.left = (x + 18) + "px"; chip.style.top = (y - 14) + "px";
      hero.appendChild(chip);
      setTimeout(function () { chip.remove(); }, 1100);
    }
  });
})();
```

- [ ] **Step 2:** `styles.css` hero block:

```css
.hero { cursor: crosshair; }
.hero .signup, .hero a, .hero button, .hero input { cursor: auto; }
.laser-ping { position: absolute; z-index: 6; width: 10px; height: 10px; margin: -5px 0 0 -5px;
  border-radius: 50%; background: var(--laser); pointer-events: none;
  box-shadow: 0 0 12px 4px rgba(255,58,35,0.85);
  animation: laserDot 1.6s ease-out forwards; }
.laser-ping::before { content: ""; position: absolute; inset: -4px; border-radius: 50%;
  border: 2px solid rgba(255,58,35,0.8); animation: laserRing 0.7s ease-out forwards; }
.laser-ping::after { content: ""; position: absolute; inset: -1px; border-radius: 50%;
  background: radial-gradient(circle, rgba(30,16,12,0.9), transparent 70%);
  opacity: 0; animation: laserScorch 1.6s ease-in 0.25s forwards; }
.laser-ping--static { animation: none; opacity: 0.9; }
.laser-ping--static::before, .laser-ping--static::after { animation: none; }
@keyframes laserDot { 0% { opacity: 1; transform: scale(1.35); } 20% { transform: scale(1); }
  70% { opacity: 0.9; } 100% { opacity: 0; transform: scale(0.6); } }
@keyframes laserRing { from { transform: scale(0.4); opacity: 1; } to { transform: scale(3.2); opacity: 0; } }
@keyframes laserScorch { from { opacity: 0.75; } to { opacity: 0; } }
.laser-score { position: absolute; z-index: 6; pointer-events: none;
  font-family: var(--f-tech); font-weight: 700; font-size: 15px; color: var(--gold);
  text-shadow: 0 0 10px rgba(244,212,154,0.6);
  animation: scorePop 1.1s cubic-bezier(.2,.7,.2,1) forwards; }
@keyframes scorePop { 0% { opacity: 0; transform: translateY(4px) scale(0.8); }
  25% { opacity: 1; transform: translateY(-6px) scale(1.05); }
  100% { opacity: 0; transform: translateY(-26px) scale(1); } }
```

- [ ] **Step 3:** Verify by puppeteer: dispatch pointerdown on hero, screenshot within 500ms shows the ping. Regression test passes. Commit: `feat: hero click-to-dry-fire laser ping`.

---

### Task 4: Stat band count-up

**Files:** Modify: `script.js`

- [ ] **Step 1:** Add after the reveal section (uses existing `reduce` var):

```js
/* --- stat band count-up --- */
(function () {
  var band = document.getElementById("measure");
  if (!band || reduce || !("IntersectionObserver" in window)) return;
  var done = false;
  var io = new IntersectionObserver(function (entries) {
    if (done || !entries.some(function (e) { return e.isIntersecting; })) return;
    done = true; io.disconnect();
    band.querySelectorAll(".chip__num").forEach(function (numEl) {
      var textNode = numEl.firstChild; // number text; <small> suffix stays put
      if (!textNode || textNode.nodeType !== 3) return;
      var target = parseFloat(textNode.textContent);
      if (isNaN(target)) return;
      var decimals = /\./.test(textNode.textContent) ? 1 : 0;
      var t0 = performance.now(), dur = 900;
      function tick(now) {
        var p = Math.min(1, (now - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        textNode.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });
  io.observe(band);
})();
```

- [ ] **Step 2:** Verify: reload page, scroll to band, numbers count up once; with reduced-motion emulation values are static. Regression test passes. Commit: `feat: stat band count-up`.

---

### Task 5: Copy fixes + drills carousel initial slide

**Files:** Modify: `index.html` (targets feature copy, drift lede), `script.js:270-272` (carousel init)

- [ ] **Step 1:** index.html copy fixes: "orner markers" → "corner markers"; "squares, &nbsp;and Six circle array" → "squares, and Six-Circle Array"; drift lede →

```html
<p class="drift__lede">Drift diagnosis tracks each laser pulse from start to finish and shows how your grip or trigger press moved the muzzle at the instant the shot broke. Peregrine reads the movement, names the likely fault — flinch, trigger jerk, heeling, the wrong fingers — and gives you the correction to try next.</p>
```

- [ ] **Step 2:** Carousel init: `jumpToRaw(1)` can run while the track has zero width (off-screen/lazy layout), landing on the wrong slide. After the existing `requestAnimationFrame(function () { jumpToRaw(1); update(); });` add a visibility re-pin:

```js
    if ("IntersectionObserver" in window) {
      var pinned = false;
      var pinIo = new IntersectionObserver(function (entries) {
        if (pinned || !entries.some(function (e) { return e.isIntersecting; })) return;
        pinned = true; pinIo.disconnect();
        if (current() !== 0) jumpToRaw(1);
        update();
      });
      pinIo.observe(car);
    }
```

- [ ] **Step 3:** Verify: fresh reload, scroll to drills — first slide is drills.jpg. Regression test passes. Commit: `fix: copy typos + carousel initial slide pinning`.

---

### Task 6: Video placement (targets loop + CTA background)

**Files:** Modify: `index.html` (targets carousel, #signup), `styles.css` (cta block)

- [ ] **Step 1:** Preview all 6 clips in `assets/hero/Kling/` (ffmpeg frame grabs), pick the best CTA background candidate (dark, slow motion, no text). Record choice in the commit message.

- [ ] **Step 2:** Targets carousel: add as first slide:

```html
<div class="carousel__slide"><figure class="tcard tcard--video"><video muted loop playsinline autoplay preload="metadata" src="assets/video/peregrine_targets_12s_seamless_loop.MP4" width="609" height="376" aria-label="Looping preview of printable Peregrine targets"></video><figcaption class="tcard__label">Print-at-home targets</figcaption></figure></div>
```

CSS: `.tcard--video video { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: inherit; }`

- [ ] **Step 3:** CTA background: inside `#signup` after `.cta__bg`:

```html
<video class="cta__video" muted loop playsinline autoplay preload="metadata" src="assets/hero/Kling/CHOSEN_FILE.mp4" aria-hidden="true"></video>
```

```css
.cta { position: relative; overflow: hidden; }
.cta__video { position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: 0.22; pointer-events: none; }
.cta__inner { position: relative; z-index: 1; }
```

- [ ] **Step 4:** Add a matching dark overlay if text contrast suffers (check screenshot). Update dots in targets carousel (7 buttons). Verify: video loops muted; regression test passes. Commit: `feat: targets loop + CTA ambient video (assets/hero/Kling/<file>)`.

---

### Task 7: Editor — IndexedDB asset store + migration

**Files:** Modify: `editor.js` (new module after `normalize`; changes in `pickImage`/`pickImages`/`pickMedia`, apply functions, `load`)

**Interfaces — Produces:** `assetPut(blob) -> Promise<id>`, `assetGet(id) -> Promise<Blob|null>`, `assetUrl(id) -> Promise<string|null>` (cached object URLs), `resolveAssetImages(root) -> Promise<void>` (resolves `img[data-pe-asset]` to blob URLs), ref format `"pe-asset:<id>"` stored anywhere a src was stored before.

- [ ] **Step 1:** Add the store:

```js
/* ---------- IndexedDB asset store (v4) ---------- */
var ASSET_DB = "peregrineEditorAssets", ASSET_STORE = "assets";
var _dbP = null, _urlCache = {};
function assetDb() {
  if (_dbP) return _dbP;
  _dbP = new Promise(function (res, rej) {
    var rq = indexedDB.open(ASSET_DB, 1);
    rq.onupgradeneeded = function () { rq.result.createObjectStore(ASSET_STORE, { keyPath: "id" }); };
    rq.onsuccess = function () { res(rq.result); };
    rq.onerror = function () { rej(rq.error); };
  });
  return _dbP;
}
function assetPut(blob, name) {
  var id = "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return assetDb().then(function (db) {
    return new Promise(function (res, rej) {
      var tx = db.transaction(ASSET_STORE, "readwrite");
      tx.objectStore(ASSET_STORE).put({ id: id, blob: blob, name: name || "", type: blob.type, addedAt: Date.now() });
      tx.oncomplete = function () { res(id); };
      tx.onerror = function () { rej(tx.error); };
    });
  });
}
function assetGet(id) {
  return assetDb().then(function (db) {
    return new Promise(function (res) {
      var rq = db.transaction(ASSET_STORE).objectStore(ASSET_STORE).get(id);
      rq.onsuccess = function () { res(rq.result ? rq.result.blob : null); };
      rq.onerror = function () { res(null); };
    });
  });
}
function assetUrl(id) {
  if (_urlCache[id]) return Promise.resolve(_urlCache[id]);
  return assetGet(id).then(function (blob) {
    if (!blob) return null;
    _urlCache[id] = URL.createObjectURL(blob);
    return _urlCache[id];
  });
}
function isAssetRef(src) { return typeof src === "string" && src.indexOf("pe-asset:") === 0; }
function refId(src) { return src.slice("pe-asset:".length); }
function resolveAssetImages(root) {
  var imgs = qsa(root || document, "img[data-pe-asset]");
  return Promise.all(imgs.map(function (img) {
    return assetUrl(img.getAttribute("data-pe-asset")).then(function (url) {
      if (url) img.src = url;
    });
  }));
}
function dataURLToBlob(dataURL) {
  var parts = dataURL.split(","), meta = parts[0], b64 = parts[1];
  var type = (meta.match(/data:([^;]+)/) || [])[1] || "image/png";
  var bin = atob(b64), arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: type });
}
```

- [ ] **Step 2:** Change the three pickers to store the blob and hand back `{ ref, url }` instead of a data URL — e.g. `pickImage`:

```js
function pickImage(cb) {
  var inp = el("input"); inp.type = "file"; inp.accept = "image/*";
  inp.onchange = function () {
    var f = inp.files[0]; if (!f) return;
    assetPut(f, f.name).then(function (id) {
      _urlCache[id] = URL.createObjectURL(f);
      cb({ ref: "pe-asset:" + id, url: _urlCache[id], id: id });
    });
  };
  inp.click();
}
```

All call sites change from `img.src = data` to `img.src = data.url; img.setAttribute("data-pe-asset", data.id)` and state records store `data.ref`. Same pattern for `pickImages` (array of `{ref,url,id}`) and `pickMedia`. HTML serialized into state (`fig.outerHTML`, carousel html) must contain `data-pe-asset="<id>"` and a `src=""` placeholder — strip blob: URLs before serializing: set `img.setAttribute("src","")` on a clone before `outerHTML`, or serialize then regex-replace `src="blob:[^"]*"` with `src=""`.

- [ ] **Step 3:** After apply functions run at boot (`applyInsertedImages`, `applyInsertedCarousels`, content src apply), call `resolveAssetImages(document)`.

- [ ] **Step 4:** Migration in `load()` (async, after state is usable): walk `state.content` values with `.src` starting `data:image`, and `state.insertedImages[].html` / `state.insertedCarousels[].html` / `state.added[]` strings containing `src="data:image`. For each: `dataURLToBlob` → `assetPut` → replace with `data-pe-asset` + empty src (strings via regex per occurrence), then `save()` and `resolveAssetImages(document)`. Fire-and-forget promise; toast "Migrated N images to editor storage." when N > 0.

- [ ] **Step 5:** Test with puppeteer script (scratchpad): insert a generated 4MB PNG twice via DevTools protocol file chooser, reload, both images visible; localStorage state contains `pe-asset:` refs and no `data:image`. Regression test passes. Commit: `feat(editor): IndexedDB asset store + base64 migration`.

---

### Task 8: Editor — Export writes real image files

**Files:** Modify: `editor.js` (`serializeHTML`, `exportHTML`, `writeHTML` area)

**Interfaces — Consumes:** `assetGet`, `isAssetRef` from Task 7.

- [ ] **Step 1:** In `scrubEditorAttrs` keep `data-pe-asset` (do not strip). Add an export post-process:

```js
function collectExportAssets(clone) {
  var used = [];
  qsa(clone, "img[data-pe-asset]").forEach(function (img) {
    var id = img.getAttribute("data-pe-asset");
    var ext = "jpg";
    used.push({ id: id, ext: ext, el: img });
  });
  return used;
}
async function exportSiteWithAssets() {
  var clone = document.documentElement.cloneNode(true);
  scrubEditorAttrs(clone);
  qsa(clone, ".pe-dock,.pe-launch").forEach(function (e) { e.remove(); });
  qsa(clone, 'link[href^="editor.css"],script[src^="editor.js"],#pe-saved-state').forEach(function (e) { e.remove(); });
  var used = collectExportAssets(clone);
  var files = [];
  for (var i = 0; i < used.length; i++) {
    var blob = await assetGet(used[i].id);
    if (!blob) continue;
    var ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    var relPath = "assets/edited/" + used[i].id + "." + ext;
    used[i].el.setAttribute("src", relPath);
    used[i].el.removeAttribute("data-pe-asset");
    files.push({ path: relPath, blob: blob });
  }
  qsa(clone, "img[data-pe-asset]").forEach(function (img) { img.removeAttribute("data-pe-asset"); });
  var html = "<!DOCTYPE html>\n" + clone.outerHTML;
  if (window.showDirectoryPicker && files.length) {
    try {
      var dir = await window.showDirectoryPicker({ mode: "readwrite" });
      var assets = await dir.getDirectoryHandle("assets", { create: true });
      var edited = await assets.getDirectoryHandle("edited", { create: true });
      for (var j = 0; j < files.length; j++) {
        var name = files[j].path.split("/").pop();
        var fh = await edited.getFileHandle(name, { create: true });
        var w = await fh.createWritable(); await w.write(files[j].blob); await w.close();
      }
      var ih = await dir.getFileHandle("index.html", { create: true });
      var iw = await ih.createWritable(); await iw.write(html); await iw.close();
      toast("Exported index.html + " + files.length + " image(s) to the chosen folder.");
      return;
    } catch (e) { if (e && e.name === "AbortError") return; }
  }
  // fallback: individual downloads
  files.forEach(function (f) {
    var url = URL.createObjectURL(f.blob);
    var a = el("a"); a.href = url; a.download = f.path.split("/").pop();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
  await writeHTML(html, true);
  if (files.length) toast("Put the downloaded images in assets/edited/ next to index.html.");
}
```

`exportHTML` becomes `function exportHTML() { exportSiteWithAssets(); }`. When there are no asset images, behavior must equal today's (single clean HTML file; `serializeHTML(false)` path retained for `saveWorkingHTML`).

- [ ] **Step 2:** Working-copy save (`saveWorkingHTML`): keep as-is; the saved working HTML keeps `data-pe-asset` attributes with empty/blob src (resolver repopulates on load).

- [ ] **Step 3:** Test: with 2 inserted images, Export → temp dir; verify `index.html` + `assets/edited/*` exist and index references them; no `data:image` or `blob:` in the exported HTML. Regression test passes. Commit: `feat(editor): export writes real image files via directory picker`.

---

### Task 9: Editor — insert card UI (no blocking prompts)

**Files:** Modify: `editor.js` (`insertImageIntoSelection`, `addScrollingImagesToSelection`, `addTargetCarouselToSelection` width prompt, new `openInsertCard`), `editor.css` (card styles)

- [ ] **Step 1:** New reusable card:

```js
function openInsertCard(opts, onConfirm) {
  // opts: { multiple: bool, framedDefault: bool, title: string }
  var overlay = el("div", "pe-insert-overlay");
  var card = el("div", "pe-insert-card");
  card.innerHTML =
    '<h3>' + (opts.title || "Add image") + '</h3>' +
    '<div class="pe-drop" tabindex="0">Drop image' + (opts.multiple ? "s" : "") + ' here or <button type="button" class="pe-btn pe-pickbtn">choose file' + (opts.multiple ? "s" : "") + '</button></div>' +
    '<div class="pe-insert-preview"></div>' +
    '<div class="pe-field"><label>Max width <span class="pe-w-val">520px</span></label>' +
    '<input type="range" class="pe-w" min="120" max="1400" step="10" value="520"></div>' +
    '<div class="pe-field"><label>Aspect ratio</label><select class="pe-ratio">' +
    '<option value="natural">Natural</option><option value="16:9">16:9</option><option value="4:3">4:3</option>' +
    '<option value="1:1">1:1</option><option value="9:16">9:16</option></select></div>' +
    '<label class="pe-toggle-line"><input type="checkbox" class="pe-frame"' + (opts.framedDefault ? " checked" : "") + '> iPhone frame</label>' +
    '<div class="pe-insert-actions"><button type="button" class="pe-btn pe-cancel">Cancel</button>' +
    '<button type="button" class="pe-btn pe-btn--primary pe-confirm" disabled>Insert</button></div>';
  overlay.appendChild(card); document.body.appendChild(overlay);
  var picked = []; // [{ref,url,id,file}]
  var wv = card.querySelector(".pe-w-val"), w = card.querySelector(".pe-w");
  w.oninput = function () { wv.textContent = w.value + "px"; };
  function addFiles(files) {
    Array.prototype.slice.call(files).forEach(function (f) {
      if (!/^image\//.test(f.type)) return;
      assetPut(f, f.name).then(function (id) {
        _urlCache[id] = URL.createObjectURL(f);
        picked.push({ ref: "pe-asset:" + id, url: _urlCache[id], id: id });
        if (!opts.multiple) picked = picked.slice(-1);
        renderPreview();
      });
    });
  }
  function renderPreview() {
    var pv = card.querySelector(".pe-insert-preview");
    pv.innerHTML = "";
    picked.forEach(function (p) { var im = el("img"); im.src = p.url; pv.appendChild(im); });
    card.querySelector(".pe-confirm").disabled = !picked.length;
  }
  var drop = card.querySelector(".pe-drop");
  drop.ondragover = function (e) { e.preventDefault(); drop.classList.add("is-over"); };
  drop.ondragleave = function () { drop.classList.remove("is-over"); };
  drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove("is-over"); addFiles(e.dataTransfer.files); };
  card.querySelector(".pe-pickbtn").onclick = function () {
    var inp = el("input"); inp.type = "file"; inp.accept = "image/*"; inp.multiple = !!opts.multiple;
    inp.onchange = function () { addFiles(inp.files); };
    inp.click();
  };
  function close() { overlay.remove(); }
  card.querySelector(".pe-cancel").onclick = close;
  overlay.onclick = function (e) { if (e.target === overlay) close(); };
  card.querySelector(".pe-confirm").onclick = function () {
    onConfirm({
      images: picked,
      width: parseInt(w.value, 10),
      ratio: card.querySelector(".pe-ratio").value,
      framed: card.querySelector(".pe-frame").checked
    });
    close();
  };
}
```

- [ ] **Step 2:** Rewire `insertImageIntoSelection` (single) and `addScrollingImagesToSelection` (multiple) to `openInsertCard`, dropping all `prompt()`/`confirm()` calls. `createSizedImageFigure` gains `ratio === "natural"` support (omit `aspect-ratio`, use `height:auto`). `addTargetCarouselToSelection` uses the card with the pre-filled target paths (skip drop zone — keep its width prompt replaced by the same card minus file picking, or simply default width 760 with no dialog).

- [ ] **Step 3:** Finder drag-drop insert: in Edit mode, `dragover`/`drop` listeners on `document`; a drop with image files onto a section resolves the host via `imageInsertHost(e.target)` and inserts with defaults (width 520, natural ratio) — no dialog.

- [ ] **Step 4:** `editor.css` card styles (match panel visual language):

```css
.pe-insert-overlay { position: fixed; inset: 0; z-index: 100000; background: rgba(6,6,8,0.6);
  display: flex; align-items: center; justify-content: center; }
.pe-insert-card { width: min(420px, 92vw); background: #131318; border: 1px solid #2a2a33;
  border-radius: 14px; padding: 18px 20px; font-family: var(--f-body, sans-serif); color: #e8e4da; }
.pe-insert-card h3 { margin: 0 0 12px; font-size: 15px; }
.pe-drop { border: 1.5px dashed #3a3a46; border-radius: 10px; padding: 22px 14px;
  text-align: center; font-size: 13px; color: #9a968c; }
.pe-drop.is-over { border-color: var(--laser, #ff3a23); color: #e8e4da; }
.pe-insert-preview { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0; }
.pe-insert-preview img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px;
  border: 1px solid #2a2a33; }
.pe-toggle-line { display: flex; gap: 8px; align-items: center; font-size: 13px; margin: 10px 0; }
.pe-insert-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
```

- [ ] **Step 5:** Test via puppeteer: open card, insert an image, reload persists; no `window.prompt` left in image/carousel insert paths (`grep -n "prompt(" editor.js` shows none in those functions). Regression test updated if it asserts old strings. Commit: `feat(editor): insert card UI, drag-drop, no blocking prompts`.

---

### Task 10: Editor — stable element identity

**Files:** Modify: `editor.js` (`keyFor`, `tagKey`, `byKey`, `scrubEditorAttrs`)

- [ ] **Step 1:** New identity scheme:

```js
var _peIdCounter = 0;
function peId(e) {
  var id = e.getAttribute("data-pe-id");
  if (!id) {
    id = "pe" + Date.now().toString(36) + (_peIdCounter++).toString(36);
    e.setAttribute("data-pe-id", id);
  }
  return id;
}
function keyFor(e) { return "id:" + peId(e); }
function byKey(k) {
  if (k.indexOf("id:") === 0) return document.querySelector('[data-pe-id="' + k.slice(3) + '"]');
  if (k.charAt(0) === "#") return document.querySelector(k);
  // legacy "host|TAG|index" fallback
  var parts = k.split("|");
  if (parts.length === 3) {
    var host = document.getElementById(parts[0]);
    if (host) { var list = qsa(host, KEY_SEL); var e = list[parseInt(parts[2], 10)]; if (e && e.tagName === parts[1]) return e; }
  }
  return document.querySelector('[data-pe-key="' + k + '"]');
}
```

- [ ] **Step 2:** One-time migration at boot: for each key in `state.content` / `state.layout` / `state.sectionFx` / `insertedImages[].hostKey` / `insertedCarousels[].hostKey` that resolves via the legacy path, stamp the element (`peId`) and rewrite the state key to `"id:<peId>"`; `save()` once at the end.

- [ ] **Step 3:** `scrubEditorAttrs`: continue stripping `data-pe-key` but KEEP `data-pe-id` in both working and clean exports (inert attribute; clean export may strip it — decide: strip in clean export via `qsa(clone,"[data-pe-id]")…removeAttribute` only in the `!keepEditor` branch, since the published page needs no identity).

- [ ] **Step 4:** Test: edit a heading, reorder sections, reload — edit still lands on the same heading. Regression test passes. Commit: `feat(editor): stable data-pe-id element identity`.

---

### Task 11: Regression test update + full visual verification

**Files:** Modify: `tests/editor-regression.test.js`, `index.html` (cache-buster `?v=20260702-2`)

- [ ] **Step 1:** Extend `includesAll` assertions: script.js includes `DRIFT_ZONES`, `__peInitDriftWheel`, `laser-ping`, `chip__num` count-up marker; editor.js includes `peregrineEditorAssets`, `pe-asset:`, `showDirectoryPicker`, `pe-insert-card`, `data-pe-id`; index.html includes `id="driftWheel"`, `cta__video`, `tcard--video`. Remove/adjust any assertion the refactor broke intentionally.

- [ ] **Step 2:** Run `node tests/editor-regression.test.js` → passes. Bump `?v=` to `20260702-2` on all four asset links.

- [ ] **Step 3:** Full puppeteer sweep at 1440×1100 and 390×844: hero, band, all features, drift (wheel visible + readout populated), how, kit, watch, signup (video visible). Compare against the pre-change captures.

- [ ] **Step 4:** Commit: `chore: regression assertions + cache bust`. Final `git log --oneline` sanity check.

---

## Self-review notes

- Spec A1–A5 → Tasks 1–6; B1–B4 → Tasks 7–10; testing section → Task 11 plus per-task verify steps. C (Kling prompts) is a chat deliverable, no task.
- Type consistency: `assetPut/assetGet/assetUrl/isAssetRef/refId` defined Task 7, consumed Tasks 8–9; `openInsertCard` defined Task 9 only; `peId/keyFor/byKey` refactor confined to Task 10.
- Known risk: `pickImage` callback signature change (string → `{ref,url,id}`) touches every caller — Task 7 Step 2 lists the call-site pattern; grep `pickImage(`/`pickImages(`/`pickMedia(` to catch all.
