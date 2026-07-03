/* ============================================================
   Peregrine — Customize panel (v3)
   An in-browser, no-code editor for index.html. Changes save to this browser
   (localStorage) and export to a clean index.html. It can:
     • change fonts, text size, and every app color
     • toggle + tune effects (cosmos density, crosshair, film grain)
     • give each section its own entrance animation + accent glow
     • Edit mode  : click any text to retype, any image to swap
     • Layout mode: drag to reposition, scale up/down, align, reset, hide
                    ANY block — including the drift wheel and the crosshair
     • add image/video backgrounds to any section
     • undo / redo, reorder & hide sections, add new blocks
   Remove this file, editor.css, and the #peDock cluster before publishing
   (Export already drops them for you).
   ============================================================ */
(function () {
  "use strict";

  var KEY = "peregrineEdits_v3";
  var OLD = "peregrineEdits_v2";

  var FONTS = {
    display: {
      "Saira Condensed": "Saira+Condensed:wght@500;600;700;800;900",
      "Oswald": "Oswald:wght@400;500;600;700",
      "Bebas Neue": "Bebas+Neue",
      "Anton": "Anton",
      "Archivo Black": "Archivo+Black",
      "Rajdhani": "Rajdhani:wght@500;600;700",
      "Teko": "Teko:wght@500;600;700",
      "Orbitron": "Orbitron:wght@500;700;900",
      "Chakra Petch": "Chakra+Petch:wght@500;600;700",
      "Audiowide": "Audiowide"
    },
    body: {
      "Archivo": "Archivo:wght@400;500;600",
      "Inter": "Inter:wght@400;500;600",
      "Roboto": "Roboto:wght@400;500;700",
      "Work Sans": "Work+Sans:wght@400;500;600",
      "IBM Plex Sans": "IBM+Plex+Sans:wght@400;500;600",
      "Manrope": "Manrope:wght@400;500;600",
      "Source Sans 3": "Source+Sans+3:wght@400;500;600"
    }
  };

  // app palette → CSS var + state key + label
  var COLORS = [
    ["--laser", "laser", "Laser red"],
    ["--amber", "amber", "Amber"],
    ["--gold", "gold", "Gold"],
    ["--recon", "recon", "Recon blue"],
    ["--green", "green", "Green"],
    ["--ink", "ink", "Background"]
  ];

  var ANIMS = [
    ["none", "No effect"], ["rise", "Rise up"], ["fade", "Fade in"],
    ["zoom", "Zoom in"], ["slideL", "Slide from left"], ["slideR", "Slide from right"]
  ];
  var INTERACTION_TRIGGERS = [
    ["scroll", "Scroll into view"],
    ["load", "Page load"],
    ["hover", "Mouse hover"],
    ["click", "Mouse click"]
  ];
  var INTERACTION_EFFECTS = [
    ["fade", "Fade"],
    ["slide-up", "Slide up"],
    ["slide-down", "Slide down"],
    ["slide-left", "Slide left"],
    ["slide-right", "Slide right"],
    ["scale", "Scale"],
    ["rotate", "Rotate"],
    ["blur", "Blur"],
    ["pulse", "Pulse"]
  ];
  var INTERACTION_EASES = [
    ["smooth", "Smooth"],
    ["snap", "Snap"],
    ["ease", "Ease"],
    ["linear", "Linear"]
  ];
  var INTERACTION_REPEAT = [
    ["once", "Once"],
    ["replay", "Replay on scroll"],
    ["loop", "Loop"]
  ];

  var EDIT_SEL = "h1,h2,h3,h4,p,li,figcaption,.feature__kicker,.video-cap,.cta__sub,.drift__readout-label,blockquote";
  var MOVE_SEL = ".feature,.feature__copy,.feature__media,.section__head,.drift,.drift__copy,.drift__wheel,.drift__readout,.device,.kit-card,.step,.tcard,.carousel,.divider,.hero__copy,.hero__device,.cta__inner,.video-stage,.band__inner,.pe-motion-stage,.signup,blockquote,figure,h1,h2,h3,h4,p,li,img";
  var KEY_SEL = EDIT_SEL + ",img," + MOVE_SEL;

  var TARGET_IMAGE_PATHS = [
    "assets/Targets/1784E6BC-CE6A-429B-B56A-A8C77A595D92.png",
    "assets/Targets/4202330E-81B4-4D61-9EC3-438902F6603C.png",
    "assets/Targets/764305A7-9DB5-45A0-B804-192E9E7DD2D1.png",
    "assets/Targets/D039F987-DE6A-4D7D-B9ED-800424419CE5.png",
    "assets/Targets/D9722DB0-6513-41C9-933F-BF64B38ADD6F.png",
    "assets/Targets/EDAD10A4-CD61-409D-8A73-2C9A2E0FCA5A.png"
  ];
  var BACKGROUND_VIDEO_PATHS = [
    "assets/hero/1783014209067_g0wdb146me.mp4"
  ];

  var BLOCKS = {
    heading: '<section class="section pe-block"><div class="section__head"><h2 class="section__title">New heading</h2><p class="section__sub">Add your text here. Turn on Edit, then click to change it.</p></div></section>',
    statement: '<section class="section pe-block" style="text-align:center"><h2 class="section__title" style="max-width:20ch;margin:0 auto">A bold statement goes here.</h2></section>',
    image: '<section class="section pe-block"><figure style="margin:0;border-radius:18px;overflow:hidden;border:1px solid var(--line)"><img src="assets/web/ember-bg.jpg" alt="" style="width:100%;display:block"/></figure></section>',
    imagetext: '<section class="section pe-block"><div class="feature"><div class="feature__media"><figure style="margin:0;border-radius:18px;overflow:hidden;border:1px solid var(--line);max-width:300px"><img src="assets/web/ember-bg.jpg" alt="" style="width:100%;display:block"/></figure></div><div class="feature__copy"><p class="feature__kicker">New</p><h3 class="feature__title">New feature</h3><p class="feature__text">Describe it here. Click the image to swap in a screenshot.</p></div></div></section>',
    quote: '<section class="section pe-block" style="text-align:center"><blockquote style="font-family:var(--f-display);font-size:clamp(24px,3.2vw,40px);max-width:20ch;margin:0 auto;text-transform:uppercase;line-height:1.12">“A great quote about Peregrine.”</blockquote><p class="feature__kicker" style="margin-top:18px">— Someone</p></section>',
    divider: '<section class="section pe-block" style="padding-top:0"><div class="divider" style="--divider-red-length:132px;--divider-offset:0px" aria-hidden="true"><span class="divider__tick"></span></div></section>'
  };

  function cleanNumber(value, fallback, min, max) {
    var n = parseFloat(String(value || "").replace(/[^\d.]/g, ""));
    if (!isFinite(n)) n = fallback;
    return Math.max(min, Math.min(max, n));
  }
  function cleanSignedNumber(value, fallback, min, max) {
    var m = String(value == null ? "" : value).match(/-?\d+(?:\.\d+)?/);
    var n = m ? parseFloat(m[0]) : fallback;
    if (!isFinite(n)) n = fallback;
    return Math.max(min, Math.min(max, n));
  }
  function customImageBlock() {
    var width = Math.round(cleanNumber(prompt("Image box width in pixels", "760"), 760, 160, 1400));
    var ratioRaw = prompt("Aspect ratio as width:height", "1672:941") || "1672:941";
    var parts = ratioRaw.split(/[:/]/);
    var rw = cleanNumber(parts[0], 1672, 1, 4000);
    var rh = cleanNumber(parts[1], 941, 1, 4000);
    return '<section class="section pe-block"><figure style="margin:0 auto;max-width:' + width + 'px;aspect-ratio:' + rw + '/' + rh + ';border-radius:18px;overflow:hidden;border:1px solid var(--line);background:#0c0c0f"><img src="assets/web/ember-bg.jpg" alt="" style="width:100%;height:100%;display:block;object-fit:cover"/></figure></section>';
  }
  function motionSpacerBlock() {
    var height = Math.round(cleanNumber(prompt("Motion spacer height in pixels", "360"), 360, 120, 720));
    return '<section class="section pe-block pe-motion-block"><div class="pe-motion-stage" style="--pe-motion-height:' + height + 'px"><video src="' + BACKGROUND_VIDEO_PATHS[0] + '" autoplay muted loop playsinline aria-hidden="true"></video></div></section>';
  }

  function defaults() {
    return {
      displayFont: "Saira Condensed",
      bodyFont: "Archivo",
      textScale: 1,
      colors: { laser: "#ff3a23", amber: "#e6a063", gold: "#f4d49a", recon: "#8abce0", green: "#63c178", ink: "#0a0a0c" },
      fx: { cosmos: true, crosshair: true, grain: false },
      fxParams: { grain: 0.16, cosmos: 1 },
      content: {},     // key -> {html?, src?, bg?}
      layout: {},      // key -> {dx, dy, scale, align}
      sectionFx: {},   // sectionId -> {anim, glow}
      interactions: {}, // data-pe-key -> {trigger,effect,duration,ease,delay,repeat}
      hiddenEls: [],   // [key] of individually hidden blocks
      order: null,     // [sectionId...]
      hidden: [],      // [sectionId...] (section-level)
      featureOrder: null, // [featureId...] for rows inside #features
      added: [],       // [outerHTML...]
      insertedImages: [], // [{id, hostKey, html}] for images inserted into existing blocks
      insertedCarousels: [] // [{id, hostKey, html}] for scrolling image sets inserted into existing blocks
    };
  }

  function migrate(o) {
    // best-effort upgrade from v2
    var d = defaults();
    if (!o) return d;
    if (o.displayFont) d.displayFont = o.displayFont;
    if (o.bodyFont) d.bodyFont = o.bodyFont;
    if (o.textScale) d.textScale = o.textScale;
    if (o.laser) d.colors.laser = o.laser;
    if (o.recon) d.colors.recon = o.recon;
    if (o.fx) { d.fx.cosmos = !!o.fx.cosmos; d.fx.crosshair = !!o.fx.crosshair; d.fx.grain = !!o.fx.grain; }
    if (o.order) d.order = o.order;
    if (o.hidden) d.hidden = o.hidden;
    if (o.added) d.added = o.added;
    return d;
  }

  function load() {
    try {
      var inlineState = readInlineSavedState();
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = normalize(JSON.parse(raw));
        if (inlineState && (inlineState._savedAt || 0) > (s._modifiedAt || s._savedAt || 0)) {
          localStorage.setItem(KEY, JSON.stringify(inlineState));
          return normalize(inlineState);
        }
        return s;
      }
      if (inlineState) {
        localStorage.setItem(KEY, JSON.stringify(inlineState));
        return normalize(inlineState);
      }
      var oldRaw = localStorage.getItem(OLD);
      if (oldRaw) return migrate(JSON.parse(oldRaw));
    } catch (e) {}
    return defaults();
  }
  function readInlineSavedState() {
    var node = document.getElementById("pe-saved-state");
    if (!node) return null;
    try { return normalize(JSON.parse(node.textContent || "{}")); }
    catch (e) { return null; }
  }
  function normalize(s) {
    var d = defaults();
    s = s || {};
    s.colors = Object.assign({}, d.colors, s.colors || {});
    s.fx = Object.assign({}, d.fx, s.fx || {});
    s.fxParams = Object.assign({}, d.fxParams, s.fxParams || {});
    s.content = s.content || {};
    s.layout = s.layout || {};
    s.sectionFx = s.sectionFx || {};
    s.interactions = s.interactions || {};
    s.hiddenEls = s.hiddenEls || [];
    s.hidden = s.hidden || [];
    s.peIds = s.peIds || {};
    if (s.ctaMedia === undefined) s.ctaMedia = null;
    s.featureOrder = s.featureOrder || null;
    s.added = s.added || [];
    s.insertedImages = s.insertedImages || [];
    s.insertedCarousels = s.insertedCarousels || [];
    s._savedAt = s._savedAt || 0;
    s._modifiedAt = s._modifiedAt || 0;
    if (s.textScale == null) s.textScale = 1;
    if (!s.displayFont) s.displayFont = d.displayFont;
    if (!s.bodyFont) s.bodyFont = d.bodyFont;
    return s;
  }

  var state = load();

  /* ---------- utilities ---------- */
  function qsa(root, sel) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  function save() {
    try { state._modifiedAt = Date.now(); localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { toast("Couldn't save — an image may be too large for this browser's storage."); }
  }
  var saveDebounced = debounce(save, 350);

  /* ---------- IndexedDB asset store (v4) ----------
     Images live as blobs in IndexedDB; localStorage state only carries small
     "pe-asset:<id>" refs, so the ~5MB quota can no longer eat your images.
     In the DOM, an image carries data-pe-asset="<id>" and gets a blob: URL
     at apply time via resolveAssetImages(). */
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
        tx.objectStore(ASSET_STORE).put({ id: id, blob: blob, name: name || "", type: blob.type || "", addedAt: Date.now() });
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
    }).catch(function () { return null; });
  }
  function assetMeta(id) {
    return assetGet(id).then(function (blob) {
      if (!blob) return null;
      if (!_urlCache[id]) _urlCache[id] = URL.createObjectURL(blob);
      return { url: _urlCache[id], type: blob.type || "" };
    });
  }
  function assetUrl(id) {
    return assetMeta(id).then(function (m) { return m ? m.url : null; });
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
  /* Serialize a node for state storage: blob: URLs are session-scoped, so
     blank them (data-pe-asset survives and re-resolves on load). */
  function serializeNode(node) {
    var c = node.cloneNode(true);
    var list = qsa(c, 'img[src^="blob:"],video[src^="blob:"]');
    if ((c.tagName === "IMG" || c.tagName === "VIDEO") && /^blob:/.test(c.getAttribute("src") || "")) list.push(c);
    list.forEach(function (m) { m.setAttribute("src", ""); });
    return c.outerHTML;
  }
  /* One-time migration: convert any legacy base64 images in saved state into
     IndexedDB blobs + refs. Returns a promise resolving to the count moved. */
  function migrateHTMLString(html) {
    var found = [], re = /src="(data:image\/[^"]+)"/g, m;
    while ((m = re.exec(html))) found.push(m[1]);
    if (!found.length) return Promise.resolve({ html: html, moved: 0 });
    var chain = Promise.resolve(html);
    found.forEach(function (du) {
      chain = chain.then(function (cur) {
        return assetPut(dataURLToBlob(du)).then(function (id) {
          return cur.replace('src="' + du + '"', 'src="" data-pe-asset="' + id + '"');
        });
      });
    });
    return chain.then(function (finalHTML) { return { html: finalHTML, moved: found.length }; });
  }
  function migrateBase64Assets() {
    var jobs = [];
    Object.keys(state.content || {}).forEach(function (k) {
      var rec = state.content[k];
      if (rec && typeof rec.src === "string" && rec.src.indexOf("data:image") === 0) {
        jobs.push(assetPut(dataURLToBlob(rec.src)).then(function (id) {
          rec.src = "pe-asset:" + id;
          var e = byKey(k);
          if (e && e.tagName === "IMG") e.setAttribute("data-pe-asset", id);
          return 1;
        }));
      }
      if (rec && typeof rec.bg === "string" && rec.bg.indexOf("data:") === 0) {
        jobs.push(assetPut(dataURLToBlob(rec.bg)).then(function (id) {
          rec.bg = "pe-asset:" + id;
          return 1;
        }));
      }
    });
    (state.insertedImages || []).forEach(function (rec) {
      if (rec && typeof rec.html === "string") {
        jobs.push(migrateHTMLString(rec.html).then(function (r) { rec.html = r.html; return r.moved; }));
      }
    });
    (state.insertedCarousels || []).forEach(function (rec) {
      if (rec && typeof rec.html === "string") {
        jobs.push(migrateHTMLString(rec.html).then(function (r) { rec.html = r.html; return r.moved; }));
      }
    });
    (state.added || []).forEach(function (html, idx) {
      if (typeof html === "string") {
        jobs.push(migrateHTMLString(html).then(function (r) { state.added[idx] = r.html; return r.moved; }));
      }
    });
    return Promise.all(jobs).then(function (counts) {
      var n = counts.reduce(function (a, b) { return a + (b || 0); }, 0);
      if (n > 0) { save(); resolveAssetImages(document); toast("Migrated " + n + " image(s) to editor storage."); }
      return n;
    });
  }

  function lighten(hex, amt) {
    var c = (hex || "#ff3a23").replace("#", "");
    if (c.length === 3) c = c.split("").map(function (x) { return x + x; }).join("");
    var r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    r = Math.round(r + (255 - r) * amt); g = Math.round(g + (255 - g) * amt); b = Math.round(b + (255 - b) * amt);
    return "#" + [r, g, b].map(function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
  }

  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = el("div", "pe-toast"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("pe-show");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove("pe-show"); }, 2200);
  }

  /* ---------- stable element identity (v4) ----------
     Elements get a permanent data-pe-id stamp the first time they're keyed;
     ids survive reorders and content changes, so edits can never re-attach to
     the wrong element. Legacy "#id" and "host|TAG|index" keys still resolve
     (and are migrated to id-keys at boot). */
  var _peIdCounter = 0;
  function normText(e) { return (e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40); }
  function locatorFor(e) {
    var host = e.closest("[id]") || document.getElementById("main") || document.body;
    var list = qsa(host, KEY_SEL);
    return { host: host.id || "", tag: e.tagName, idx: list.indexOf(e), text: normText(e) };
  }
  function peId(e) {
    var id = e.getAttribute("data-pe-id");
    if (!id) {
      id = "pe" + Date.now().toString(36) + (_peIdCounter++).toString(36);
      e.setAttribute("data-pe-id", id);
      state.peIds = state.peIds || {};
      state.peIds[id] = locatorFor(e);
      saveDebounced();
    }
    return id;
  }
  /* Stamps don't survive a reload (undo reloads the page), so state carries a
     locator per id and we re-stamp at boot: position first, then a text-anchor
     search so a stamp finds its element even after the HTML shifted. */
  function restampPeIds() {
    var map = state.peIds || {};
    Object.keys(map).forEach(function (id) {
      if (document.querySelector('[data-pe-id="' + id + '"]')) return;
      var loc = map[id]; if (!loc) return;
      var host = loc.host ? document.getElementById(loc.host) : document.getElementById("main");
      if (!host) return;
      var list = qsa(host, KEY_SEL);
      var cand = list[loc.idx];
      if (!(cand && cand.tagName === loc.tag && (!loc.text || normText(cand) === loc.text))) {
        cand = null;
        for (var i = 0; i < list.length; i++) {
          if (list[i].tagName === loc.tag && normText(list[i]) === loc.text && !list[i].hasAttribute("data-pe-id")) { cand = list[i]; break; }
        }
        if (!cand && list[loc.idx] && list[loc.idx].tagName === loc.tag && !list[loc.idx].hasAttribute("data-pe-id")) {
          cand = list[loc.idx]; // text drifted (edited content) — trust position
        }
      }
      if (cand) cand.setAttribute("data-pe-id", id);
    });
  }
  function keyFor(e) {
    if (e.id) return "#" + e.id; // real DOM ids are already stable
    return "id:" + peId(e);
  }
  function legacyByKey(k) {
    // "host|TAG|index" positional lookup from v3
    var parts = k.split("|");
    if (parts.length === 3) {
      var host = document.getElementById(parts[0]);
      if (host) {
        var list = qsa(host, KEY_SEL);
        var e = list[parseInt(parts[2], 10)];
        if (e && e.tagName === parts[1]) return e;
      }
    }
    return null;
  }
  function tagKey(e) {
    if (e.closest(".pe-block")) return;       // added blocks serialize whole HTML
    if (!e.hasAttribute("data-pe-key")) e.setAttribute("data-pe-key", keyFor(e));
  }
  function byKey(k) {
    if (!k) return null;
    if (k.indexOf("id:") === 0) return document.querySelector('[data-pe-id="' + k.slice(3) + '"]');
    if (k.charAt(0) === "#") return document.querySelector(k);
    var direct = document.querySelector('[data-pe-key="' + k + '"]');
    if (direct) return direct;
    return legacyByKey(k);
  }
  /* One-time boot migration: rewrite legacy positional keys to id-keys while
     the positions still resolve. */
  function migrateLegacyKeys() {
    var changed = false;
    function migrated(k) {
      if (!k || k.indexOf("id:") === 0 || k.charAt(0) === "#" || k.indexOf("inserted:") === 0 || k.indexOf("carousel:") === 0) return k;
      var e = legacyByKey(k) || document.querySelector('[data-pe-key="' + k + '"]');
      if (!e) return k;
      var nk = "id:" + peId(e);
      e.setAttribute("data-pe-key", nk);
      changed = true;
      return nk;
    }
    ["content", "layout", "sectionFx", "interactions"].forEach(function (bucket) {
      var map = state[bucket] || {};
      Object.keys(map).forEach(function (k) {
        var nk = migrated(k);
        if (nk !== k) { map[nk] = map[k]; delete map[k]; }
      });
    });
    state.hiddenEls = (state.hiddenEls || []).map(migrated);
    (state.insertedImages || []).concat(state.insertedCarousels || []).forEach(function (rec) {
      if (rec && rec.hostKey) rec.hostKey = migrated(rec.hostKey);
    });
    if (changed) save();
  }

  /* ---------- apply saved state to the page ---------- */
  function injectAdded() {
    var anchor = document.getElementById("signup");
    (state.added || []).forEach(function (html) {
      var wrap = el("div"); wrap.innerHTML = html.trim();
      var node = wrap.firstChild;
      if (node && anchor) anchor.parentNode.insertBefore(node, anchor);
      else if (node) document.getElementById("main").appendChild(node);
    });
  }
  function applyOrder() {
    if (!state.order) return;
    var main = document.getElementById("main");
    state.order.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec && sec.parentNode === main) main.appendChild(sec);
    });
  }
  function applyFeatureOrder() {
    if (!state.featureOrder) return;
    var parent = document.getElementById("features");
    if (!parent) return;
    state.featureOrder.forEach(function (id) {
      var row = document.getElementById(id);
      if (row && row.parentNode === parent && row.classList.contains("feature")) parent.appendChild(row);
    });
  }
  function applyHidden() {
    (state.hidden || []).forEach(function (id) { var s = document.getElementById(id); if (s) s.style.display = "none"; });
  }

  function tagElements() {
    var roots = [document.getElementById("main"), document.querySelector(".footer")];
    roots.forEach(function (root) {
      if (!root) return;
      qsa(root, EDIT_SEL).forEach(function (e) {
        if (e.closest(".nav") || e.closest(".pe-panel") || e.closest(".pe-seltools")) return;
        e.setAttribute("data-pe-edit", ""); tagKey(e);
      });
      qsa(root, "img").forEach(function (img) {
        if (img.closest(".pe-panel")) return;
        img.setAttribute("data-pe-img", ""); tagKey(img);
      });
      qsa(root, MOVE_SEL).forEach(function (m) {
        if (m.closest(".nav") || m.closest(".pe-panel")) return;
        m.setAttribute("data-pe-move", ""); tagKey(m);
      });
    });
    // background-bearing layers/sections (swapped from the panel)
    qsa(document, "#main > section, .footer, .hero__bg, .cta__bg").forEach(function (b) { b.setAttribute("data-pe-bg", ""); tagKey(b); });
  }

  function isVideoSrc(src) {
    return /^data:video\//i.test(src) || /\.(mp4|mov|m4v|webm)([?#].*)?$/i.test(src || "");
  }
  function clearBackgroundMedia(e) {
    qsa(e, ":scope > .pe-bg-video").forEach(function (v) { v.remove(); });
    e.classList.remove("has-pe-media-bg");
    e.style.backgroundImage = "";
    e.style.backgroundSize = "";
    e.style.backgroundPosition = "";
    e.style.backgroundRepeat = "";
  }
  function applyBg(e, data) {
    clearBackgroundMedia(e);
    e.style.backgroundImage =
      "linear-gradient(180deg, rgba(10,10,12,0.45), rgba(10,10,12,0.82)), url('" + data + "')";
    e.style.backgroundSize = "cover";
    e.style.backgroundPosition = "center";
    e.style.backgroundRepeat = "no-repeat";
  }
  function applyBackgroundMedia(e, data, forceVideo) {
    if (forceVideo === true || isVideoSrc(data)) {
      clearBackgroundMedia(e);
      e.classList.add("has-pe-media-bg");
      var v = document.createElement("video");
      v.className = "pe-bg-video";
      v.src = data;
      v.autoplay = true;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.setAttribute("muted", "");
      v.setAttribute("aria-hidden", "true");
      e.insertBefore(v, e.firstChild);
      var p = v.play && v.play();
      if (p && p.catch) p.catch(function () {});
      return;
    }
    applyBg(e, data);
  }
  /* ---------- CTA ("Be first on the line") ambient video ---------- */
  var CTA_CLIPS = [
    ["Range clip 1 (4s)", "assets/hero/Kling/1783014795234_545nl3papts.mp4"],
    ["Range clip 2 (4s)", "assets/hero/Kling/1783014802024_wtwbdtuinop.mp4"],
    ["Range clip 3 (6s)", "assets/hero/Kling/1783014825023_b5oxadxzfb.mp4"],
    ["Range clip 4 (4s)", "assets/hero/Kling/1783015965896_nppbn3s3a0j.mp4"],
    ["Range clip 5 (4s)", "assets/hero/Kling/1783015975536_d8x8eck1gap.mp4"],
    ["Range clip 6 (6s)", "assets/hero/Kling/1783016018744_7mcs1ej3znn.mp4"],
    ["Targets loop (12s)", "assets/video/peregrine_targets_12s_seamless_loop.MP4"],
    ["Hero montage draft", "assets/hero/hero_montage_draft.mp4"],
    ["Motion MP4", "assets/hero/1783014209067_g0wdb146me.mp4"]
  ];
  function applyCtaMedia() {
    var vid = document.querySelector(".cta__video");
    var scrim = document.querySelector(".cta__scrim");
    var m = state.ctaMedia;
    if (!vid || !m) return;
    function setSrc(src) {
      if (vid.getAttribute("src") !== src) {
        vid.setAttribute("src", src);
        var p = vid.play && vid.play();
        if (p && p.catch) p.catch(function () {});
      }
    }
    if (m.src) {
      if (isAssetRef(m.src)) {
        vid.setAttribute("data-pe-asset", refId(m.src));
        assetUrl(refId(m.src)).then(function (u) { if (u) setSrc(u); });
      } else {
        vid.removeAttribute("data-pe-asset");
        setSrc(m.src);
      }
    }
    if (m.opacity != null) vid.style.opacity = m.opacity;
    if (m.brightness != null) vid.style.filter = "saturate(0.7) brightness(" + m.brightness + ")";
    if (m.scrim != null && scrim) {
      scrim.style.background = "radial-gradient(80% 90% at 50% 45%, rgba(10,10,12," +
        (m.scrim * 0.8).toFixed(3) + "), rgba(10,10,12," +
        Math.min(0.98, 0.45 + m.scrim * 0.55).toFixed(3) + "))";
    }
  }

  function applyContent() {
    Object.keys(state.content || {}).forEach(function (k) {
      var rec = state.content[k], e = byKey(k);
      if (!e) return;
      if (rec.html != null && e.tagName !== "IMG") e.innerHTML = rec.html;
      if (rec.src != null && e.tagName === "IMG") {
        if (isAssetRef(rec.src)) e.setAttribute("data-pe-asset", refId(rec.src));
        else e.src = rec.src;
      }
      if (rec.bg != null) {
        if (isAssetRef(rec.bg)) {
          (function (elm, ref) {
            assetMeta(refId(ref)).then(function (m) {
              if (m) applyBackgroundMedia(elm, m.url, m.type.indexOf("video/") === 0);
            });
          })(e, rec.bg);
        } else {
          applyBackgroundMedia(e, rec.bg);
        }
      }
    });
  }

  function createSizedImageFigure(src, opts) {
    opts = opts || {};
    var width = Math.round(cleanNumber(opts.width, 520, 120, 1400));
    var ratio = opts.ratio || "16:9";
    var wrap = el("div");
    if (ratio === "natural") {
      wrap.innerHTML = '<figure class="pe-inserted-image" style="margin:18px auto 0;max-width:' + width + 'px;border-radius:18px;overflow:hidden;border:1px solid var(--line);background:#0c0c0f"><img src="" alt="" style="width:100%;display:block"/></figure>';
    } else {
      var parts = String(ratio).split(/[:/]/);
      var rw = cleanNumber(parts[0], 16, 1, 4000);
      var rh = cleanNumber(parts[1], 9, 1, 4000);
      wrap.innerHTML = '<figure class="pe-inserted-image" style="margin:18px auto 0;max-width:' + width + 'px;aspect-ratio:' + rw + '/' + rh + ';border-radius:18px;overflow:hidden;border:1px solid var(--line);background:#0c0c0f"><img src="" alt="" style="width:100%;height:100%;display:block;object-fit:cover"/></figure>';
    }
    var fig = wrap.firstChild;
    fig.querySelector("img").src = src;
    return fig;
  }

  function statusChromeHTML() {
    return '<span class="device__island" aria-hidden="true"></span><div class="device__status" aria-hidden="true"><span class="device__status-left"><span class="device__time">9:41</span></span><span class="device__status-right"><span class="device__cell"><span></span><span></span><span></span><span></span></span><span class="device__wifi"><svg viewBox="0 0 18 14" focusable="false" aria-hidden="true"><path d="M2 5.2C5.9 1.7 12.1 1.7 16 5.2"></path><path d="M5 8.1c2.2-1.9 5.8-1.9 8 0"></path><path d="M8.1 10.9c.5-.4 1.3-.4 1.8 0"></path></svg></span><span class="device__battery"><span></span></span></span></div>';
  }

  function carouselSlideHTML(item, framed) {
    // item: plain src string (bundled asset path) or {url, id} from storePicked
    var src = typeof item === "string" ? item : item.url;
    var assetAttr = (typeof item === "object" && item.id) ? '" data-pe-asset="' + item.id : "";
    if (framed) {
      return '<div class="carousel__slide"><div class="device">' + statusChromeHTML() + '<img src="' + src + assetAttr + '" loading="lazy" alt=""></div></div>';
    }
    return '<div class="carousel__slide"><figure class="pe-carousel-image"><img src="' + src + assetAttr + '" loading="lazy" alt=""></figure></div>';
  }

  function createImageCarousel(sources, opts) {
    opts = opts || {};
    var width = Math.round(cleanNumber(opts.width, 520, 180, 1400));
    var framed = !!opts.framed;
    var wrap = el("div");
    wrap.innerHTML = '<div class="carousel pe-inserted-carousel" data-carousel="" style="max-width:' + width + 'px"><div class="carousel__viewport"><div class="carousel__track"></div></div><button class="carousel__arrow carousel__arrow--prev" type="button" aria-label="Previous">‹</button><button class="carousel__arrow carousel__arrow--next" type="button" aria-label="Next">›</button><div class="carousel__dots" aria-hidden="true"></div></div>';
    var car = wrap.firstChild;
    var track = car.querySelector(".carousel__track");
    sources.forEach(function (src) { track.insertAdjacentHTML("beforeend", carouselSlideHTML(src, framed)); });
    return car;
  }

  function applyInsertedImages() {
    (state.insertedImages || []).forEach(function (rec) {
      if (!rec || !rec.id || !rec.hostKey || !rec.html) return;
      if (document.querySelector('[data-pe-inserted="' + rec.id + '"]')) return;
      var host = byKey(rec.hostKey);
      if (!host) return;
      var wrap = el("div"); wrap.innerHTML = rec.html.trim();
      var node = wrap.firstChild;
      if (!node) return;
      node.setAttribute("data-pe-inserted", rec.id);
      node.setAttribute("data-pe-key", "inserted:" + rec.id);
      qsa(node, "img").forEach(function (img) {
        if (!img.hasAttribute("data-pe-key")) img.setAttribute("data-pe-key", "inserted:" + rec.id + ":img");
      });
      host.appendChild(node);
    });
  }

  function applyInsertedCarousels() {
    (state.insertedCarousels || []).forEach(function (rec) {
      if (!rec || !rec.id || !rec.hostKey || !rec.html) return;
      if (document.querySelector('[data-pe-carousel-inserted="' + rec.id + '"]')) return;
      var host = byKey(rec.hostKey);
      if (!host) return;
      var wrap = el("div"); wrap.innerHTML = rec.html.trim();
      var node = wrap.firstChild;
      if (!node) return;
      node.setAttribute("data-pe-carousel-inserted", rec.id);
      node.setAttribute("data-pe-key", "carousel:" + rec.id);
      host.appendChild(node);
    });
    if (window.__peInitCarousels) window.__peInitCarousels(document);
  }

  function targetMediaKeys() {
    var media = document.querySelector("#targets .feature__media");
    var keys = {};
    if (!media) return keys;
    qsa(media, "[data-pe-key]").forEach(function (node) {
      keys[node.getAttribute("data-pe-key")] = true;
    });
    if (media.hasAttribute("data-pe-key")) keys[media.getAttribute("data-pe-key")] = true;
    return keys;
  }
  function hostKeyIsTargetSection(key, keys) {
    // v4: "id:" keys are deliberate edits with stable identity — never purge
    // them. This sanitizer only exists to clear out legacy (positional/#id)
    // target-carousel junk from pre-v4 saved states.
    if (!key || key.indexOf("id:") === 0) return false;
    return !!keys[key];
  }
  function sanitizeTargetState() {
    var keys = targetMediaKeys();
    var changed = false;
    ["content", "layout"].forEach(function (bucket) {
      Object.keys(state[bucket] || {}).forEach(function (key) {
        if (hostKeyIsTargetSection(key, keys)) {
          delete state[bucket][key];
          changed = true;
        }
      });
    });
    state.hiddenEls = (state.hiddenEls || []).filter(function (key) {
      if (hostKeyIsTargetSection(key, keys)) {
        changed = true;
        return false;
      }
      return true;
    });
    state.insertedImages = (state.insertedImages || []).filter(function (rec) {
      if (rec && hostKeyIsTargetSection(rec.hostKey, keys)) {
        changed = true;
        return false;
      }
      return true;
    });
    state.insertedCarousels = (state.insertedCarousels || []).filter(function (rec) {
      if (rec && hostKeyIsTargetSection(rec.hostKey, keys)) {
        changed = true;
        return false;
      }
      return true;
    });
    if (changed) save();
  }

  function applyTransform(e, L) {
    var t = "";
    if (L.dx || L.dy) t += "translate(" + (L.dx || 0) + "px," + (L.dy || 0) + "px) ";
    if (L.scale && L.scale !== 1) t += "scale(" + L.scale + ")";
    e.style.transform = t.trim();
    // lift any CSS max-width cap so an explicit resize actually takes effect
    if (L.width) { e.style.width = Math.round(L.width) + "px"; e.style.maxWidth = "none"; }
    if (L.height) e.style.height = Math.round(L.height) + "px";
    applyMediaStretch(e, L);
    if (L.align) e.style.textAlign = L.align;
    if (L.padTop != null) e.style.paddingTop = Math.round(L.padTop) + "px";
    if (L.padBottom != null) e.style.paddingBottom = Math.round(L.padBottom) + "px";
    if (L.dividerLength != null) e.style.setProperty("--divider-red-length", Math.round(L.dividerLength) + "px");
    if (L.dividerOffset != null) e.style.setProperty("--divider-offset", Math.round(L.dividerOffset) + "px");
  }
  function applyMediaStretch(e, L) {
    e.classList.toggle("pe-force-media-stretch", !!(L && (L.width || L.height)));
  }
  function applyLayout() {
    Object.keys(state.layout || {}).forEach(function (k) {
      var e = byKey(k); if (e) applyTransform(e, state.layout[k]);
    });
    (state.hiddenEls || []).forEach(function (k) { var e = byKey(k); if (e) e.style.display = "none"; });
  }

  function applySectionFx() {
    Object.keys(state.sectionFx || {}).forEach(function (id) {
      var sec = document.getElementById(id); if (!sec) return;
      var f = state.sectionFx[id] || {};
      if (f.anim && f.anim !== "none") sec.setAttribute("data-pe-anim", f.anim);
      else { sec.removeAttribute("data-pe-anim"); sec.classList.remove("pe-in"); }
      sec.classList.toggle("pe-glow", !!f.glow);
    });
    if (window.__peObserveAnims) window.__peObserveAnims();
  }
  function applyInteractionToTarget(target, rec) {
    if (!target || !rec) return;
    target.setAttribute("data-pe-interaction", JSON.stringify(rec));
    target.setAttribute("data-pe-ix-effect", rec.effect || "fade");
    if (window.__peInitInteractions) window.__peInitInteractions(target.parentNode || document);
  }
  function applyInteractions() {
    Object.keys(state.interactions || {}).forEach(function (key) {
      var target = byKey(key);
      if (target) applyInteractionToTarget(target, state.interactions[key]);
    });
  }
  function removeInteraction(target) {
    if (!target) return;
    target.removeAttribute("data-pe-interaction");
    target.removeAttribute("data-pe-ix-effect");
    target.classList.remove("pe-ix-pending", "pe-ix-in", "pe-ix-run");
    target.style.removeProperty("--pe-ix-duration");
    target.style.removeProperty("--pe-ix-delay");
    target.style.removeProperty("--pe-ix-ease");
  }
  function previewInteraction(target, rec) {
    if (!target || !rec) return;
    applyInteractionToTarget(target, rec);
    if (window.__peRunInteraction) window.__peRunInteraction(target, rec);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  var GRAIN_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

  function buildOverrides() {
    var fam = [];
    if (FONTS.display[state.displayFont]) fam.push(FONTS.display[state.displayFont]);
    if (FONTS.body[state.bodyFont]) fam.push(FONTS.body[state.bodyFont]);
    var link = document.getElementById("pe-fonts");
    if (fam.length) {
      var href = "https://fonts.googleapis.com/css2?" + fam.map(function (f) { return "family=" + f; }).join("&") + "&display=swap";
      if (!link) { link = el("link"); link.id = "pe-fonts"; link.rel = "stylesheet"; document.head.appendChild(link); }
      link.href = href;
    }

    var vars = [];
    vars.push("--f-display:'" + state.displayFont + "',sans-serif");
    vars.push("--f-body:'" + state.bodyFont + "',system-ui,sans-serif");
    COLORS.forEach(function (c) { if (state.colors[c[1]]) vars.push(c[0] + ":" + state.colors[c[1]]); });
    vars.push("--laser-soft:" + lighten(state.colors.laser, 0.22));
    vars.push("--pe-text:" + (state.textScale || 1));

    var css = ":root{" + vars.join(";") + "}";
    if ((state.textScale || 1) !== 1) {
      css += "body{font-size:calc(clamp(15px,1.05vw,17px)*var(--pe-text))}";
      css += ".hero__title{font-size:calc(clamp(46px,7vw,92px)*var(--pe-text))}";
      css += ".section__title{font-size:calc(clamp(32px,4.6vw,56px)*var(--pe-text))}";
      css += ".feature__title{font-size:calc(clamp(26px,3.4vw,42px)*var(--pe-text))}";
      css += ".hero__lede,.feature__text,.section__sub,.drift__lede{font-size:calc(clamp(15px,1.2vw,18px)*var(--pe-text))}";
    }
    if (!state.fx.crosshair) css += ".crosshair{display:none!important}";
    if (!state.fx.cosmos) css += "#cosmos{display:none!important}";
    if (state.fx.grain) {
      var op = state.fxParams.grain != null ? state.fxParams.grain : 0.16;
      css += "body::after{content:'';position:fixed;inset:0;z-index:55;pointer-events:none;" +
        "mix-blend-mode:soft-light;opacity:" + op + ";background-size:170px;" +
        "background-image:url(\"" + GRAIN_IMG + "\")}";
    }

    var st = document.getElementById("pe-overrides");
    if (!st) { st = el("style"); st.id = "pe-overrides"; document.head.appendChild(st); }
    st.textContent = css;

    // live cosmos density
    window.__peCosmos = state.fx.cosmos ? (state.fxParams.cosmos || 1) : 1;
    if (window.__peCosmosRebuild) window.__peCosmosRebuild();
  }

  function captureAdded() {
    state.added = qsa(document, ".pe-block").map(function (b) {
      var c = b.cloneNode(true);
      qsa(c, "[data-pe-edit],[data-pe-img],[data-pe-move],[data-pe-key],[data-pe-bg],[data-pe-inserted],[data-pe-carousel-inserted],[data-pe-carousel-ready],[contenteditable]").forEach(function (e) {
        e.removeAttribute("data-pe-edit"); e.removeAttribute("data-pe-img"); e.removeAttribute("data-pe-move");
        e.removeAttribute("data-pe-key"); e.removeAttribute("data-pe-bg"); e.removeAttribute("data-pe-inserted"); e.removeAttribute("data-pe-carousel-inserted"); e.removeAttribute("data-pe-carousel-ready"); e.removeAttribute("contenteditable");
        e.classList.remove("pe-selected");
      });
      c.classList.remove("pe-selected");
      qsa(c, 'img[src^="blob:"],video[src^="blob:"]').forEach(function (m) { m.setAttribute("src", ""); });
      return c.outerHTML;
    });
    save();
  }

  function applyAll() {
    injectAdded();
    applyOrder();
    applyFeatureOrder();
    applyHidden();
    restampPeIds();
    tagElements();
    sanitizeTargetState();
    applyInsertedImages();
    applyInsertedCarousels();
    tagElements();
    applyContent();
    applyCtaMedia();
    applyLayout();
    applySectionFx();
    applyInteractions();
    buildOverrides();
  }

  /* ---------- undo / redo (snapshot + reload to re-apply cleanly) ---------- */
  var undoStack = [], redoStack = [], undoBtn, redoBtn;
  function snapshot() {
    var s = JSON.stringify(state);
    if (undoStack[undoStack.length - 1] === s) return;
    undoStack.push(s);
    if (undoStack.length > 40) undoStack.shift();
    redoStack.length = 0;
    refreshUndo();
  }
  function refreshUndo() {
    if (undoBtn) undoBtn.disabled = !undoStack.length;
    if (redoBtn) redoBtn.disabled = !redoStack.length;
  }
  function persistHistory() {
    try {
      sessionStorage.setItem("pe_undo", JSON.stringify(undoStack));
      sessionStorage.setItem("pe_redo", JSON.stringify(redoStack));
      sessionStorage.setItem("pe_open", document.body.classList.contains("pe-open") ? "1" : "0");
      sessionStorage.setItem("pe_scroll", String(window.scrollY || window.pageYOffset || 0));
    } catch (e) {}
  }
  function applyHistory(json) { state = normalize(JSON.parse(json)); save(); persistHistory(); location.reload(); }
  function undo() { if (!undoStack.length) return; redoStack.push(JSON.stringify(state)); applyHistory(undoStack.pop()); }
  function redo() { if (!redoStack.length) return; undoStack.push(JSON.stringify(state)); applyHistory(redoStack.pop()); }

  /* ---------- modes ---------- */
  var editing = false, layout = false;
  function setEditing(on) {
    if (on) setLayout(false);
    editing = on;
    document.body.classList.toggle("pe-editing", on);
    qsa(document, "[data-pe-edit]").forEach(function (e) {
      if (on) e.setAttribute("contenteditable", "true"); else e.removeAttribute("contenteditable");
    });
    syncToggles();
  }
  function setLayout(on) {
    if (on) setEditing(false);
    layout = on;
    document.body.classList.toggle("pe-layout", on);
    if (!on) deselect();
    syncToggles();
  }
  function syncToggles() {
    var eb = document.getElementById("peEdit");
    if (eb) eb.setAttribute("aria-pressed", editing ? "true" : "false");
    var lb = document.getElementById("peLayout");
    if (lb) lb.setAttribute("aria-pressed", layout ? "true" : "false");
    if (editSwitch) editSwitch.setAttribute("aria-pressed", editing ? "true" : "false");
    if (layoutSwitch) layoutSwitch.setAttribute("aria-pressed", layout ? "true" : "false");
  }
  var editSwitch = null, layoutSwitch = null;

  /* ---------- text editing ---------- */
  document.addEventListener("focusin", function (e) {
    var t = e.target.closest && e.target.closest("[data-pe-edit]");
    if (t && editing) snapshot();
  });
  document.addEventListener("input", function (e) {
    var t = e.target.closest && e.target.closest("[data-pe-edit]");
    if (!t || !editing) return;
    if (t.closest(".pe-block")) { captureAdded(); return; }
    var k = t.getAttribute("data-pe-key");
    if (k) { state.content[k] = state.content[k] || {}; state.content[k].html = t.innerHTML; saveDebounced(); }
  });

  /* ---------- image swap (edit mode) ---------- */
  document.addEventListener("click", function (e) {
    if (!editing) return;
    var img = e.target.closest && e.target.closest("[data-pe-img]");
    if (!img) return;
    e.preventDefault();
    pickImage(function (data) {
      snapshot();
      img.src = data.url;
      img.setAttribute("data-pe-asset", data.id);
      if (img.closest(".pe-block")) { captureAdded(); }
      else { var k = img.getAttribute("data-pe-key"); state.content[k] = state.content[k] || {}; state.content[k].src = data.ref; save(); }
      toast("Image swapped");
    });
  });
  /* Store a picked File in IndexedDB and describe it: {ref, url, id, type}. */
  function storePicked(f) {
    return assetPut(f, f.name).then(function (id) {
      _urlCache[id] = URL.createObjectURL(f);
      return { ref: "pe-asset:" + id, url: _urlCache[id], id: id, type: f.type || "" };
    });
  }
  function pickImage(cb) {
    var inp = el("input"); inp.type = "file"; inp.accept = "image/*";
    inp.onchange = function () {
      var f = inp.files[0]; if (!f) return;
      storePicked(f).then(cb);
    };
    inp.click();
  }
  function pickImages(cb) {
    var inp = el("input"); inp.type = "file"; inp.accept = "image/*"; inp.multiple = true;
    inp.onchange = function () {
      var files = Array.prototype.slice.call(inp.files || []);
      if (!files.length) return;
      Promise.all(files.map(storePicked)).then(cb);
    };
    inp.click();
  }
  function pickMedia(cb) {
    var inp = el("input"); inp.type = "file"; inp.accept = "image/*,video/*";
    inp.onchange = function () {
      var f = inp.files[0]; if (!f) return;
      storePicked(f).then(cb);
    };
    inp.click();
  }

  /* Finder drag-drop: in Edit mode, dropping image files onto any section
     inserts them there with sensible defaults (width 520, natural ratio). */
  document.addEventListener("dragover", function (e) {
    if (!editing) return;
    var types = (e.dataTransfer && e.dataTransfer.types) || [];
    if (Array.prototype.indexOf.call(types, "Files") !== -1) e.preventDefault();
  });
  document.addEventListener("drop", function (e) {
    if (!editing) return;
    if (e.target.closest && (e.target.closest(".pe-insert-overlay") || e.target.closest(".pe-panel"))) return;
    var files = e.dataTransfer && e.dataTransfer.files;
    if (!files || !files.length) return;
    var imgs = Array.prototype.filter.call(files, function (f) { return /^image\//.test(f.type); });
    if (!imgs.length) return;
    e.preventDefault();
    var at = e.target.nodeType === 1 ? e.target : e.target.parentElement;
    var host = imageInsertHost(at) || document.getElementById("main");
    Promise.all(imgs.map(storePicked)).then(function (list) {
      list.forEach(function (data) { insertPickedImage(host, data, 520, "natural"); });
      toast(list.length > 1 ? list.length + " images added." : "Image added.");
    });
  });

  function imageInsertHost(e) {
    if (!e) return null;
    var added = e.closest(".pe-block");
    if (added) return added;
    if (e.tagName === "IMG" || e.tagName === "FIGURE") return e.parentElement;
    if (e.matches && e.matches("h1,h2,h3,h4,p,li,figcaption,blockquote")) {
      return e.closest(".feature__copy,.feature__media,.feature,.kit-card,.step,.tcard,.section__head,.drift__copy,.drift,.cta__inner,.band__inner,section,footer") || e.parentElement;
    }
    return e;
  }

  function markInsertedImage(fig) {
    qsa(fig, "img").forEach(function (img) { img.setAttribute("data-pe-img", ""); });
    qsa(fig, MOVE_SEL).forEach(function (m) { m.setAttribute("data-pe-move", ""); });
  }

  /* ---------- insert card (v4): no blocking prompts ---------- */
  function openInsertCard(opts, onConfirm) {
    opts = opts || {};
    var overlay = el("div", "pe-insert-overlay");
    var card = el("div", "pe-insert-card");
    card.innerHTML =
      '<h3>' + (opts.title || "Add image") + '</h3>' +
      '<div class="pe-drop" tabindex="0">Drop image' + (opts.multiple ? "s" : "") + ' here or <button type="button" class="pe-btn pe-pickbtn">choose file' + (opts.multiple ? "s" : "") + '</button></div>' +
      '<div class="pe-insert-preview"></div>' +
      '<div class="pe-field"><label>Max width <span class="pe-w-val"></span></label>' +
      '<input type="range" class="pe-w" min="120" max="1400" step="10"></div>' +
      '<div class="pe-field"><label>Aspect ratio</label><select class="pe-ratio">' +
      '<option value="natural">Natural</option><option value="16:9">16:9</option><option value="4:3">4:3</option>' +
      '<option value="1:1">1:1</option><option value="9:16">9:16</option></select></div>' +
      (opts.framedToggle ? '<label class="pe-toggle-line"><input type="checkbox" class="pe-frame"' + (opts.framedDefault ? " checked" : "") + '> iPhone frame around each image</label>' : '') +
      '<div class="pe-insert-actions"><button type="button" class="pe-btn pe-cancel">Cancel</button>' +
      '<button type="button" class="pe-btn pe-confirm" disabled>Insert</button></div>';
    overlay.appendChild(card); document.body.appendChild(overlay);
    var picked = [];
    var w = card.querySelector(".pe-w"), wv = card.querySelector(".pe-w-val");
    w.value = opts.width || 520;
    function showW() { wv.textContent = w.value + "px"; }
    w.oninput = showW; showW();
    function renderPreview() {
      var pv = card.querySelector(".pe-insert-preview");
      pv.innerHTML = "";
      picked.forEach(function (p) { var im = el("img"); im.src = p.url; pv.appendChild(im); });
      card.querySelector(".pe-confirm").disabled = !picked.length;
    }
    function addFiles(files) {
      var imgs = Array.prototype.filter.call(files || [], function (f) { return /^image\//.test(f.type); });
      if (!imgs.length) return;
      Promise.all(imgs.map(storePicked)).then(function (list) {
        picked = opts.multiple ? picked.concat(list) : list.slice(-1);
        renderPreview();
      });
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
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    card.querySelector(".pe-confirm").onclick = function () {
      var frame = card.querySelector(".pe-frame");
      onConfirm({
        images: picked,
        width: Math.round(cleanNumber(w.value, opts.width || 520, 120, 1400)),
        ratio: card.querySelector(".pe-ratio").value,
        framed: !!(frame && frame.checked)
      });
      close();
    };
  }

  /* Insert one stored image {url,id} into a host block and persist it. */
  function insertPickedImage(host, data, width, ratio) {
    snapshot();
    var fig = createSizedImageFigure(data.url, { width: width, ratio: ratio });
    qsa(fig, "img").forEach(function (img) { img.setAttribute("data-pe-asset", data.id); });
    host.appendChild(fig);
    markInsertedImage(fig);
    fig.scrollIntoView({ behavior: "smooth", block: "center" });
    if (host.closest(".pe-block")) {
      captureAdded();
    } else {
      tagKey(host);
      var id = "pe-img-" + Date.now().toString(36);
      fig.setAttribute("data-pe-inserted", id);
      fig.setAttribute("data-pe-key", "inserted:" + id);
      qsa(fig, "img").forEach(function (img) { img.setAttribute("data-pe-key", "inserted:" + id + ":img"); });
      state.insertedImages.push({
        id: id,
        hostKey: host.getAttribute("data-pe-key"),
        html: serializeNode(fig)
      });
      save();
    }
    select(fig);
    return fig;
  }

  function insertImageIntoSelection() {
    if (!selected) {
      toast("Turn on Layout and select a block first.");
      return;
    }
    var host = imageInsertHost(selected);
    if (!host) {
      toast("Select a block first.");
      return;
    }
    openInsertCard({ title: "Add image to selected block", multiple: false }, function (res) {
      if (!res.images.length) return;
      insertPickedImage(host, res.images[0], res.width, res.ratio);
      toast("Image added. Use the toolbar to resize or move it.");
    });
  }

  function addCarouselToSelection(sources, opts) {
    opts = opts || {};
    if (!sources || !sources.length) return;
    var host = opts.host || (selected && imageInsertHost(selected));
    if (!host) {
      toast("Turn on Layout and select a block first.");
      return;
    }
    snapshot();
    var car = createImageCarousel(sources, { width: opts.width || 520, framed: !!opts.framed });
    host.appendChild(car);
    qsa(car, "img").forEach(function (img) { img.setAttribute("data-pe-img", ""); });
    qsa(car, MOVE_SEL).forEach(function (m) { m.setAttribute("data-pe-move", ""); });
    car.scrollIntoView({ behavior: "smooth", block: "center" });
    if (host.closest(".pe-block")) {
      captureAdded();
    } else {
      tagKey(host);
      var id = "pe-car-" + Date.now().toString(36);
      car.setAttribute("data-pe-carousel-inserted", id);
      car.setAttribute("data-pe-key", "carousel:" + id);
      state.insertedCarousels.push({
        id: id,
        hostKey: host.getAttribute("data-pe-key"),
        html: serializeNode(car)
      });
      save();
    }
    if (window.__peInitCarousels) window.__peInitCarousels(car.parentNode || document);
    select(car);
    toast(opts.message || "Scrolling images added.");
  }

  function addScrollingImagesToSelection() {
    if (!selected) {
      toast("Turn on Layout and select a block first.");
      return;
    }
    var host = imageInsertHost(selected);
    if (!host) {
      toast("Select a block first.");
      return;
    }
    var framedDefault = !!(selected.closest(".device") || (selected.querySelector && selected.querySelector(".device")));
    openInsertCard({ title: "Add scrolling images", multiple: true, framedToggle: true, framedDefault: framedDefault }, function (res) {
      addCarouselToSelection(res.images, { host: host, width: res.width, framed: res.framed, message: "Scrolling images added." });
    });
  }

  function addTargetCarouselToSelection() {
    if (!selected) {
      toast("Turn on Layout and select a block first.");
      return;
    }
    addCarouselToSelection(TARGET_IMAGE_PATHS, {
      width: 760,
      framed: false,
      message: "Target carousel added from asset paths."
    });
  }

  function addImageCarouselBlock(secList) {
    openInsertCard({ title: "Scrolling image carousel", multiple: true }, function (res) {
      var sources = res.images, width = res.width;
      if (!sources || !sources.length) return;
      snapshot();
      var anchor = document.getElementById("signup");
      var section = el("section", "section pe-block");
      section.id = "pe-added-" + Date.now().toString(36);
      var car = createImageCarousel(sources, { width: width, framed: false });
      section.appendChild(car);
      anchor.parentNode.insertBefore(section, anchor);
      qsa(section, "img").forEach(function (img) { img.setAttribute("data-pe-img", ""); });
      qsa(section, MOVE_SEL).forEach(function (m) { m.setAttribute("data-pe-move", ""); });
      if (window.__peInitCarousels) window.__peInitCarousels(section);
      captureAdded();
      if (secList) buildSecList(secList);
      section.scrollIntoView({ behavior: "smooth", block: "center" });
      select(car);
      toast("Scrolling image carousel added.");
    });
  }

  /* ---------- layout: drag, scale, align, hide ---------- */
  var selected = null, selTools = null, drag = null;

  function curL(e) {
    if (e.closest(".pe-block")) { return e.__peL || (e.__peL = parseInline(e)); }
    var k = e.getAttribute("data-pe-key") || keyFor(e);
    e.setAttribute("data-pe-key", k);
    state.layout[k] = state.layout[k] || {};
    return state.layout[k];
  }
  function parseInline(e) {
    var L = {}, tr = e.style.transform || "";
    var m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(tr);
    if (m) { L.dx = parseFloat(m[1]); L.dy = parseFloat(m[2]); }
    var s = /scale\(([-\d.]+)\)/.exec(tr); if (s) L.scale = parseFloat(s[1]);
    if (e.style.width) L.width = cleanNumber(e.style.width, e.offsetWidth || 240, 40, 2400);
    if (e.style.height) L.height = cleanNumber(e.style.height, e.offsetHeight || 160, 40, 2400);
    if (e.style.textAlign) L.align = e.style.textAlign;
    if (e.style.paddingTop) L.padTop = cleanNumber(e.style.paddingTop, 0, 0, 480);
    if (e.style.paddingBottom) L.padBottom = cleanNumber(e.style.paddingBottom, 0, 0, 480);
    var dividerLength = e.style.getPropertyValue("--divider-red-length");
    var dividerOffset = e.style.getPropertyValue("--divider-offset");
    if (dividerLength) L.dividerLength = cleanNumber(dividerLength, 132, 24, 720);
    if (dividerOffset) L.dividerOffset = cleanSignedNumber(dividerOffset, 0, -240, 240);
    return L;
  }
  function commitL(e, L) {
    applyTransform(e, L);
    if (e.closest(".pe-block")) { e.__peL = L; captureAdded(); }
    else save();
    positionTools();
  }

  document.addEventListener("pointerdown", function (e) {
    if (!layout) return;
    if (e.target.closest(".pe-seltools")) return;
    var m = e.target.closest && e.target.closest("[data-pe-move]");
    if (!m || m.closest(".pe-panel")) return;
    e.preventDefault();
    select(m);
    snapshot();
    var L = curL(m);
    drag = { e: m, L: L, sx: e.clientX, sy: e.clientY, dx0: L.dx || 0, dy0: L.dy || 0 };
    try { m.setPointerCapture && m.setPointerCapture(e.pointerId); } catch (_) {}
  });
  document.addEventListener("pointermove", function (e) {
    if (resizeDrag) {
      var dx = e.clientX - resizeDrag.sx;
      var dy = e.clientY - resizeDrag.sy;
      var dir = resizeDrag.dir;
      var minW = 48;
      var minH = 48;
      if (dir.indexOf("e") >= 0) resizeDrag.L.width = Math.max(minW, resizeDrag.w0 + dx);
      if (dir.indexOf("s") >= 0) resizeDrag.L.height = Math.max(minH, resizeDrag.h0 + dy);
      if (dir.indexOf("w") >= 0) {
        resizeDrag.L.width = Math.max(minW, resizeDrag.w0 - dx);
        resizeDrag.L.dx = resizeDrag.dx0 + Math.min(dx, resizeDrag.w0 - minW);
      }
      if (dir.indexOf("n") >= 0) {
        resizeDrag.L.height = Math.max(minH, resizeDrag.h0 - dy);
        resizeDrag.L.dy = resizeDrag.dy0 + Math.min(dy, resizeDrag.h0 - minH);
      }
      applyTransform(resizeDrag.e, resizeDrag.L);
      positionTools();
      return;
    }
    if (!drag) return;
    drag.L.dx = drag.dx0 + (e.clientX - drag.sx);
    drag.L.dy = drag.dy0 + (e.clientY - drag.sy);
    applyTransform(drag.e, drag.L);
    positionTools();
  });
  document.addEventListener("pointerup", function () {
    if (resizeDrag) {
      commitL(resizeDrag.e, resizeDrag.L);
      resizeDrag = null;
      return;
    }
    if (!drag) return;
    commitL(drag.e, drag.L);
    drag = null;
  });

  function select(e) {
    if (selected === e) { positionTools(); return; }
    deselect();
    selected = e; e.classList.add("pe-selected");
    if (!selTools) buildSelTools();
    selTools.classList.add("pe-show");
    positionTools();
  }
  function deselect() {
    if (selected) { selected.classList.remove("pe-selected"); selected = null; }
    if (selTools) selTools.classList.remove("pe-show");
    if (resizeHandles) resizeHandles.classList.remove("pe-show");
  }
  function positionTools() {
    if (!selected || !selTools) return;
    var r = selected.getBoundingClientRect();
    var top = r.top - 42; if (top < 8) top = Math.min(window.innerHeight - 46, r.bottom + 8);
    var left = Math.max(8, Math.min(window.innerWidth - selTools.offsetWidth - 8, r.left));
    selTools.style.left = left + "px"; selTools.style.top = top + "px";
    positionResizeHandles();
  }
  window.addEventListener("scroll", positionTools, { passive: true });
  window.addEventListener("resize", positionTools);

  var resizeHandles = null, resizeDrag = null;
  var sizeField = null;
  function buildResizeHandles() {
    resizeHandles = el("div", "pe-resize-handles");
    ["n", "e", "s", "w", "ne", "nw", "se", "sw"].forEach(function (dir) {
      var h = el("button", "pe-resize-handle pe-resize-handle--" + dir);
      h.type = "button";
      h.setAttribute("data-pe-resize-handle", dir);
      h.setAttribute("aria-label", "Resize " + dir);
      h.title = "Drag to resize";
      h.onpointerdown = function (e) {
        if (!selected) return;
        e.preventDefault();
        e.stopPropagation();
        snapshot();
        var r = selected.getBoundingClientRect();
        var L = curL(selected);
        resizeDrag = {
          e: selected,
          L: L,
          dir: dir,
          sx: e.clientX,
          sy: e.clientY,
          w0: L.width || r.width,
          h0: L.height || r.height,
          dx0: L.dx || 0,
          dy0: L.dy || 0
        };
        try { h.setPointerCapture && h.setPointerCapture(e.pointerId); } catch (_) {}
      };
      resizeHandles.appendChild(h);
    });
    document.body.appendChild(resizeHandles);
  }
  function positionResizeHandles() {
    if (!selected) {
      if (resizeHandles) resizeHandles.classList.remove("pe-show");
      return;
    }
    if (!resizeHandles) buildResizeHandles();
    var r = selected.getBoundingClientRect();
    resizeHandles.style.left = r.left + "px";
    resizeHandles.style.top = r.top + "px";
    resizeHandles.style.width = r.width + "px";
    resizeHandles.style.height = r.height + "px";
    resizeHandles.classList.add("pe-show");
    if (sizeField) sizeField.textContent = Math.round(r.width) + " x " + Math.round(r.height);
  }

  /* ---------- per-slide carousel editing (v4.1) ---------- */
  function selectedCarousel() {
    if (!selected) return null;
    return selected.closest(".carousel") ||
      (selected.querySelector ? selected.querySelector(".carousel") : null);
  }
  function cleanedCarouselInner(car) {
    var clone = car.cloneNode(true);
    qsa(clone, "[data-carousel-clone]").forEach(function (n) { n.remove(); });
    qsa(clone, ".carousel__dots").forEach(function (n) { n.textContent = ""; });
    qsa(clone, "[data-pe-edit],[data-pe-img],[data-pe-move],[data-pe-key],[data-pe-id],[contenteditable]").forEach(function (n) {
      n.removeAttribute("data-pe-edit"); n.removeAttribute("data-pe-img"); n.removeAttribute("data-pe-move");
      n.removeAttribute("data-pe-key"); n.removeAttribute("data-pe-id"); n.removeAttribute("contenteditable");
      n.classList.remove("pe-selected");
    });
    qsa(clone, 'img[src^="blob:"],video[src^="blob:"]').forEach(function (m) { m.setAttribute("src", ""); });
    return clone.innerHTML;
  }
  function persistCarousel(car) {
    var block = car.closest(".pe-block");
    if (block) { captureAdded(); return; }
    var insId = car.getAttribute("data-pe-carousel-inserted");
    if (insId) {
      var rec = (state.insertedCarousels || []).filter(function (r) { return r && r.id === insId; })[0];
      if (rec) { rec.html = serializeNode(car); save(); return; }
    }
    tagKey(car);
    var k = car.getAttribute("data-pe-key");
    state.content[k] = state.content[k] || {};
    state.content[k].html = cleanedCarouselInner(car);
    save();
  }
  function reinitCarousel(car) {
    qsa(car, "[data-carousel-clone]").forEach(function (n) { n.remove(); });
    car.removeAttribute("data-pe-carousel-ready");
    if (window.__peInitCarousels) window.__peInitCarousels(car.parentNode || document);
  }
  function addSlidesToCarousel() {
    var car = selectedCarousel();
    if (!car) { toast("Select a carousel (or something inside one) first."); return; }
    openInsertCard({ title: "Add slides to this carousel", multiple: true }, function (res) {
      if (!res.images.length) return;
      snapshot();
      var track = car.querySelector(".carousel__track");
      var template = track.querySelector(".carousel__slide:not([data-carousel-clone])");
      res.images.forEach(function (data) {
        var slide = null;
        if (template) {
          slide = template.cloneNode(true);
          slide.classList.remove("pe-selected");
          qsa(slide, "[data-pe-key],[data-pe-id]").forEach(function (n) { n.removeAttribute("data-pe-key"); n.removeAttribute("data-pe-id"); });
          var img = slide.querySelector("img");
          var vid = slide.querySelector("video");
          if (vid && !img) { // e.g. the targets loop slide — swap the video for an <img>
            var rep = el("img");
            vid.parentNode.replaceChild(rep, vid);
            var tv = slide.querySelector(".tcard--video");
            if (tv) tv.classList.remove("tcard--video");
            img = rep;
          }
          if (img) {
            img.src = data.url;
            img.setAttribute("data-pe-asset", data.id);
            img.removeAttribute("width"); img.removeAttribute("height");
            img.setAttribute("alt", "");
            var cap = slide.querySelector("figcaption");
            if (cap) cap.textContent = "New slide";
          } else {
            slide = null;
          }
        }
        if (!slide) {
          var wrap = el("div"); wrap.innerHTML = carouselSlideHTML(data, false);
          slide = wrap.firstChild;
        }
        qsa(slide, "img").forEach(function (im) { im.setAttribute("data-pe-img", ""); });
        var firstClone = track.querySelector('[data-carousel-clone="first"]');
        track.insertBefore(slide, firstClone || null);
      });
      reinitCarousel(car);
      persistCarousel(car);
      tagElements();
      toast(res.images.length + " slide(s) added — swap the image or caption in Edit mode.");
    });
  }
  function removeSlideFromCarousel() {
    var car = selectedCarousel();
    if (!car) { toast("Select a carousel first."); return; }
    var track = car.querySelector(".carousel__track");
    var slides = qsa(track, ".carousel__slide:not([data-carousel-clone])");
    if (slides.length <= 1) { toast("A carousel needs at least one slide."); return; }
    var slide = selected.closest(".carousel__slide:not([data-carousel-clone])");
    if (!slide) { // fall back to the slide currently in view
      var idx = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)) - 1;
      idx = ((idx % slides.length) + slides.length) % slides.length;
      slide = slides[idx];
    }
    if (!slide) { toast("Couldn't find a slide to remove."); return; }
    snapshot();
    slide.remove();
    deselect();
    reinitCarousel(car);
    persistCarousel(car);
    toast("Slide removed — Undo to bring it back.");
  }

  function buildSelTools() {
    selTools = el("div", "pe-seltools");
    function b(label, title, fn) { var x = el("button", null, label); x.type = "button"; x.title = title; x.onclick = fn; selTools.appendChild(x); return x; }
    function sep() { selTools.appendChild(el("span", "pe-sep")); }
    sizeField = el("span", "pe-size-field", "Size");
    selTools.appendChild(sizeField);
    sep();
    /* +/− resize the block's BOX; text and children keep their size and
       reflow. (Any legacy transform-scale is folded into the width first so
       the visual size doesn't jump, but the text un-zooms.) */
    function resizeBox(factor) {
      if (!selected) return; snapshot();
      var L = curL(selected);
      var visualW = selected.getBoundingClientRect().width;
      if (L.scale && L.scale !== 1) { L.scale = 1; }
      var w = L.width || visualW;
      L.width = Math.max(48, Math.min(2400, Math.round(w * factor)));
      commitL(selected, L);
    }
    b("−", "Smaller box (text size unchanged)", function () { resizeBox(0.92); });
    b("+", "Larger box (text size unchanged)", function () { resizeBox(1.08); });
    b("Img", "Add custom-sized image to this block", insertImageIntoSelection);
    b("Scroll", "Add multiple scrolling images to this block", addScrollingImagesToSelection);
    b("Targets", "Add bundled target images as a scrolling carousel", addTargetCarouselToSelection);
    b("+Slide", "Add image slides to this carousel", addSlidesToCarousel);
    b("−Slide", "Remove this slide from the carousel", removeSlideFromCarousel);
    b("Height", "Set motion spacer height", setMotionHeight);
    b("Space", "Set selected block spacing", setBlockSpacing);
    b("⇅", "Move selected divider up/down", setDividerOffset);
    b("Red", "Set divider red length", setDividerLength);
    sep();
    b("⌃", "Nudge up", function () { nudge(0, -8); });
    b("⌄", "Nudge down", function () { nudge(0, 8); });
    b("‹", "Nudge left", function () { nudge(-8, 0); });
    b("›", "Nudge right", function () { nudge(8, 0); });
    sep();
    b("L", "Align left", function () { setAlign("left"); });
    b("C", "Align center", function () { setAlign("center"); });
    b("R", "Align right", function () { setAlign("right"); });
    sep();
    b("⟲", "Reset this block", function () {
      if (!selected) return; snapshot();
      selected.style.transform = ""; selected.style.textAlign = "";
      selected.style.width = ""; selected.style.height = ""; selected.style.maxWidth = "";
      selected.style.paddingTop = ""; selected.style.paddingBottom = "";
      selected.style.removeProperty("--divider-red-length"); selected.style.removeProperty("--divider-offset");
      selected.classList.remove("pe-force-media-stretch");
      if (selected.closest(".pe-block")) { selected.__peL = {}; captureAdded(); }
      else { var k = selected.getAttribute("data-pe-key"); delete state.layout[k]; save(); }
      positionTools();
    });
    b("✕", "Hide / remove this block", function () {
      if (!selected) return; snapshot();
      var e = selected;
      e.style.display = "none";
      if (!e.closest(".pe-block")) {
        var k = e.getAttribute("data-pe-key");
        if (state.hiddenEls.indexOf(k) < 0) state.hiddenEls.push(k);
        save();
      } else captureAdded();
      deselect();
      toast("Hidden — Undo to bring it back.");
    });
    document.body.appendChild(selTools);
  }
  function selectedSectionTarget() {
    if (!selected) return null;
    return selected.closest(".pe-block") || selected.closest("#main > section");
  }
  function selectedDivider() {
    if (!selected) return null;
    var divider = selected.closest && selected.closest(".divider");
    if (divider) return divider;
    var section = selectedSectionTarget();
    return section ? section.querySelector(".divider") : null;
  }
  function persistStyleTarget(target, L) {
    L = L || curL(target);
    applyTransform(target, L);
    if (target.closest(".pe-block")) { target.__peL = L; captureAdded(); }
    else { save(); positionTools(); }
  }
  function setBlockSpacing() {
    var target = selectedSectionTarget();
    if (!target) {
      toast("Select a block first.");
      return;
    }
    var cs = getComputedStyle(target);
    var top = Math.round(cleanNumber(prompt("Top padding in pixels", cs.paddingTop || "0"), parseFloat(cs.paddingTop) || 0, 0, 480));
    var bottom = Math.round(cleanNumber(prompt("Bottom padding in pixels", cs.paddingBottom || "0"), parseFloat(cs.paddingBottom) || 0, 0, 480));
    snapshot();
    var L = curL(target);
    L.padTop = top;
    L.padBottom = bottom;
    persistStyleTarget(target, L);
    positionTools();
    toast("Block spacing updated.");
  }
  function setMotionHeight() {
    if (!selected) return;
    var stage = selected.closest && selected.closest(".pe-motion-stage");
    if (!stage && selected.querySelector) stage = selected.querySelector(".pe-motion-stage");
    if (!stage) {
      toast("Select a motion spacer first.");
      return;
    }
    var current = getComputedStyle(stage).getPropertyValue("--pe-motion-height") || stage.style.height || "360px";
    var height = Math.round(cleanNumber(prompt("Motion spacer height in pixels", current), 360, 120, 720));
    snapshot();
    stage.style.setProperty("--pe-motion-height", height + "px");
    var block = stage.closest(".pe-block");
    if (block) captureAdded(); else save();
    toast("Motion spacer height updated.");
  }
  function setDividerOffset() {
    var divider = selectedDivider();
    if (!divider) {
      toast("Select a divider first.");
      return;
    }
    var current = divider.style.getPropertyValue("--divider-offset") || getComputedStyle(divider).getPropertyValue("--divider-offset") || "0px";
    var offset = Math.round(cleanSignedNumber(prompt("Divider vertical offset in pixels", current), 0, -240, 240));
    snapshot();
    var L = curL(divider);
    L.dividerOffset = offset;
    persistStyleTarget(divider, L);
    positionTools();
    toast("Divider position updated.");
  }
  function setDividerLength() {
    var divider = selectedDivider();
    if (!divider) {
      toast("Select a divider first.");
      return;
    }
    var current = divider.style.getPropertyValue("--divider-red-length") || getComputedStyle(divider).getPropertyValue("--divider-red-length") || "132px";
    var length = Math.round(cleanNumber(prompt("Red divider length in pixels", current), 132, 24, 720));
    snapshot();
    var L = curL(divider);
    L.dividerLength = length;
    persistStyleTarget(divider, L);
    positionTools();
    toast("Divider red length updated.");
  }
  function nudge(dx, dy) { if (!selected) return; snapshot(); var L = curL(selected); L.dx = (L.dx || 0) + dx; L.dy = (L.dy || 0) + dy; commitL(selected, L); }
  function setAlign(a) { if (!selected) return; snapshot(); var L = curL(selected); L.align = a; commitL(selected, L); }

  // click empty space deselects (layout mode)
  document.addEventListener("click", function (e) {
    if (!layout) return;
    if (e.target.closest("[data-pe-move]") || e.target.closest(".pe-seltools") || e.target.closest(".pe-panel") || e.target.closest(".pe-dock") || e.target.closest(".pe-insert-overlay")) return;
    deselect();
  });

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", function (e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    if (layout && selected && (e.key === "Backspace" || e.key === "Delete") && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault(); snapshot(); selected.style.display = "none";
      if (!selected.closest(".pe-block")) { var k = selected.getAttribute("data-pe-key"); if (state.hiddenEls.indexOf(k) < 0) state.hiddenEls.push(k); save(); } else captureAdded();
      deselect();
    }
    if (layout && selected && e.key.indexOf("Arrow") === 0) {
      e.preventDefault();
      var d = { ArrowUp: [0, -4], ArrowDown: [0, 4], ArrowLeft: [-4, 0], ArrowRight: [4, 0] }[e.key];
      nudge(d[0], d[1]);
    }
  });

  /* ---------- save / export ---------- */
  function currentSectionOrder() {
    return qsa(document.getElementById("main"), ":scope > section").map(function (s) { return s.id; });
  }
  function currentFeatureOrder() {
    var parent = document.getElementById("features");
    if (!parent) return null;
    return qsa(parent, ":scope > .feature").map(function (row) { return row.id; });
  }
  function savedStateForHTML() {
    var saved = normalize(JSON.parse(JSON.stringify(state)));
    saved.content = {};
    saved.layout = {};
    saved.added = [];
    saved.insertedImages = [];
    saved.insertedCarousels = [];
    saved.hiddenEls = [];
    saved.order = currentSectionOrder();
    saved.featureOrder = currentFeatureOrder();
    saved.hidden = qsa(document.getElementById("main"), ":scope > section")
      .filter(function (s) { return s.style.display === "none"; })
      .map(function (s) { return s.id; });
    saved._savedAt = Date.now();
    saved._modifiedAt = saved._savedAt;
    return saved;
  }
  function scrubEditorAttrs(clone) {
    // blob: URLs are session-scoped; data-pe-asset re-resolves them on load
    qsa(clone, 'img[src^="blob:"],video[src^="blob:"]').forEach(function (m) { m.setAttribute("src", ""); });
    qsa(clone, "[data-carousel-clone]").forEach(function (e) { e.remove(); });
    qsa(clone, ".pe-panel,.pe-toast,.pe-imgbadge,.pe-seltools,.pe-resize-handles").forEach(function (e) { e.remove(); });
    qsa(clone, "[data-pe-edit],[data-pe-img],[data-pe-move],[data-pe-key],[data-pe-bg],[data-pe-inserted],[data-pe-carousel-inserted],[data-pe-carousel-ready],[contenteditable]").forEach(function (e) {
      e.removeAttribute("data-pe-edit"); e.removeAttribute("data-pe-img"); e.removeAttribute("data-pe-move");
      e.removeAttribute("data-pe-key"); e.removeAttribute("data-pe-bg"); e.removeAttribute("data-pe-inserted"); e.removeAttribute("data-pe-carousel-inserted"); e.removeAttribute("data-pe-carousel-ready"); e.removeAttribute("contenteditable");
      e.classList.remove("pe-selected");
    });
    var b = clone.querySelector("body");
    if (b) b.classList.remove("pe-editing", "pe-open", "pe-layout");
  }
  function removeBlankMediaArtifacts(root) {
    qsa(root, "figure.pe-inserted-image").forEach(function (fig) {
      var media = qsa(fig, "img,video");
      var hasVisibleSource = media.some(function (m) { return !!m.getAttribute("src"); });
      if (!hasVisibleSource) fig.remove();
    });
    qsa(root, ".carousel__slide").forEach(function (slide) {
      var media = qsa(slide, "img,video");
      if (!media.length) return;
      var hasVisibleSource = media.some(function (m) { return !!m.getAttribute("src"); });
      var hasText = (slide.textContent || "").trim();
      if (!hasVisibleSource && !hasText) slide.remove();
    });
  }
  function upsertSavedState(clone, saved) {
    var old = clone.querySelector("#pe-saved-state");
    if (old) old.remove();
    var script = clone.ownerDocument.createElement("script");
    script.id = "pe-saved-state";
    script.type = "application/json";
    script.textContent = JSON.stringify(saved).replace(/<\/script/gi, "<\\/script");
    clone.querySelector("head").appendChild(script);
  }
  function serializeHTML(keepEditor) {
    var clone = document.documentElement.cloneNode(true);
    scrubEditorAttrs(clone);
    if (keepEditor) {
      var saved = savedStateForHTML();
      state = saved;
      localStorage.setItem(KEY, JSON.stringify(state));
      upsertSavedState(clone, saved);
    } else {
      qsa(clone, ".pe-dock,.pe-launch").forEach(function (e) { e.remove(); });
      qsa(clone, 'link[href^="editor.css"],script[src^="editor.js"],#pe-saved-state').forEach(function (e) { e.remove(); });
    }
    return "<!DOCTYPE html>\n" + clone.outerHTML;
  }
  function downloadHTML(html, name) {
    var blob = new Blob([html], { type: "text/html" });
    var url = URL.createObjectURL(blob);
    var a = el("a"); a.href = url; a.download = name || "index.html";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  async function writeHTML(html, clean) {
    if (window.showSaveFilePicker) {
      try {
        var handle = await window.showSaveFilePicker({
          suggestedName: "index.html",
          types: [{ description: "HTML", accept: { "text/html": [".html"] } }]
        });
        var writable = await handle.createWritable();
        await writable.write(html);
        await writable.close();
        toast(clean ? "Clean index.html saved." : "Changes saved to index.html.");
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    downloadHTML(html, "index.html");
    toast(clean ? "Downloaded clean index.html." : "Downloaded index.html with your changes.");
  }
  function saveWorkingHTML() {
    writeHTML(serializeHTML(true), false);
  }
  /* Clean export: uploaded images become real files under assets/edited/ and
     the exported HTML references those paths (no base64, no blob URLs). */
  async function exportSiteWithAssets() {
    var clone = document.documentElement.cloneNode(true);
    var files = [], seen = {};
    function fileFor(id, blob) {
      var ext = ((blob.type || "").split("/")[1] || "jpg").replace("jpeg", "jpg").replace("quicktime", "mov");
      var relPath = "assets/edited/" + id + "." + ext;
      if (!seen[id]) { seen[id] = true; files.push({ name: id + "." + ext, blob: blob }); }
      return relPath;
    }
    // Uploaded backgrounds: state carries pe-asset refs keyed by data-pe-key,
    // which still exists on the clone at this point (scrub removes it below).
    var bgKeys = Object.keys(state.content || {}).filter(function (k) {
      return state.content[k] && isAssetRef(state.content[k].bg);
    });
    for (var b = 0; b < bgKeys.length; b++) {
      var target = clone.querySelector('[data-pe-key="' + bgKeys[b] + '"]');
      if (!target) continue;
      var bgId = refId(state.content[bgKeys[b]].bg);
      var bgBlob = await assetGet(bgId);
      if (!bgBlob) continue;
      var bgPath = fileFor(bgId, bgBlob);
      var vid = target.querySelector(":scope > .pe-bg-video");
      if (vid) vid.setAttribute("src", bgPath);
      else if (target.getAttribute("style")) {
        target.setAttribute("style", target.getAttribute("style")
          .replace(/url\(["']?blob:[^)"']+["']?\)/, 'url("' + bgPath + '")'));
      }
    }
    scrubEditorAttrs(clone);
    qsa(clone, "[data-pe-id]").forEach(function (e) { e.removeAttribute("data-pe-id"); });
    qsa(clone, ".pe-dock,.pe-launch").forEach(function (e) { e.remove(); });
    qsa(clone, 'link[href^="editor.css"],script[src^="editor.js"],#pe-saved-state').forEach(function (e) { e.remove(); });
    var used = qsa(clone, "img[data-pe-asset],video[data-pe-asset]");
    for (var i = 0; i < used.length; i++) {
      var elm = used[i];
      var id = elm.getAttribute("data-pe-asset");
      elm.removeAttribute("data-pe-asset");
      var blob = await assetGet(id);
      if (!blob) { elm.removeAttribute("src"); continue; }
      elm.setAttribute("src", fileFor(id, blob));
    }
    removeBlankMediaArtifacts(clone);
    var html = "<!DOCTYPE html>\n" + clone.outerHTML;
    if (window.showDirectoryPicker) {
      try {
        var dir = await window.showDirectoryPicker({ mode: "readwrite" });
        if (files.length) {
          var assets = await dir.getDirectoryHandle("assets", { create: true });
          var edited = await assets.getDirectoryHandle("edited", { create: true });
          for (var j = 0; j < files.length; j++) {
            var fh = await edited.getFileHandle(files[j].name, { create: true });
            var w = await fh.createWritable(); await w.write(files[j].blob); await w.close();
          }
        }
        var ih = await dir.getFileHandle("index.html", { create: true });
        var iw = await ih.createWritable(); await iw.write(html); await iw.close();
        toast("Exported index.html" + (files.length ? " + " + files.length + " file(s) to assets/edited/" : "") + ".");
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    // Fallback: individual downloads.
    files.forEach(function (f) {
      var url = URL.createObjectURL(f.blob);
      var a = el("a"); a.href = url; a.download = f.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
    downloadHTML(html, "index.html");
    toast(files.length
      ? "Downloaded index.html + " + files.length + " image(s) — put them in assets/edited/."
      : "Downloaded clean index.html.");
  }
  function exportHTML() {
    exportSiteWithAssets();
  }

  /* ---------- panel UI ---------- */
  function group(title) { var g = el("div", "pe-group"); g.appendChild(el("h3", null, title)); return g; }
  function field(labelText, control) { var f = el("div", "pe-field"); if (labelText) f.appendChild(el("label", null, labelText)); f.appendChild(control); return f; }
  function optList(sel, list, current) { Object.keys(list).forEach(function (n) { var o = el("option"); o.value = n; o.textContent = n; if (n === current) o.selected = true; sel.appendChild(o); }); }
  function toggle(labelText, on, fn) {
    var t = el("div", "pe-toggle"); t.appendChild(el("span", null, labelText));
    var sw = el("button", "pe-switch"); sw.type = "button"; sw.setAttribute("aria-pressed", on ? "true" : "false");
    sw.onclick = function () { var v = sw.getAttribute("aria-pressed") !== "true"; sw.setAttribute("aria-pressed", v ? "true" : "false"); fn(v); };
    t.appendChild(sw); t._sw = sw; return t;
  }
  function range(min, max, step, val, oninput) {
    var row = el("div", "pe-row");
    var r = el("input"); r.type = "range"; r.min = min; r.max = max; r.step = step; r.value = val;
    var v = el("span", "pe-val", "");
    function show() { v.textContent = Math.round(parseFloat(r.value) * 100) + "%"; }
    r.oninput = function () { show(); oninput(parseFloat(r.value)); };
    show(); row.appendChild(r); row.appendChild(v); return row;
  }

  function labelText(text, limit) {
    text = (text || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    limit = limit || 34;
    return text.length > limit ? text.slice(0, limit - 1) + "..." : text;
  }
  function directText(root, sel) {
    var node = root && root.querySelector(sel);
    return node ? labelText(node.textContent, 42) : "";
  }
  function sectionLabel(sec) {
    if (sec.classList && sec.classList.contains("feature")) {
      var featureNames = {
        live: "Live Scoring",
        drills: "Drill Library",
        targets: "Targets",
        history: "History"
      };
      var featureTitle = directText(sec, ".feature__title") || directText(sec, "h1,h2,h3");
      return (featureNames[sec.id] || directText(sec, ".feature__kicker") || "Feature") + (featureTitle ? ": " + featureTitle : "");
    }
    if (sec.classList && sec.classList.contains("pe-block")) {
      var addedTitle = directText(sec, "h1,h2,h3,figcaption");
      if (addedTitle) return "Added: " + addedTitle;
      if (sec.querySelector("img")) return "Added image block";
      if (sec.querySelector("blockquote")) return "Added quote block";
      return "Added section";
    }
    var names = {
      hero: "Hero",
      measure: "Measurement strip",
      features: "Features intro",
      drift: "Drift Diagnosis",
      how: "How It Works",
      kit: "Gear Kit",
      watch: "Walkthrough Video",
      signup: "Coming Soon"
    };
    var h = directText(sec, "h1,h2,h3");
    return (names[sec.id] || (sec.id || "Section").replace(/-/g, " ")) + (h ? ": " + h : "");
  }
  function backgroundTargets() {
    var main = document.getElementById("main");
    var out = [];
    if (main) out = qsa(main, ":scope > section");
    var footer = document.querySelector(".footer");
    if (footer) out.push(footer);
    return out;
  }
  function blockLabel(block) {
    var kicker = block.querySelector && block.querySelector(".feature__kicker");
    var h = block.querySelector && block.querySelector("h1,h2,h3");
    if (kicker && kicker.textContent.trim()) return kicker.textContent.trim().slice(0, 28);
    if (h && h.textContent.trim()) return h.textContent.trim().slice(0, 28);
    if (block.classList.contains("section__head")) return "Section heading";
    if (block.classList.contains("feature__media")) return "Media block";
    if (block.classList.contains("feature__copy")) return "Text block";
    if (block.classList.contains("carousel")) return "Scrolling images";
    if (block.classList.contains("device")) return "Phone image";
    if (block.tagName === "FIGURE") return "Image";
    if (block.tagName === "IMG") return "Image file";
    return (block.id || block.className || block.tagName || "Block").toString().replace(/[_-]/g, " ").slice(0, 28);
  }
  function sectionBlocks(sec) {
    var blocks = qsa(sec, ".feature,.section__head,.feature__media,.feature__copy,.hero__copy,.carousel,.device,figure,img,.kit-card,.step,.video-stage,.drift,.cta__inner,.band__inner");
    return blocks.filter(function (block, i) {
      if (block.closest(".pe-panel") || block.closest(".pe-seltools")) return false;
      return blocks.indexOf(block) === i;
    }).slice(0, 18);
  }
  function buildInteractionTargets() {
    var targets = [];
    var seen = {};
    /* Add a node once. editableSections() lists the #features section AND each
       .feature row inside it separately, so the same blocks get enumerated
       twice — dedupe by key so no block appears more than once in the list. */
    function add(node, label) {
      tagKey(node);
      var key = node.getAttribute("data-pe-key");
      if (!key || seen[key]) return;
      seen[key] = true;
      targets.push({ key: key, label: label, node: node });
    }
    editableSections().forEach(function (sec) {
      /* Interactions apply per block, not per container: a container effect
         animates everything inside it as one unit and overrides the blocks
         within. So we skip .feature rows (each is enumerated as its own
         entry, and we only want its leaf blocks) and list individual blocks. */
      var blocks = sectionBlocks(sec).filter(function (b) {
        return !(b.classList && b.classList.contains("feature"));
      });
      if (blocks.length) {
        blocks.forEach(function (block) { add(block, "Block: " + blockLabel(block)); });
      } else if (!(sec.classList && sec.classList.contains("feature"))) {
        /* Fallback: a non-feature section with no enumerable blocks stays
           targetable as a whole so nothing becomes impossible to animate. */
        add(sec, "Section: " + sectionLabel(sec));
      }
    });
    return targets;
  }
  function focusEditableBlock(block) {
    if (!block) return;
    block.scrollIntoView({ behavior: "smooth", block: "center" });
    if (block.matches && block.matches(MOVE_SEL)) {
      setLayout(true);
      select(block);
    }
  }
  function blockKey(block) {
    if (!block) return "";
    tagKey(block);
    return block.getAttribute("data-pe-key") || "";
  }
  function blockHidden(block) {
    return !block || block.style.display === "none";
  }
  function editableSections() {
    var main = document.getElementById("main");
    var entries = [];
    qsa(main, ":scope > section").forEach(function (sec) {
      if (!sec.id) sec.id = "pe-sec-" + Math.random().toString(36).slice(2, 7);
      entries.push(sec);
      if (sec.id === "features") {
        qsa(sec, ":scope > .feature").forEach(function (feature) {
          if (!feature.id) feature.id = "feature-" + Math.random().toString(36).slice(2, 7);
          entries.push(feature);
        });
      }
    });
    return entries;
  }
  function sectionHidden(sec) {
    return !sec || sec.style.display === "none";
  }
  function setSectionHidden(sec, hide) {
    if (!sec) return;
    sec.style.display = hide ? "none" : "";
    if (sec.parentNode && sec.parentNode.id === "features" && sec.classList.contains("feature")) {
      var k = blockKey(sec);
      state.hiddenEls = state.hiddenEls || [];
      var idx = state.hiddenEls.indexOf(k);
      if (hide && idx < 0) state.hiddenEls.push(k);
      if (!hide && idx >= 0) state.hiddenEls.splice(idx, 1);
    } else {
      state.hidden = qsa(document.getElementById("main"), ":scope > section")
        .filter(function (s) { return s.style.display === "none"; })
        .map(function (s) { return s.id; });
    }
  }
  function toggleBlockHidden(block, wrap) {
    if (!block) return;
    snapshot();
    var hide = !blockHidden(block);
    block.style.display = hide ? "none" : "";
    if (!block.closest(".pe-block")) {
      var k = blockKey(block);
      state.hiddenEls = state.hiddenEls || [];
      var idx = state.hiddenEls.indexOf(k);
      if (hide && idx < 0) state.hiddenEls.push(k);
      if (!hide && idx >= 0) state.hiddenEls.splice(idx, 1);
      save();
    } else {
      captureAdded();
    }
    buildSecList(wrap);
  }
  function deleteBlockFromList(block, wrap) {
    if (!block) return;
    snapshot();
    if (selected === block) deselect();
    if (block.closest(".pe-block")) {
      block.remove();
      captureAdded();
    } else {
      block.style.display = "none";
      var k = blockKey(block);
      state.hiddenEls = state.hiddenEls || [];
      if (state.hiddenEls.indexOf(k) < 0) state.hiddenEls.push(k);
      save();
    }
    buildSecList(wrap);
  }
  function persistOrder() { state.order = currentSectionOrder(); save(); }
  function persistFeatureOrder() { state.featureOrder = currentFeatureOrder(); save(); }
  function moveSectionInList(sec, dir) {
    if (!sec) return false;
    if (sec.parentNode && sec.parentNode.id === "features" && sec.classList.contains("feature")) {
      var sibling = dir < 0 ? sec.previousElementSibling : sec.nextElementSibling;
      while (sibling && !sibling.classList.contains("feature")) sibling = dir < 0 ? sibling.previousElementSibling : sibling.nextElementSibling;
      if (!sibling) return false;
      snapshot();
      if (dir < 0) sec.parentNode.insertBefore(sec, sibling);
      else sec.parentNode.insertBefore(sibling, sec);
      persistFeatureOrder();
      return true;
    }
    var main = document.getElementById("main");
    var peer = dir < 0 ? sec.previousElementSibling : sec.nextElementSibling;
    if (!peer || peer.tagName !== "SECTION") return false;
    snapshot();
    if (dir < 0) main.insertBefore(sec, peer);
    else main.insertBefore(peer, sec);
    persistOrder();
    return true;
  }
  function removeSectionFromList(sec, wrap) {
    if (!sec) return;
    snapshot();
    if (selected === sec) deselect();
    if (sec.classList.contains("pe-block")) {
      sec.remove();
      captureAdded();
      toast("Added section deleted.");
    } else {
      setSectionHidden(sec, true);
      save();
      toast("Section hidden — Undo can restore it.");
    }
    buildSecList(wrap);
  }

  function buildSecList(wrap) {
    wrap.innerHTML = "";
    editableSections().forEach(function (sec) {
      var id = sec.id;
      var hidden = sectionHidden(sec);
      var row = el("div", "pe-secrow" + (hidden ? " pe-hidden" : ""));
      var label = el("span", "pe-sectionname", sectionLabel(sec));
      var fxBtn = el("button", "pe-icbtn", "✦"); fxBtn.title = "Effects for this section";
      var blocksBtn = el("button", "pe-icbtn pe-blocktoggle", "▾"); blocksBtn.title = "Show blocks in this section";
      var up = el("button", "pe-icbtn", "↑"); up.title = "Move up";
      var dn = el("button", "pe-icbtn", "↓"); dn.title = "Move down";
      var vis = el("button", "pe-icbtn", hidden ? "✕" : "●"); vis.title = "Show / hide";
      var delSec = el("button", "pe-icbtn pe-icbtn--danger", sec.classList.contains("pe-block") ? "⌫" : "−"); delSec.title = sec.classList.contains("pe-block") ? "Delete added section" : "Remove from page";

      row.onclick = function (e) {
        if (e.target.closest("button,select,.pe-blockrow")) return;
        sec.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      up.onclick = function (e) { e.stopPropagation(); if (moveSectionInList(sec, -1)) buildSecList(wrap); };
      dn.onclick = function (e) { e.stopPropagation(); if (moveSectionInList(sec, 1)) buildSecList(wrap); };
      vis.onclick = function () {
        snapshot();
        setSectionHidden(sec, !sectionHidden(sec));
        save(); buildSecList(wrap);
      };
      delSec.onclick = function (e) { e.stopPropagation(); removeSectionFromList(sec, wrap); };

      // per-section effects + block list expander
      var fx = el("div", "pe-secfx");
      var animSel = el("select");
      ANIMS.forEach(function (a) { var o = el("option"); o.value = a[0]; o.textContent = a[1]; if ((state.sectionFx[id] && state.sectionFx[id].anim || "none") === a[0]) o.selected = true; animSel.appendChild(o); });
      animSel.onchange = function () {
        snapshot();
        state.sectionFx[id] = state.sectionFx[id] || {}; state.sectionFx[id].anim = animSel.value;
        sec.classList.remove("pe-in");
        applySectionFx(); save();
      };
      var glow = el("button", "pe-icbtn" + (state.sectionFx[id] && state.sectionFx[id].glow ? " is-on" : ""), "◎");
      glow.title = "Accent glow";
      glow.onclick = function () {
        snapshot();
        state.sectionFx[id] = state.sectionFx[id] || {};
        state.sectionFx[id].glow = !state.sectionFx[id].glow;
        glow.classList.toggle("is-on", state.sectionFx[id].glow);
        applySectionFx(); save();
      };
      fx.appendChild(el("span", "pe-mini", "Entrance"));
      fx.appendChild(animSel); fx.appendChild(glow);
      var blockList = el("div", "pe-blocklist");
      sectionBlocks(sec).forEach(function (block) {
        var br = el("div", "pe-blockrow" + (blockHidden(block) ? " is-hidden" : ""));
        var name = el("button", "pe-blockname", blockLabel(block));
        name.type = "button";
        name.onclick = function (e) { e.stopPropagation(); focusEditableBlock(block); };
        var status = el("span", "pe-blockstatus", blockHidden(block) ? "Hidden" : "Visible");
        var toggle = el("button", "pe-blockaction", blockHidden(block) ? "Show" : "Hide");
        toggle.type = "button";
        toggle.onclick = function (e) { e.stopPropagation(); toggleBlockHidden(block, wrap); };
        var del = el("button", "pe-blockaction pe-blockaction--danger", block.closest(".pe-block") ? "Delete" : "Remove");
        del.type = "button";
        del.onclick = function (e) { e.stopPropagation(); deleteBlockFromList(block, wrap); };
        br.appendChild(name);
        br.appendChild(status);
        br.appendChild(toggle);
        br.appendChild(del);
        blockList.appendChild(br);
      });
      if (blockList.children.length) {
        fx.appendChild(el("span", "pe-mini pe-mini--wide", "Blocks"));
        fx.appendChild(blockList);
      }

      fxBtn.onclick = function (e) { e.stopPropagation(); row.classList.toggle("pe-expanded"); };
      blocksBtn.onclick = function (e) { e.stopPropagation(); row.classList.toggle("pe-expanded"); };

      row.appendChild(label); row.appendChild(blocksBtn); row.appendChild(fxBtn); row.appendChild(up); row.appendChild(dn); row.appendChild(vis); row.appendChild(delSec);
      row.appendChild(fx);
      wrap.appendChild(row);
    });
  }

  function buildPanel() {
    var panel = el("div", "pe-panel");
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Customize page");

    var head = el("div", "pe-head");
    head.appendChild(el("span", "pe-dot"));
    head.appendChild(el("h2", null, "Customize"));
    undoBtn = el("button", "pe-close", "↶"); undoBtn.title = "Undo (⌘Z)"; undoBtn.style.marginLeft = "auto"; undoBtn.onclick = undo;
    redoBtn = el("button", "pe-close", "↷"); redoBtn.title = "Redo (⇧⌘Z)"; redoBtn.onclick = redo;
    var close = el("button", "pe-close", "✕"); close.setAttribute("aria-label", "Close");
    close.onclick = function () { document.body.classList.remove("pe-open"); };
    head.appendChild(undoBtn); head.appendChild(redoBtn); head.appendChild(close);
    panel.appendChild(head);

    var tabs = el("div", "pe-tabs");
    var body = el("div", "pe-body");
    var pages = {};
    function setPanelTab(id) {
      qsa(tabs, ".pe-tab").forEach(function (tab) {
        tab.classList.toggle("is-active", tab.getAttribute("data-pe-tab") === id);
      });
      Object.keys(pages).forEach(function (key) {
        pages[key].classList.toggle("is-active", key === id);
      });
    }
    function panelPage(id, label) {
      var tab = el("button", "pe-tab", label);
      tab.type = "button";
      tab.setAttribute("data-pe-tab", id);
      tab.onclick = function () { setPanelTab(id); };
      tabs.appendChild(tab);
      pages[id] = el("div", "pe-page");
      body.appendChild(pages[id]);
    }
    panelPage("structure", "Structure");
    panelPage("design", "Design");
    panelPage("interactions", "Interactions");
    panelPage("publish", "Publish");
    panel.appendChild(tabs);

    /* ---- edit modes (top, for quick access) ---- */
    var gM = group("Edit modes");
    var et = toggle("Edit text & images", false, function (v) { setEditing(v); });
    editSwitch = et._sw; gM.appendChild(et);
    gM.appendChild(el("p", "pe-hint", "Turn on, then click any heading or paragraph to retype it, or any image to swap it. (Same as the ✎ Edit button.)"));
    var lt = toggle("Move & resize blocks", false, function (v) { setLayout(v); });
    layoutSwitch = lt._sw; gM.appendChild(lt);
    gM.appendChild(el("p", "pe-hint", "Turn on, then drag any block to move it. Use Space to trim top/bottom gaps; select a divider to move it or lengthen the red line. Arrow keys nudge; Delete hides."));
    var addSelectedImage = el("button", "pe-btn pe-btn--wide", "Add image to selected block");
    addSelectedImage.type = "button";
    addSelectedImage.onclick = insertImageIntoSelection;
    gM.appendChild(addSelectedImage);
    var addScrollImages = el("button", "pe-btn pe-btn--wide", "Add scrolling images to selected block");
    addScrollImages.type = "button";
    addScrollImages.onclick = addScrollingImagesToSelection;
    gM.appendChild(addScrollImages);
    var addTargetImages = el("button", "pe-btn pe-btn--wide", "Add target carousel to selected block");
    addTargetImages.type = "button";
    addTargetImages.onclick = addTargetCarouselToSelection;
    gM.appendChild(addTargetImages);
    gM.appendChild(el("p", "pe-hint", "Select a block in Layout mode, then add one image, uploaded scrolling images, or the bundled target carousel without embedding image data."));
    pages.structure.appendChild(gM);

    /* ---- typography ---- */
    var gT = group("Typography");
    var dispSel = el("select"); optList(dispSel, FONTS.display, state.displayFont);
    dispSel.onchange = function () { snapshot(); state.displayFont = dispSel.value; buildOverrides(); save(); };
    gT.appendChild(field("Display font (headings)", dispSel));
    gT.appendChild(el("p", "pe-hint", "The metallic “Peregrine” logo keeps its own font — this won't change it."));
    var bodySel = el("select"); optList(bodySel, FONTS.body, state.bodyFont);
    bodySel.onchange = function () { snapshot(); state.bodyFont = bodySel.value; buildOverrides(); save(); };
    gT.appendChild(field("Body font", bodySel));
    gT.appendChild(field("Text size", range(0.8, 1.35, 0.01, state.textScale, function (v) { state.textScale = v; buildOverrides(); saveDebounced(); })));
    pages.design.appendChild(gT);

    /* ---- colors (all app colors) ---- */
    var gC = group("Colors");
    var grid = el("div", "pe-colors");
    COLORS.forEach(function (c) {
      var wrap = el("div", "pe-color");
      var inp = el("input"); inp.type = "color"; inp.value = state.colors[c[1]];
      inp.oninput = function () { state.colors[c[1]] = inp.value; buildOverrides(); saveDebounced(); };
      inp.onchange = function () { snapshot(); };
      wrap.appendChild(inp); wrap.appendChild(el("span", null, c[2]));
      grid.appendChild(wrap);
    });
    gC.appendChild(grid);
    pages.design.appendChild(gC);

    /* ---- interactions ---- */
    var gIx = group("Element interactions");
    gIx.appendChild(el("p", "pe-hint", "Webflow-style flow: choose a target, pick a trigger, set the animation, tune timing, then preview or apply."));
    var ixTarget = el("select");
    function refreshInteractionTargets() {
      ixTarget.innerHTML = "";
      buildInteractionTargets().forEach(function (item) {
        var o = el("option");
        o.value = item.key;
        o.textContent = item.label;
        ixTarget.appendChild(o);
      });
    }
    refreshInteractionTargets();
    /* Custom target picker: hovering an item outlines the block it maps to
       on the page (and scrolls it into view), so you can see exactly what
       the interaction will affect. The hidden native select stays as the
       value store for the rest of the interactions code. */
    ixTarget.style.display = "none";
    function ixHighlight(elm) {
      qsa(document, ".pe-ix-highlight").forEach(function (n) { n.classList.remove("pe-ix-highlight"); });
      if (elm) {
        elm.classList.add("pe-ix-highlight");
        elm.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
    var ixPicker = el("div", "pe-ix-picker");
    var ixPickBtn = el("button", "pe-ix-pickbtn"); ixPickBtn.type = "button";
    var ixList = el("div", "pe-ix-droplist");
    function syncPickBtn() {
      var opt = ixTarget.options[ixTarget.selectedIndex];
      ixPickBtn.textContent = opt ? opt.textContent : "Choose a target…";
    }
    function rebuildIxList() {
      ixList.innerHTML = "";
      qsa(ixTarget, "option").forEach(function (o) {
        var it = el("button", "pe-ix-dropitem", o.textContent); it.type = "button";
        it.onmouseenter = function () { ixHighlight(byKey(o.value)); };
        it.onmouseleave = function () { ixHighlight(null); };
        it.onclick = function () {
          ixTarget.value = o.value;
          ixTarget.dispatchEvent(new Event("change"));
          syncPickBtn();
          ixList.classList.remove("pe-show");
          var chosen = byKey(o.value);
          ixHighlight(chosen);
          setTimeout(function () { ixHighlight(null); }, 1800);
        };
        ixList.appendChild(it);
      });
    }
    ixPickBtn.onclick = function () {
      refreshInteractionTargets();
      syncPickBtn();
      rebuildIxList();
      var show = !ixList.classList.contains("pe-show");
      ixList.classList.toggle("pe-show", show);
      if (!show) ixHighlight(null);
    };
    document.addEventListener("click", function (e) {
      if (!ixList.classList.contains("pe-show")) return;
      if (e.target === ixPickBtn || ixPicker.contains(e.target)) return;
      ixList.classList.remove("pe-show");
      ixHighlight(null);
    });
    syncPickBtn();
    ixPicker.appendChild(ixPickBtn); ixPicker.appendChild(ixList);
    gIx.appendChild(field("Target", ixPicker));
    gIx.appendChild(ixTarget); // hidden value store
    var ixGrid = el("div", "pe-mini-grid");
    var ixTrigger = el("select");
    INTERACTION_TRIGGERS.forEach(function (item) { var o = el("option"); o.value = item[0]; o.textContent = item[1]; ixTrigger.appendChild(o); });
    ixGrid.appendChild(field("Trigger", ixTrigger));
    var ixEffect = el("select");
    INTERACTION_EFFECTS.forEach(function (item) { var o = el("option"); o.value = item[0]; o.textContent = item[1]; ixEffect.appendChild(o); });
    ixGrid.appendChild(field("Animation", ixEffect));
    var ixEase = el("select");
    INTERACTION_EASES.forEach(function (item) { var o = el("option"); o.value = item[0]; o.textContent = item[1]; ixEase.appendChild(o); });
    ixGrid.appendChild(field("Ease", ixEase));
    var ixRepeat = el("select");
    INTERACTION_REPEAT.forEach(function (item) { var o = el("option"); o.value = item[0]; o.textContent = item[1]; ixRepeat.appendChild(o); });
    ixGrid.appendChild(field("Repeat", ixRepeat));
    gIx.appendChild(ixGrid);
    var ixDuration = el("input"); ixDuration.type = "range"; ixDuration.min = "100"; ixDuration.max = "3000"; ixDuration.step = "50"; ixDuration.value = "650";
    gIx.appendChild(field("Duration", ixDuration));
    var ixDelay = el("input"); ixDelay.type = "range"; ixDelay.min = "0"; ixDelay.max = "1500"; ixDelay.step = "50"; ixDelay.value = "0";
    gIx.appendChild(field("Delay", ixDelay));
    function selectedInteractionTarget() {
      return byKey(ixTarget.value);
    }
    function interactionRecord() {
      return {
        trigger: ixTrigger.value,
        effect: ixEffect.value,
        ease: ixEase.value,
        repeat: ixRepeat.value,
        duration: parseInt(ixDuration.value, 10) || 650,
        delay: parseInt(ixDelay.value, 10) || 0
      };
    }
    function syncInteractionFields() {
      var rec = state.interactions[ixTarget.value];
      if (!rec) return;
      ixTrigger.value = rec.trigger || "scroll";
      ixEffect.value = rec.effect || "fade";
      ixEase.value = rec.ease || "smooth";
      ixRepeat.value = rec.repeat || "once";
      ixDuration.value = rec.duration || 650;
      ixDelay.value = rec.delay || 0;
    }
    ixTarget.onchange = syncInteractionFields;
    var ixActions = el("div", "pe-btn-grid");
    var ixPreview = el("button", "pe-btn", "Preview");
    ixPreview.type = "button";
    ixPreview.onclick = function () { previewInteraction(selectedInteractionTarget(), interactionRecord()); };
    var ixApply = el("button", "pe-btn pe-btn--primary", "Apply");
    ixApply.type = "button";
    ixApply.onclick = function () {
      var target = selectedInteractionTarget();
      if (!target) return;
      snapshot();
      tagKey(target);
      var rec = interactionRecord();
      state.interactions[target.getAttribute("data-pe-key")] = rec;
      applyInteractionToTarget(target, rec);
      save();
      toast("Interaction applied.");
    };
    var ixRemove = el("button", "pe-btn", "Remove");
    ixRemove.type = "button";
    ixRemove.onclick = function () {
      var target = selectedInteractionTarget();
      if (!target) return;
      snapshot();
      removeInteraction(target);
      delete state.interactions[ixTarget.value];
      save();
      toast("Interaction removed.");
    };
    var ixRefresh = el("button", "pe-btn", "Refresh targets");
    ixRefresh.type = "button";
    ixRefresh.onclick = function () { refreshInteractionTargets(); syncInteractionFields(); toast("Interaction targets refreshed."); };
    ixActions.appendChild(ixPreview); ixActions.appendChild(ixApply); ixActions.appendChild(ixRemove); ixActions.appendChild(ixRefresh);
    gIx.appendChild(ixActions);
    gIx.appendChild(el("p", "pe-hint", "Triggers match the useful Webflow set for this static site: page load, scroll into view, hover, and click. Effects are dependency-free presets that export cleanly."));
    pages.interactions.appendChild(gIx);

    var gFx = group("Section entrance");
    gFx.appendChild(toggle("Cosmos particles", state.fx.cosmos, function (v) { snapshot(); state.fx.cosmos = v; buildOverrides(); save(); }));
    var cosWrap = el("div", "pe-sub"); cosWrap.appendChild(el("label", null, "Cosmos density"));
    cosWrap.appendChild(range(0.2, 2, 0.05, state.fxParams.cosmos, function (v) { state.fxParams.cosmos = v; buildOverrides(); saveDebounced(); }));
    gFx.appendChild(cosWrap);
    gFx.appendChild(toggle("Hero crosshair", state.fx.crosshair, function (v) { snapshot(); state.fx.crosshair = v; buildOverrides(); save(); }));
    gFx.appendChild(toggle("Film grain overlay", state.fx.grain, function (v) { snapshot(); state.fx.grain = v; buildOverrides(); save(); }));
    var grWrap = el("div", "pe-sub"); grWrap.appendChild(el("label", null, "Grain strength"));
    grWrap.appendChild(range(0.04, 0.4, 0.01, state.fxParams.grain, function (v) { state.fxParams.grain = v; buildOverrides(); saveDebounced(); }));
    gFx.appendChild(grWrap);
    gFx.appendChild(el("p", "pe-hint", "Give any individual section its own entrance animation + glow in the Sections list below (the ✦ button)."));
    pages.interactions.appendChild(gFx);

    /* ---- backgrounds ---- */
    var gB = group("Background media");
    gB.appendChild(el("p", "pe-hint", "Choose a section, then add the bundled motion background or upload an image/video."));
    var bgTargetSelect = el("select");
    function refreshBgTargetOptions() {
      bgTargetSelect.innerHTML = "";
      backgroundTargets().forEach(function (target, i) {
        tagKey(target);
        var o = el("option");
        o.value = target.getAttribute("data-pe-key");
        o.textContent = sectionLabel(target) || ("Section " + (i + 1));
        bgTargetSelect.appendChild(o);
      });
    }
    function selectedBackgroundTarget() {
      var target = byKey(bgTargetSelect.value);
      if (!target) {
        refreshBgTargetOptions();
        target = byKey(bgTargetSelect.value);
      }
      return target;
    }
    function saveBackgroundTarget(target, src) {
      var k = target.getAttribute("data-pe-key") || keyFor(target); target.setAttribute("data-pe-key", k);
      if (target.closest(".pe-block")) {
        captureAdded();
      } else {
        state.content[k] = state.content[k] || {};
        state.content[k].bg = src;
        save();
      }
    }
    refreshBgTargetOptions();
    gB.appendChild(field("Section", bgTargetSelect));
    var bgPreset = el("button", "pe-btn pe-btn--wide", "Use motion MP4 background"); bgPreset.type = "button";
    bgPreset.onclick = function () {
      var target = selectedBackgroundTarget(); if (!target) return;
      snapshot(); applyBackgroundMedia(target, BACKGROUND_VIDEO_PATHS[0]); saveBackgroundTarget(target, BACKGROUND_VIDEO_PATHS[0]);
      toast("Motion background added");
    };
    gB.appendChild(bgPreset);
    var bgUpload = el("button", "pe-btn pe-btn--wide", "Upload image/video background"); bgUpload.type = "button";
    bgUpload.onclick = function () {
      var target = selectedBackgroundTarget(); if (!target) return;
      pickMedia(function (data) {
        snapshot();
        applyBackgroundMedia(target, data.url, data.type.indexOf("video/") === 0);
        saveBackgroundTarget(target, data.ref);
        toast("Background added");
      });
    };
    gB.appendChild(bgUpload);
    var bgResetOne = el("button", "pe-btn pe-btn--wide", "Reset selected background"); bgResetOne.type = "button";
    bgResetOne.onclick = function () {
      var target = selectedBackgroundTarget(); if (!target) return;
      snapshot(); clearBackgroundMedia(target);
      var k = target.getAttribute("data-pe-key"); if (k && state.content[k]) delete state.content[k].bg;
      if (target.closest(".pe-block")) captureAdded(); else save();
      toast("Background reset");
    };
    gB.appendChild(bgResetOne);
    var bgReset = el("button", "pe-btn pe-btn--wide", "Reset all backgrounds"); bgReset.type = "button";
    bgReset.onclick = function () {
      snapshot();
      qsa(document, "[data-pe-bg], .has-pe-media-bg").forEach(function (t) {
        clearBackgroundMedia(t);
        var k = t.getAttribute("data-pe-key"); if (k && state.content[k]) delete state.content[k].bg;
      });
      save(); toast("Backgrounds reset");
    };
    gB.appendChild(bgReset);
    pages.design.appendChild(gB);

    /* ---- CTA ambient video (Coming-soon background) ---- */
    var gCta = group("Coming-soon background");
    gCta.appendChild(el("p", "pe-hint", "The ambient video behind “Be first on the line.” Pick a clip or upload one, then tune how it sits."));
    function ctaState() { state.ctaMedia = state.ctaMedia || {}; return state.ctaMedia; }
    var ctaVid = document.querySelector(".cta__video");
    var ctaSel = el("select");
    CTA_CLIPS.forEach(function (c) {
      var o = el("option"); o.value = c[1]; o.textContent = c[0];
      ctaSel.appendChild(o);
    });
    var curSrc = (state.ctaMedia && state.ctaMedia.src) || (ctaVid && ctaVid.getAttribute("src")) || "";
    if (!isAssetRef(curSrc)) ctaSel.value = curSrc;
    ctaSel.onchange = function () {
      snapshot();
      ctaState().src = ctaSel.value;
      applyCtaMedia(); save();
      toast("Coming-soon video swapped");
    };
    gCta.appendChild(field("Video clip", ctaSel));
    var ctaUp = el("button", "pe-btn pe-btn--wide", "Upload a video…"); ctaUp.type = "button";
    ctaUp.onclick = function () {
      var inp = el("input"); inp.type = "file"; inp.accept = "video/*";
      inp.onchange = function () {
        var f = inp.files[0]; if (!f) return;
        storePicked(f).then(function (data) {
          snapshot();
          ctaState().src = data.ref;
          applyCtaMedia(); save();
          toast("Coming-soon video uploaded");
        });
      };
      inp.click();
    };
    gCta.appendChild(ctaUp);
    var m0 = state.ctaMedia || {};
    gCta.appendChild(field("Visibility (opacity)", range(0.05, 0.7, 0.01, m0.opacity != null ? m0.opacity : 0.16, function (v) {
      ctaState().opacity = v; applyCtaMedia(); saveDebounced();
    })));
    gCta.appendChild(field("Brightness", range(0.3, 1.6, 0.05, m0.brightness != null ? m0.brightness : 0.8, function (v) {
      ctaState().brightness = v; applyCtaMedia(); saveDebounced();
    })));
    gCta.appendChild(field("Black point (darken)", range(0, 1, 0.05, m0.scrim != null ? m0.scrim : 0.6, function (v) {
      ctaState().scrim = v; applyCtaMedia(); saveDebounced();
    })));
    var ctaReset = el("button", "pe-btn pe-btn--wide", "Reset coming-soon background"); ctaReset.type = "button";
    ctaReset.onclick = function () {
      snapshot();
      state.ctaMedia = null;
      if (ctaVid) { ctaVid.style.opacity = ""; ctaVid.style.filter = ""; }
      var sc = document.querySelector(".cta__scrim"); if (sc) sc.style.background = "";
      save();
      toast("Reset — reload to restore the original clip.");
    };
    gCta.appendChild(ctaReset);
    pages.design.appendChild(gCta);

    /* ---- sections (reorder / hide / per-section fx) ---- */
    var gS = group("Sections");
    gS.appendChild(el("p", "pe-hint", "✦ effects · ↑↓ reorder · ● show/hide · − remove from page · ⌫ delete added sections."));
    var secList = el("div", "pe-seclist"); gS.appendChild(secList);
    pages.structure.appendChild(gS);

    /* ---- add block ---- */
    var gA = group("Add a block");
    var bgrid = el("div", "pe-btn-grid");
    [["motionSpacer", "Motion spacer"], ["heading", "Heading + text"], ["statement", "Big statement"], ["imagetext", "Image + text"], ["image", "Image"], ["customImage", "Custom image"], ["imageCarousel", "Scrolling image carousel"], ["quote", "Quote"], ["divider", "Divider"]].forEach(function (pair) {
      var b = el("button", "pe-btn", pair[1]); b.type = "button";
      b.onclick = function () {
        if (pair[0] === "imageCarousel") {
          addImageCarouselBlock(secList);
          return;
        }
        snapshot();
        var anchor = document.getElementById("signup");
        var html = pair[0] === "customImage" ? customImageBlock() : pair[0] === "motionSpacer" ? motionSpacerBlock() : BLOCKS[pair[0]];
        var wrap = el("div"); wrap.innerHTML = html.trim();
        var node = wrap.firstChild;
        node.id = "pe-added-" + Date.now().toString(36);
        anchor.parentNode.insertBefore(node, anchor);
        qsa(node, EDIT_SEL).forEach(function (e) { e.setAttribute("data-pe-edit", ""); if (editing) e.setAttribute("contenteditable", "true"); });
        qsa(node, "img").forEach(function (img) { img.setAttribute("data-pe-img", ""); });
        qsa(node, MOVE_SEL).forEach(function (m) { m.setAttribute("data-pe-move", ""); });
        captureAdded(); buildSecList(secList);
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        toast("Block added — turn on Edit to change it.");
      };
      bgrid.appendChild(b);
    });
    gA.appendChild(bgrid);
    pages.structure.appendChild(gA);

    panel.appendChild(body);

    /* ---- actions ---- */
    var actions = el("div", "pe-actions");
    var saveBtn = el("button", "pe-btn pe-btn--primary pe-btn--wide", "Save changes to index.html"); saveBtn.type = "button"; saveBtn.onclick = saveWorkingHTML;
    var exp = el("button", "pe-btn pe-btn--wide", "Export clean public index.html"); exp.type = "button"; exp.onclick = exportHTML;
    var reset = el("button", "pe-btn pe-btn--wide", "Reset all changes"); reset.type = "button";
    reset.onclick = function () { if (confirm("Discard ALL your customizations and reload the original page?")) { localStorage.removeItem(KEY); localStorage.removeItem(OLD); try { sessionStorage.clear(); } catch (e) {} location.reload(); } };
    pages.publish.appendChild(el("p", "pe-hint", "Save the current customized working file, or export a clean public page without the editor controls."));
    actions.appendChild(saveBtn); actions.appendChild(exp); actions.appendChild(reset);
    pages.publish.appendChild(actions);

    document.body.appendChild(panel);
    setPanelTab("structure");
    buildSecList(secList);
    refreshUndo();
  }

  /* ---------- boot ---------- */
  applyAll();
  migrateLegacyKeys();
  // carousels whose slides were edited get their HTML restored by
  // applyContent — re-init them (clones/dots) before resolving asset imgs
  if (window.__peInitCarousels) window.__peInitCarousels(document);
  resolveAssetImages(document);
  migrateBase64Assets().catch(function () {});
  buildPanel();
  syncToggles(); // baked HTML can carry stale aria-pressed on the dock buttons

  // restore history + place after an undo/redo reload
  try {
    var u = sessionStorage.getItem("pe_undo"); if (u) undoStack = JSON.parse(u);
    var r = sessionStorage.getItem("pe_redo"); if (r) redoStack = JSON.parse(r);
    refreshUndo();
    if (sessionStorage.getItem("pe_open") === "1") document.body.classList.add("pe-open");
    var sc = sessionStorage.getItem("pe_scroll");
    if (sc != null) window.scrollTo(0, parseInt(sc, 10) || 0);
    ["pe_undo", "pe_redo", "pe_open", "pe_scroll"].forEach(function (k) { sessionStorage.removeItem(k); });
  } catch (e) {}

  var launch = document.getElementById("peLaunch");
  if (launch) launch.addEventListener("click", function () { document.body.classList.add("pe-open"); });
  var quickEdit = document.getElementById("peEdit");
  if (quickEdit) quickEdit.addEventListener("click", function () { setEditing(!editing); });
  var quickLayout = document.getElementById("peLayout");
  if (quickLayout) quickLayout.addEventListener("click", function () { setLayout(!layout); });

  if (location.hash === "#edit") document.body.classList.add("pe-open");
})();
