/* Peregrine — site interactions
   Small, dependency-free. Everything degrades gracefully without JS. */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     CONFIG — edit these
     ---------------------------------------------------------- */
  var CONFIG = {
    // Netlify handles launch signups while formEndpoint is set. This address is
    // the mailto fallback and the public contact for questions about Peregrine.
    notifyEmail: "support@peregrinedryfire.com",
    // Netlify Forms endpoint. If left blank, the form opens the visitor's email
    // app addressed to notifyEmail instead.
    formEndpoint: "/"
  };

  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");

  /* --- nav: solidify on scroll --- */
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* --- mobile menu --- */
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    // close after picking a link
    document.querySelectorAll(".nav__mobile a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* --- scroll reveal --- */
  var reveals = document.querySelectorAll(".reveal");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) {
      el.classList.remove("in");
      el.classList.add("pe-reveal-ready");
      io.observe(el);
    });
  }

  /* --- stat band split-flap (re-runs on every pass through the viewport) ---
     Each digit is a flap cell that cycles characters and settles left to
     right, vestaboard style. Numbers keep their exact size and markup slot
     (the <small> unit suffix stays put). */
  (function () {
    var band = document.getElementById("measure");
    if (!band || reduce || !("IntersectionObserver" in window)) return;
    var targets = []; // {cells, text} per chip__num
    band.querySelectorAll(".chip__num").forEach(function (numEl) {
      var textNode = numEl.firstChild; // number text; <small> suffix stays put
      if (!textNode || textNode.nodeType !== 3) return;
      var text = textNode.textContent.trim();
      if (!/^[\d.]+$/.test(text)) return;
      var wrap = document.createElement("span");
      wrap.className = "chip__flap";
      text.split("").forEach(function (ch) {
        var cell = document.createElement("span");
        cell.className = "chip__flap-cell" + (ch === "." ? " chip__flap-cell--dot" : "");
        cell.textContent = ch;
        wrap.appendChild(cell);
      });
      numEl.replaceChild(wrap, textNode);
      targets.push({ cells: wrap.children, text: text });
    });
    if (!targets.length) return;
    var gen = 0, flapFrame = null;
    function cancelCellAnimation(cell) {
      if (!cell.__peFlapAnimation) return;
      cell.__peFlapAnimation.cancel();
      cell.__peFlapAnimation = null;
    }
    function settle(cell, ch) {
      cancelCellAnimation(cell);
      cell.textContent = ch;
    }
    function settleTargets() {
      targets.forEach(function (t) {
        Array.prototype.forEach.call(t.cells, function (cell, i) {
          settle(cell, t.text[i]);
        });
      });
    }
    function cancelFlaps() {
      gen++;
      if (flapFrame != null) cancelAnimationFrame(flapFrame);
      flapFrame = null;
      settleTargets();
    }
    function animateFlapCell(cell) {
      cancelCellAnimation(cell);
      if (typeof cell.animate !== "function") return;
      cell.__peFlapAnimation = cell.animate([
        { transform: "scaleY(1)", filter: "brightness(1)" },
        { transform: "scaleY(.12)", filter: "brightness(1.7)" },
        { transform: "scaleY(1)", filter: "brightness(1)" }
      ], { duration: 80, easing: "linear" });
    }
    function runFlaps() {
      cancelFlaps();
      var myGen = gen, started = performance.now(), states = [];
      targets.forEach(function (t) {
        Array.prototype.forEach.call(t.cells, function (cell, i) {
          if (t.text[i] === ".") return;
          states.push({
            cell: cell,
            final: t.text[i],
            settleAt: 900 + i * 350,
            lastFlip: 0,
            digit: (Math.random() * 10) | 0,
            settled: false
          });
        });
      });
      function flip(now) {
        if (myGen !== gen) return;
        var pending = false;
        states.forEach(function (state) {
          if (state.settled) return;
          if (now - started >= state.settleAt) {
            state.settled = true;
            settle(state.cell, state.final);
            return;
          }
          pending = true;
          if (now - state.lastFlip > 75) {
            state.lastFlip = now;
            state.digit = (state.digit + 1) % 10;
            state.cell.textContent = state.digit;
            animateFlapCell(state.cell);
          }
        });
        flapFrame = pending ? requestAnimationFrame(flip) : null;
      }
      flapFrame = requestAnimationFrame(flip);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio >= 0.35) runFlaps();
        else if (!e.isIntersecting) cancelFlaps();
      });
    }, { threshold: [0, 0.35] });
    io.observe(band);
  })();

  /* --- laser ping: click any open background, page-wide, to dry-fire.
     Every shot scores (+1..+5 by distance to the reticle's live position);
     pings render in a fixed overlay so behavior is identical in every
     section. --- */
  (function () {
    var layer = document.createElement("div");
    layer.className = "laser-ping-layer";
    document.body.appendChild(layer);
    var heroScoreLabels = ["+1", "+2", "+3", "+4", "+5"];
    function heroClickScore(clientX, clientY) {
      // score against the crosshair's live position (it follows the scroll)
      var reticleCenterX = window.innerWidth * 0.64;
      var reticleDocY = window.__peReticleDocY != null ? window.__peReticleDocY : window.scrollY + window.innerHeight * 0.46;
      var reticleCenterY = reticleDocY - window.scrollY;
      var reticleRadius = 115;
      var laserBullseyeRadius = 18;
      var dx = clientX - reticleCenterX;
      var dy = clientY - reticleCenterY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= laserBullseyeRadius) return heroScoreLabels[4];
      var closeness = 1 - Math.min(1, Math.max(0, (distance - laserBullseyeRadius) / (reticleRadius - laserBullseyeRadius)));
      var score = Math.max(1, Math.min(4, Math.ceil(closeness * 4)));
      return heroScoreLabels[score - 1];
    }
    document.addEventListener("pointerdown", function (e) {
      // only open background: never controls, media, phones, the wheel,
      // the nav, or any editor chrome
      if (e.target.closest(
        "a,button,input,select,textarea,form,.signup,img,video,svg," +
        ".device,.carousel,.drift__wheel,.dw-hand,.nav,.video-stage," +
        ".pe-dock,.pe-panel,.pe-launch,.pe-seltools,[contenteditable]"
      )) return;
      var ping = document.createElement("span");
      ping.className = "laser-ping" + (reduce ? " laser-ping--static" : "");
      ping.style.left = e.clientX + "px"; ping.style.top = e.clientY + "px";
      layer.appendChild(ping);
      setTimeout(function () { ping.remove(); }, 1600);
      if (!reduce) {
        var chip = document.createElement("span");
        chip.className = "laser-score";
        chip.textContent = heroClickScore(e.clientX, e.clientY);
        chip.style.left = (e.clientX + 18) + "px"; chip.style.top = (e.clientY - 14) + "px";
        layer.appendChild(chip);
        setTimeout(function () { chip.remove(); }, 1100);
      }
    });
  })();

  /* --- per-section entrance effects (added via the Customize panel) ---
     Exposed so the editor can re-observe newly-animated sections live. Works
     on the published export too, since this runs without the editor present. */
  function observeAnims() {
    var els = document.querySelectorAll("[data-pe-anim]:not(.pe-anim-ready)");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        el.classList.remove("pe-anim-ready");
        el.classList.add("pe-in");
      });
      return;
    }
    var ao = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("pe-in"); ao.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) {
      el.classList.remove("pe-in");
      el.classList.add("pe-anim-ready");
      ao.observe(el);
    });
  }
  window.__peObserveAnims = observeAnims;
  observeAnims();

  /* --- email capture --- */
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector(".signup__input");
      var note = form.querySelector(".signup__note");
      var ok = form.querySelector(".signup__ok");
      var value = (input && input.value || "").trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

      if (!valid) {
        if (input) { input.focus(); input.style.borderColor = "var(--laser)"; }
        return;
      }

      if (CONFIG.formEndpoint) {
        // Include every registered field so Netlify can validate the honeypot.
        var params = new URLSearchParams(new FormData(form));
        fetch(CONFIG.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString()
        }).catch(function () {});
      } else if (CONFIG.notifyEmail) {
        // open the visitor's email app, pre-addressed to you
        var subject = encodeURIComponent("Add me to the Peregrine launch list");
        var body = encodeURIComponent(
          "Please add this address to the Peregrine launch list:\n\n" + value
        );
        window.location.href =
          "mailto:" + CONFIG.notifyEmail + "?subject=" + subject + "&body=" + body;
      }

      // success state
      if (input) { input.value = ""; input.style.borderColor = ""; }
      if (note) note.hidden = true;
      if (ok) ok.hidden = false;
    });
  });

  /* --- scroll-following crosshair ---
     The crosshair rail rides the scroll (center held at 46% of the viewport)
     until it reaches the gap between the metric strip and How it works, where it pins. Scrolling back
     up picks it up again. Publishes the reticle's document-space Y for the
     cosmos field and the hero click score. */
  (function crosshairFollow() {
    var ch = document.getElementById("crosshair");
    if (!ch) return;
    var pinY = Infinity, anchorY = 0, lastY = null;
    var laser = document.querySelector(".pagefx__laser");
    var hero = document.getElementById("hero");
    function docTop(el) {
      // offsetTop chain = resting layout position, immune to the transient
      // transforms of section entrance animations
      var y = 0;
      while (el) { y += el.offsetTop; el = el.offsetParent; }
      return y;
    }
    function measure() {
      // Rest the reticle halfway between the stat band (Every rep, measured)
      // and the How it works heading.
      var p = 0;
      var band = document.getElementById("measure");
      var howHead = document.querySelector("#how .section__head") || document.getElementById("how");
      if (band && band.offsetParent && howHead) {
        var bandBottom = docTop(band) + band.offsetHeight;
        p = bandBottom + Math.max(0, docTop(howHead) - bandBottom) / 2;
      } else {
        // If the metric strip is hidden in the editor, the How heading remains
        // the closest stable pin target.
        var pin = howHead && howHead.offsetParent ? howHead : document.getElementById("drift");
        p = pin ? docTop(pin) : Infinity;
      }
      // Reject a bogus pin: measuring before layout settles (fonts, lazy media,
      // the CTA video that delays the `load` event) can transiently return 0,
      // which would pin the crosshair at the very top forever. Keep the last
      // good value, and never pin at 0 — follow the scroll until a real one lands.
      if (p > 0 && isFinite(p)) pinY = p;
      else if (!(pinY > 0)) pinY = Infinity;
      // start where the reticle always lived: 46% down the hero, behind the phone
      anchorY = hero ? docTop(hero) + hero.offsetHeight * 0.46 : window.innerHeight * 0.46;
      // laser: ~35% by the pin (the CSS mask's mid stop), then a long fade
      // that ends between the Progress block and the drift block — where the
      // reticle itself used to rest
      if (laser) {
        if (pinY === Infinity) {
          laser.style.setProperty("--pe-laser-solid", "100%");
          laser.style.setProperty("--pe-laser-fade", "100%");
          laser.style.setProperty("--pe-laser-end", "100%");
        } else {
          var vh = window.innerHeight;
          var endY = pinY + vh * 0.35;
          var feats = document.querySelectorAll("#features .feature");
          var lastFeat = feats.length ? feats[feats.length - 1] : null;
          var driftEl = document.querySelector("#drift .drift") || document.getElementById("drift");
          if (lastFeat && lastFeat.offsetParent && driftEl) {
            var featBottom = docTop(lastFeat) + lastFeat.offsetHeight;
            endY = Math.max(featBottom + Math.max(0, docTop(driftEl) - featBottom) / 2, pinY + 100);
          }
          laser.style.setProperty("--pe-laser-solid", Math.max(0, pinY - vh * 0.5) + "px");
          laser.style.setProperty("--pe-laser-fade", pinY + "px");
          laser.style.setProperty("--pe-laser-end", endY + "px");
        }
      }
    }
    function targetY() {
      // hold at the hero anchor until the scroll catches up, then ride at 46%
      // of the viewport until the pin point
      return Math.min(pinY, Math.max(anchorY, window.scrollY + window.innerHeight * 0.46));
    }
    var currentY = null, lastFrame = null;
    function render(y) {
      if (y === lastY) return;
      lastY = y;
      window.__peReticleDocY = y;
      ch.style.transform = "translateY(" + y + "px)";
    }
    measure();
    currentY = targetY(); render(currentY);
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("load", measure);
    // Layout settles late (fonts, lazy media, the CTA video that defers `load`).
    // Re-measure a few times so the pin lands on the real position.
    [200, 600, 1500, 3000].forEach(function (t) { setTimeout(measure, t); });
    // Chase the scroll with a short exponential ease (~110ms time constant)
    // instead of snapping to each discrete wheel step — the rail glides.
    (function loop(now) {
      var t = targetY();
      var dt = lastFrame == null ? 16 : Math.min(64, now - lastFrame);
      lastFrame = now;
      if (reduce) currentY = t;
      else {
        currentY += (t - currentY) * (1 - Math.exp(-dt / 110));
        if (Math.abs(t - currentY) < 0.1) currentY = t;
      }
      render(currentY);
      requestAnimationFrame(loop);
    })(performance.now());
  })();

  /* --- nav wordmark reveal ---
     The header's Peregrine wordmark stays hidden while the hero PEREGRINE
     title is on screen, then fades in once the title scrolls under the nav. */
  (function navBrandReveal() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    var title = document.querySelector(".hero__title");
    if (!title || !("IntersectionObserver" in window)) { nav.classList.add("nav--branded"); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { nav.classList.toggle("nav--branded", !e.isIntersecting); });
    }, { rootMargin: "-72px 0px 0px 0px" });
    io.observe(title);
  })();

  /* --- page-wide cosmos: drifting ember particle field ---
     Particles live in document space (concentrated around the reticle,
     radiating outward, thinning toward the page bottom); the canvas is
     viewport-fixed and draws them offset by the scroll position. */
  (function cosmos() {
    var canvas = document.getElementById("cosmos");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, docH = 0, parts = [], raf = null;

    function density() {
      if (window.__peCosmos != null) return window.__peCosmos;
      var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pe-cosmos"));
      return isNaN(v) ? 1 : v;
    }
    function centerY() {
      return window.__peReticleDocY != null ? window.__peReticleDocY : H * 0.46;
    }
    function build() {
      parts = [];
      var n = Math.round(Math.min(380, (W * docH) / 24000) * density());
      var cx = W * 0.64, cy = centerY();
      var maxR = Math.max(docH - cy, cy) + H * 0.3;
      for (var i = 0; i < n; i++) {
        var a, r, x, y, tries = 0;
        do { // pow-biased radius keeps the field dense near the reticle
          a = Math.random() * Math.PI * 2;
          r = Math.pow(Math.random(), 1.6) * maxR;
          x = cx + Math.cos(a) * r; y = cy + Math.sin(a) * r;
        } while ((x < -24 || x > W + 24 || y < -24 || y > docH + 24) && ++tries < 6);
        if (tries >= 6) { x = Math.random() * W; y = Math.random() * docH; }
        parts.push({
          x: x, y: y, a: a,
          sp: 0.05 + Math.random() * 0.22, s: 0.4 + Math.random() * 1.7,
          o: 0.12 + Math.random() * 0.5, tw: Math.random() * Math.PI * 2
        });
      }
    }
    function size() {
      W = window.innerWidth; H = window.innerHeight;
      docH = Math.max(document.documentElement.scrollHeight, H);
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
    }
    function dot(p, vy, tw) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(255," + (150 + Math.floor(60 * tw)) + ",95," + (p.o * tw).toFixed(3) + ")";
      ctx.arc(p.x, vy, p.s, 0, Math.PI * 2); ctx.fill();
    }
    function staticDraw() {
      var sy = window.scrollY;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var vy = parts[i].y - sy;
        if (vy > -24 && vy < H + 24) dot(parts[i], vy, 0.8);
      }
    }
    function frame() {
      var sy = window.scrollY;
      var cx = W * 0.64, cy = centerY();
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += Math.cos(p.a) * p.sp; p.y += Math.sin(p.a) * p.sp; p.tw += 0.03;
        if (p.x < -24 || p.x > W + 24 || p.y < -24 || p.y > docH + 24) {
          p.x = cx + (Math.random() - 0.5) * 50; p.y = cy + (Math.random() - 0.5) * 50;
          p.a = Math.random() * Math.PI * 2;
        }
        var vy = p.y - sy;
        if (vy > -24 && vy < H + 24) dot(p, vy, Math.sin(p.tw) * 0.3 + 0.7);
      }
      raf = requestAnimationFrame(frame);
    }

    size();
    if (reduce) {
      staticDraw();
      window.addEventListener("scroll", staticDraw, { passive: true });
    } else {
      raf = requestAnimationFrame(frame);
    }
    // let the Customize panel re-tune density live (also refreshes doc height)
    window.__peCosmosRebuild = function () {
      if (raf) cancelAnimationFrame(raf);
      size();
      if (reduce) staticDraw(); else raf = requestAnimationFrame(frame);
    };
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (raf) cancelAnimationFrame(raf);
        size();
        if (reduce) staticDraw(); else raf = requestAnimationFrame(frame);
      }, 200);
    });
    // media/fonts settling changes the document height — rebuild once loaded
    window.addEventListener("load", function () {
      if (raf) cancelAnimationFrame(raf);
      size();
      if (reduce) staticDraw(); else raf = requestAnimationFrame(frame);
    });
  })();

  /* --- drift diagnosis wheel ---
     Zone copy mirrors the app's DriftAnalyzer (right-handed shooter). */
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
  /* Left-handed = horizontal mirror of the wheel (matches the app's
     DriftAnalyzer): a fault at 1 o'clock moves to 11 o'clock, and the
     dominant/support hand words swap. */
  function swapHands(s) {
    return s
      .replace(/\bRight\b/g, "@@R@@").replace(/\bLeft\b/g, "Right").replace(/@@R@@/g, "Left")
      .replace(/\bright\b/g, "@@r@@").replace(/\bleft\b/g, "right").replace(/@@r@@/g, "left");
  }
  function driftZonesFor(hand) {
    if (hand !== "left") return DRIFT_ZONES;
    return DRIFT_ZONES.map(function (_, j) {
      var src = DRIFT_ZONES[(12 - j) % 12];
      return {
        hour: j === 0 ? 12 : j,
        name: swapHands(src.name),
        cause: swapHands(src.cause),
        fix: swapHands(src.fix)
      };
    });
  }

  window.__peInitDriftWheel = function () {
    var host = document.getElementById("driftWheel");
    // Guard on a JS property, NOT a DOM attribute: the editor bakes attributes
    // into saved HTML, and a baked data-pe-drift-ready would make this skip init
    // forever (dead wheel — no idle cycle, no hover selection). Props don't
    // serialize, so a saved/reloaded page always re-initializes cleanly.
    if (!host || host.__peDriftReady) return;
    var readout = document.getElementById("driftReadout");
    host.textContent = "";
    host.__peDriftReady = true;
    host.removeAttribute("data-pe-drift-ready");
    if (!readout) {
      readout = document.createElement("div");
      readout.id = "driftReadout";
      readout.className = "drift__readout";
      readout.setAttribute("aria-live", "polite");
    } else {
      readout.className = "drift__readout";
      readout.innerHTML = "";
      readout.setAttribute("aria-live", "polite");
    }
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "-14 -14 388 388");
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", "12 clock-position drift zones");
    var defs = document.createElementNS(NS, "defs");
    defs.innerHTML =
      '<filter id="dwLaserBloom" x="-220%" y="-220%" width="540%" height="540%">' +
        '<feGaussianBlur in="SourceGraphic" stdDeviation="4" result="soft"/>' +
        '<feGaussianBlur in="SourceGraphic" stdDeviation="10" result="wide"/>' +
        '<feMerge>' +
          '<feMergeNode in="wide"/>' +
          '<feMergeNode in="soft"/>' +
          '<feMergeNode in="SourceGraphic"/>' +
        '</feMerge>' +
      '</filter>' +
      '<marker id="dwArrowHead" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="strokeWidth">' +
        '<path d="M1 1 L8 4.5 L1 8 Z" class="dw-arrow-head"/>' +
      '</marker>';
    svg.appendChild(defs);
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
    tracer.setAttribute("pathLength", 100);
    svg.appendChild(tracer);
    var tracerPulse = document.createElementNS(NS, "line");
    tracerPulse.setAttribute("class", "dw-tracer-pulse");
    tracerPulse.setAttribute("x1", 180); tracerPulse.setAttribute("y1", 180);
    tracerPulse.setAttribute("x2", 180); tracerPulse.setAttribute("y2", 180);
    tracerPulse.setAttribute("pathLength", 100);
    svg.appendChild(tracerPulse);
    var calloutArrow = document.createElementNS(NS, "line");
    calloutArrow.setAttribute("class", "dw-callout-arrow");
    calloutArrow.setAttribute("x1", 180); calloutArrow.setAttribute("y1", 180);
    calloutArrow.setAttribute("x2", 180); calloutArrow.setAttribute("y2", 180);
    calloutArrow.setAttribute("marker-end", "url(#dwArrowHead)");
    var aimRing = document.createElementNS(NS, "circle");
    aimRing.setAttribute("class", "dw-aim-ring");
    aimRing.setAttribute("r", 5.8); aimRing.setAttribute("cx", 180); aimRing.setAttribute("cy", 180);
    var flash = document.createElementNS(NS, "circle");
    flash.setAttribute("class", "dw-flash");
    flash.setAttribute("r", 11); flash.setAttribute("cx", 180); flash.setAttribute("cy", 180);
    var dot = document.createElementNS(NS, "circle");
    dot.setAttribute("class", "dw-dot");
    dot.setAttribute("r", 4.5); dot.setAttribute("cx", 180); dot.setAttribute("cy", 180);
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
    svg.appendChild(calloutArrow);
    svg.appendChild(aimRing);
    svg.appendChild(flash);
    svg.appendChild(dot);

    /* handedness toggle: the left-handed wheel is the horizontal mirror.
       Last choice persists across visits; right-handed is the default. */
    var hand = "right";
    try { if (localStorage.getItem("peDriftHand") === "left") hand = "left"; } catch (err) {}
    var currentZones = driftZonesFor(hand);
    var handWrap = document.createElement("div");
    handWrap.className = "dw-hand";
    handWrap.setAttribute("role", "group");
    handWrap.setAttribute("aria-label", "Shooter handedness");
    var handBtns = {};
    [["right", "Right-handed"], ["left", "Left-handed"]].forEach(function (opt) {
      var hb = document.createElement("button");
      hb.type = "button";
      hb.textContent = opt[1];
      hb.className = opt[0] === hand ? "is-on" : "";
      hb.setAttribute("aria-pressed", opt[0] === hand ? "true" : "false");
      hb.addEventListener("click", function () { setHand(opt[0]); });
      handBtns[opt[0]] = hb;
      handWrap.appendChild(hb);
    });
    host.appendChild(handWrap);
    host.appendChild(svg);
    host.appendChild(readout);

    function syncSectorLabels() {
      sectors.forEach(function (s, i) {
        var z = currentZones[i];
        s.setAttribute("aria-label", z.name + " (" + z.hour + " o'clock)");
      });
    }
    function setHand(h) {
      if (h === hand) return;
      hand = h;
      try { localStorage.setItem("peDriftHand", h); } catch (err) {}
      currentZones = driftZonesFor(h);
      Object.keys(handBtns).forEach(function (k) {
        handBtns[k].classList.toggle("is-on", k === h);
        handBtns[k].setAttribute("aria-pressed", k === h ? "true" : "false");
      });
      syncSectorLabels();
      if (window.__peDriftReadoutLock) window.__peDriftReadoutLock(); // zone copy differs per hand
      stopIdle();
      if (activeIndex != null) show((12 - activeIndex) % 12, true); // mirrored fault, laser re-fires
    }

    var idleTimer = null, interacted = false, hovering = false;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var activeIndex = null;
    function moveLaserMark(end, angleDeg) {
      var transition = reduceMotion ? "none" : "all .48s cubic-bezier(.2,.7,.2,1)";
      [dot, flash, aimRing, calloutArrow].forEach(function (el) { el.style.transition = transition; });
      dot.setAttribute("cx", end[0]); dot.setAttribute("cy", end[1]);
      flash.setAttribute("cx", end[0]); flash.setAttribute("cy", end[1]);
      aimRing.setAttribute("cx", end[0]); aimRing.setAttribute("cy", end[1]);
      var arrowStart = pt(angleDeg, 132);
      var arrowEnd = pt(angleDeg, 164);
      calloutArrow.setAttribute("x1", arrowStart[0]); calloutArrow.setAttribute("y1", arrowStart[1]);
      calloutArrow.setAttribute("x2", arrowEnd[0]); calloutArrow.setAttribute("y2", arrowEnd[1]);
    }
    function setHitState(on) {
      dot.classList.toggle("is-hit", on);
      flash.classList.toggle("is-flashing", on);
    }
    function show(i, fireEffect) {
      var shouldPulse = fireEffect && i !== activeIndex && !reduceMotion;
      activeIndex = i;
      sectors.forEach(function (s, j) { s.classList.toggle("is-active", j === i); });
      var z = currentZones[i];
      var start = pt(i * 30, 34);
      var end = pt(i * 30, 118);
      moveLaserMark(end, i * 30);
      tracer.setAttribute("x1", start[0]); tracer.setAttribute("y1", start[1]);
      tracer.setAttribute("x2", end[0]); tracer.setAttribute("y2", end[1]);
      tracerPulse.setAttribute("x1", start[0]); tracerPulse.setAttribute("y1", start[1]);
      tracerPulse.setAttribute("x2", end[0]); tracerPulse.setAttribute("y2", end[1]);
      tracer.classList.add("is-live");
      if (shouldPulse) {
        setHitState(false);
        tracerPulse.classList.remove("is-live");
        void tracerPulse.getBoundingClientRect();
        tracerPulse.classList.add("is-live");
        setHitState(true);
      }
      if (readout) readout.innerHTML =
        '<p class="drift__readout-label"><span class="swatch" style="background:' + driftZoneColor(i) + '"></span>' +
        z.hour + " o'clock — " + z.name + "</p>" +
        '<p class="dw-cause">' + z.cause + "</p>" +
        '<p class="dw-fix">' + z.fix + "</p>";
    }
    /* Auto-diagnosis mode: the wheel randomly "fires" at zones like a live
       session until the shooter hovers to explore. Hover pauses it; a click,
       tap or keyboard pick stops it for good; leaving without picking lets
       it resume. */
    function stopIdle() { interacted = true; clearTimeout(idleTimer); }
    function scheduleIdle(delay) {
      if (interacted || reduceMotion) return;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(idleStep, delay);
    }
    function idleStep() {
      if (interacted || reduceMotion || hovering) return;
      var next = activeIndex;
      while (next === activeIndex) next = Math.floor(Math.random() * 12);
      show(next, true);
      scheduleIdle(2600 + Math.random() * 1800);
    }
    svg.addEventListener("pointerenter", function () { hovering = true; clearTimeout(idleTimer); });
    svg.addEventListener("pointerleave", function () { hovering = false; scheduleIdle(4000); });
    sectors.forEach(function (s, i) {
      s.addEventListener("pointerenter", function () { show(i, true); });
      s.addEventListener("click", function () { stopIdle(); show(i, true); });
      s.addEventListener("focus", function () { stopIdle(); show(i, true); });
      s.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); sectors[(i + 1) % 12].focus(); }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); sectors[(i + 11) % 12].focus(); }
      });
    });
    if (hand === "left") syncSectorLabels();
    /* The idle mode swaps the readout text every few seconds; without a
       locked height the block reflows and the whole page shifts. Reserve
       the height of the tallest zone readout so the area stays static. */
    function lockReadoutHeight() {
      if (!readout || !readout.isConnected) return;
      var saved = readout.innerHTML;
      var max = 0;
      currentZones.forEach(function (z) {
        readout.innerHTML =
          '<p class="drift__readout-label"><span class="swatch"></span>' +
          z.hour + " o'clock — " + z.name + "</p>" +
          '<p class="dw-cause">' + z.cause + "</p>" +
          '<p class="dw-fix">' + z.fix + "</p>";
        max = Math.max(max, readout.offsetHeight);
      });
      readout.innerHTML = saved;
      readout.style.minHeight = max + "px";
    }
    if (window.__peDriftReadoutLock) {
      window.removeEventListener("resize", window.__peDriftReadoutLock);
      window.removeEventListener("load", window.__peDriftReadoutLock);
    }
    window.__peDriftReadoutLock = lockReadoutHeight;
    window.addEventListener("resize", lockReadoutHeight, { passive: true });
    window.addEventListener("load", lockReadoutHeight); // fonts settle late
    show(6, false); // start on the classic 6 o'clock flinch
    lockReadoutHeight();
    scheduleIdle(2200);
  };
  window.__peInitDriftWheel();

  /* --- carousels (drills + targets) --- */
  function initCarousel(car) {
    var track = car.querySelector(".carousel__track");
    var clones = track ? track.querySelectorAll("[data-carousel-clone]") : [];
    var slides = track ? Array.prototype.slice.call(track.querySelectorAll(".carousel__slide:not([data-carousel-clone])")) : [];
    var dotsWrap = car.querySelector(".carousel__dots");
    var prev = car.querySelector(".carousel__arrow--prev");
    var next = car.querySelector(".carousel__arrow--next");
    if (!track || slides.length < 2) return;
    var isPhoneCarousel = slides.every(function (slide) {
      return !!slide.querySelector(".device .device__screen img");
    });
    var readyKey = slides.length + (isPhoneCarousel ? ":phone-fixed" : ":loop");
    // Guard on a JS property, NOT a serialized attribute — a baked-in
    // data-pe-carousel-ready in saved HTML makes this bail out on load,
    // publishing carousels with dead arrows/dots/swipe (same failure the
    // target-loop captions had). Strip any stale attribute from old saves.
    if (car.hasAttribute("data-pe-carousel-ready")) car.removeAttribute("data-pe-carousel-ready");
    if (car.__peCarouselReady === readyKey && (isPhoneCarousel || clones.length === 2)) return;
    clones.forEach(function (clone) { clone.remove(); });
    car.__peCarouselReady = readyKey;
    if (isPhoneCarousel) {
      car.classList.add("carousel--phone-fixed");
      var fixedIndex = 0;
      var fixedDots = [];
      if (dotsWrap) {
        dotsWrap.textContent = "";
        slides.forEach(function (_, i) {
          var b = document.createElement("button");
          b.type = "button";
          b.setAttribute("aria-label", "Go to item " + (i + 1));
          b.addEventListener("click", function () { showFixedPhoneSlide(i); });
          dotsWrap.appendChild(b); fixedDots.push(b);
        });
      }
      function showFixedPhoneSlide(i) {
        fixedIndex = ((i % slides.length) + slides.length) % slides.length;
        slides.forEach(function (slide, n) {
          var active = n === fixedIndex;
          slide.classList.toggle("is-active", active);
          slide.setAttribute("aria-hidden", active ? "false" : "true");
        });
        fixedDots.forEach(function (d, n) { d.classList.toggle("is-active", n === fixedIndex); });
      }
      if (prev) prev.onclick = function () { showFixedPhoneSlide(fixedIndex - 1); };
      if (next) next.onclick = function () { showFixedPhoneSlide(fixedIndex + 1); };
      // swipe: fixed phone slides don't scroll, so translate a mostly-horizontal
      // drag into prev/next (touch-action: pan-y keeps vertical scrolling native)
      var swipeViewport = car.querySelector(".carousel__viewport") || track;
      var swipeStart = null;
      swipeViewport.addEventListener("pointerdown", function (e) {
        swipeStart = { x: e.clientX, y: e.clientY };
      }, { passive: true });
      swipeViewport.addEventListener("pointerup", function (e) {
        if (!swipeStart) return;
        var dx = e.clientX - swipeStart.x, dy = e.clientY - swipeStart.y;
        swipeStart = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          showFixedPhoneSlide(fixedIndex + (dx < 0 ? 1 : -1));
        }
      }, { passive: true });
      swipeViewport.addEventListener("pointercancel", function () { swipeStart = null; }, { passive: true });
      // native image drag would cancel the pointer stream mid-swipe
      swipeViewport.addEventListener("dragstart", function (e) { e.preventDefault(); });
      showFixedPhoneSlide(0);
      return;
    }
    car.classList.remove("carousel--phone-fixed");
    var firstClone = slides[0].cloneNode(true);
    var lastClone = slides[slides.length - 1].cloneNode(true);
    firstClone.setAttribute("data-carousel-clone", "first");
    firstClone.setAttribute("aria-hidden", "true");
    lastClone.setAttribute("data-carousel-clone", "last");
    lastClone.setAttribute("aria-hidden", "true");
    track.insertBefore(lastClone, slides[0]);
    track.appendChild(firstClone);

    var dots = [];
    if (dotsWrap) {
      dotsWrap.textContent = "";
      slides.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Go to item " + (i + 1));
        b.addEventListener("click", function () { go(i); });
        dotsWrap.appendChild(b); dots.push(b);
      });
    }
    function rawCurrent() {
      return Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    }
    function current() {
      var c = rawCurrent() - 1;
      return ((c % slides.length) + slides.length) % slides.length;
    }
    function jumpToRaw(raw) {
      track.scrollTo({ left: raw * track.clientWidth, behavior: "auto" });
    }
    function go(i) {
      i = ((i % slides.length) + slides.length) % slides.length;
      track.scrollTo({ left: (i + 1) * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
    }
    function update() {
      var raw = rawCurrent();
      if (raw === 0) jumpToRaw(slides.length);
      if (raw === slides.length + 1) jumpToRaw(1);
      var c = current();
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === c); });
    }
    function wrapCarouselScroll(e) {
      var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!delta) return;
      var c = current();
      if (delta > 0 && c === slides.length - 1) {
        e.preventDefault();
        go(0);
      } else if (delta < 0 && c === 0) {
        e.preventDefault();
        go(slides.length - 1);
      }
    }
    if (prev) prev.onclick = function () { go(current() - 1); };
    if (next) next.onclick = function () { go(current() + 1); };
    track.onscroll = function () { requestAnimationFrame(update); };
    track.addEventListener("wheel", wrapCarouselScroll, { passive: false });
    requestAnimationFrame(function () { jumpToRaw(1); update(); });
    update();
    // Lazy image loads can reset scrollLeft to 0 after init, which update()
    // reads as a backwards wrap and lands on the LAST slide. Until the user
    // actually touches the carousel, keep pinning it back to slide one.
    var userTouched = false;
    function markTouched() { userTouched = true; }
    ["pointerdown", "wheel", "touchstart", "keydown"].forEach(function (ev) {
      car.addEventListener(ev, markTouched, { passive: true });
    });
    function rePin() { if (!userTouched && current() !== 0) jumpToRaw(1); }
    track.querySelectorAll("img").forEach(function (img) {
      if (!img.complete) img.addEventListener("load", function () { requestAnimationFrame(rePin); });
    });
    if ("IntersectionObserver" in window) {
      var pinIo = new IntersectionObserver(function (entries) {
        if (userTouched) { pinIo.disconnect(); return; }
        if (entries.some(function (e) { return e.isIntersecting; })) rePin();
      });
      pinIo.observe(car);
    }
  }
  window.__peInitCarousels = function (root) {
    (root || document).querySelectorAll("[data-carousel]").forEach(initCarousel);
  };
  window.__peInitCarousels(document);

  /* --- target loop caption --- */
  function initTargetLoopCaptions(root) {
    (root || document).querySelectorAll("[data-target-loop-names]").forEach(function (fig) {
      var video = fig.querySelector("video");
      var label = fig.querySelector("[data-target-loop-label]");
      var names = (fig.getAttribute("data-target-loop-names") || "")
        .split("|")
        .map(function (name) { return name.trim(); })
        .filter(Boolean);
      if (!video || !label || !names.length) return;
      var readyKey = names.join("|");
      // Guard on a JS property, NOT a serialized attribute — a baked-in
      // data-pe-target-loop-ready in saved HTML used to make this bail out on
      // load, freezing the label. Strip any stale attribute for older exports.
      if (fig.hasAttribute("data-pe-target-loop-ready")) fig.removeAttribute("data-pe-target-loop-ready");
      if (fig.__peTargetLoopReady === readyKey) return;
      fig.__peTargetLoopReady = readyKey;
      function updateTargetName(mediaTime) {
        var duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : names.length * 2;
        var segment = duration / names.length;
        var sourceTime = Number.isFinite(mediaTime) ? mediaTime : video.currentTime;
        var time = Number.isFinite(sourceTime) ? sourceTime % duration : 0;
        var idx = Math.min(names.length - 1, Math.floor(time / segment));
        label.textContent = names[idx];
      }
      function syncWithVideoFrame(_, metadata) {
        updateTargetName(metadata && Number.isFinite(metadata.mediaTime) ? metadata.mediaTime : video.currentTime);
        video.requestVideoFrameCallback(syncWithVideoFrame);
      }
      function syncWithAnimationFrame() {
        updateTargetName(video.currentTime);
        requestAnimationFrame(syncWithAnimationFrame);
      }
      video.addEventListener("loadedmetadata", function () { updateTargetName(video.currentTime); });
      video.addEventListener("seeked", function () { updateTargetName(video.currentTime); });
      if ("requestVideoFrameCallback" in video) {
        video.requestVideoFrameCallback(syncWithVideoFrame);
      } else {
        requestAnimationFrame(syncWithAnimationFrame);
      }
      updateTargetName();
      /* Drag to scrub the target strip (mouse or touch): pauses the loop
         while the pointer is down — a full-width drag runs one full loop —
         then playback resumes on its own after 3s of no interaction. */
      fig.style.touchAction = "pan-y";
      var scrubbing = false, scrubStartX = 0, scrubStartT = 0, resumeTimer = null;
      fig.addEventListener("pointerdown", function (e) {
        scrubbing = true; scrubStartX = e.clientX; scrubStartT = video.currentTime;
        clearTimeout(resumeTimer);
        video.pause();
        if (fig.setPointerCapture) { try { fig.setPointerCapture(e.pointerId); } catch (err) {} }
      });
      fig.addEventListener("pointermove", function (e) {
        if (!scrubbing) return;
        var duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : names.length * 2;
        var w = Math.max(1, fig.clientWidth);
        // dragging left pulls later targets in, like dragging the strip itself
        var t = scrubStartT - ((e.clientX - scrubStartX) / w) * duration;
        video.currentTime = ((t % duration) + duration) % duration;
      });
      function endScrub() {
        if (!scrubbing) return;
        scrubbing = false;
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(function () {
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        }, 3000);
      }
      fig.addEventListener("pointerup", endScrub);
      fig.addEventListener("pointercancel", endScrub);
    });
  }
  initTargetLoopCaptions(document);

  /* --- Webflow-inspired custom interactions ---
     The editor writes data-pe-interaction JSON onto elements. This runtime keeps
     exported pages dependency-free while supporting scroll, load, hover, click
     and reusable preset-style effects. */
  function parseInteraction(el) {
    try { return JSON.parse(el.getAttribute("data-pe-interaction") || "{}"); }
    catch (e) { return {}; }
  }
  var ixPlayed = new WeakSet();
  var ixConfigs = new WeakMap();
  var ixTimers = new WeakMap();
  var ixScrollObserver = null;

  function interactionDuration(cfg) {
    return Math.max(100, Math.min(5000, parseInt(cfg.duration || 650, 10)));
  }
  function interactionDelay(cfg) {
    return Math.max(0, Math.min(3000, parseInt(cfg.delay || 0, 10)));
  }
  function replayDuration(cfg) {
    var duration = interactionDuration(cfg);
    return Math.max(300, Math.min(550, Math.round(duration / 100) * 50));
  }
  function setupInteractionVars(el, cfg, replay) {
    var duration = replay ? replayDuration(cfg) : interactionDuration(cfg);
    var delay = replay ? 0 : interactionDelay(cfg);
    var easeMap = {
      smooth: "cubic-bezier(.2,.7,.2,1)",
      ease: "ease",
      linear: "linear",
      snap: "cubic-bezier(.16,1,.3,1)"
    };
    el.style.setProperty("--pe-ix-duration", duration + "ms");
    el.style.setProperty("--pe-ix-delay", delay + "ms");
    el.style.setProperty("--pe-ix-ease", easeMap[cfg.ease] || cfg.ease || easeMap.smooth);
    el.setAttribute("data-pe-ix-effect", cfg.effect || "fade");
    return { duration: duration, delay: delay };
  }
  function clearInteractionTimer(el) {
    var timer = ixTimers.get(el);
    if (timer) window.clearTimeout(timer);
    ixTimers.delete(el);
  }
  function finishInteraction(el) {
    ixPlayed.add(el);
    el.classList.remove("pe-ix-active", "pe-ix-run");
    ixTimers.delete(el);
  }
  function scheduleInteractionFinish(el, timing) {
    clearInteractionTimer(el);
    ixTimers.set(el, window.setTimeout(function () {
      finishInteraction(el);
    }, timing.duration + timing.delay + 80));
  }
  function runInteraction(el, cfg) {
    cfg = cfg || parseInteraction(el);
    var timing = setupInteractionVars(el, cfg, false);
    clearInteractionTimer(el);
    el.classList.remove("pe-ix-run");
    el.classList.add("pe-ix-active");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add("pe-ix-run");
        if (cfg.repeat === "loop") {
          el.style.animationIterationCount = "infinite";
        } else {
          el.style.animationIterationCount = "1";
          scheduleInteractionFinish(el, timing);
        }
      });
    });
  }
  function startScrollInteraction(el, cfg) {
    var timing = setupInteractionVars(el, cfg, ixPlayed.has(el));
    clearInteractionTimer(el);
    el.classList.add("pe-ix-active", "pe-ix-in");
    if (cfg.effect === "pulse") el.classList.add("pe-ix-run");
    scheduleInteractionFinish(el, timing);
  }
  function resetScrollInteraction(el, cfg) {
    clearInteractionTimer(el);
    el.classList.remove("pe-ix-active", "pe-ix-in", "pe-ix-run");
    setupInteractionVars(el, cfg, ixPlayed.has(el));
  }
  function ensureInteractionObserver() {
    if (ixScrollObserver || !("IntersectionObserver" in window)) return;
    ixScrollObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var cfg = ixConfigs.get(entry.target) || parseInteraction(entry.target);
        if (entry.isIntersecting && entry.intersectionRatio >= 0.18) {
          startScrollInteraction(entry.target, cfg);
          if (cfg.repeat !== "replay") ixScrollObserver.unobserve(entry.target);
        } else if (!entry.isIntersecting && cfg.repeat === "replay") {
          resetScrollInteraction(entry.target, cfg);
        }
      });
    }, { threshold: [0, 0.18], rootMargin: "0px 0px -8% 0px" });
  }
  function initInteractions(root) {
    var els = (root || document).querySelectorAll("[data-pe-interaction]");
    els.forEach(function (el) {
      var cfg = parseInteraction(el);
      if (ixScrollObserver) ixScrollObserver.unobserve(el);
      clearInteractionTimer(el);
      ixPlayed.delete(el);
      ixConfigs.delete(el);
      setupInteractionVars(el, cfg, false);
      el.classList.remove("pe-ix-pending", "pe-ix-ready", "pe-ix-in", "pe-ix-run", "pe-ix-active");
      el.onmouseenter = null;
      el.onclick = null;
      if (reduce) {
        el.classList.add("pe-ix-in");
      } else if (cfg.trigger === "hover") {
        el.onmouseenter = function () { runInteraction(el, cfg); };
      } else if (cfg.trigger === "click") {
        el.onclick = function () { runInteraction(el, cfg); };
      } else if (cfg.trigger === "load") {
        window.setTimeout(function () { runInteraction(el, cfg); }, interactionDelay(cfg));
      } else {
        ensureInteractionObserver();
        if (!ixScrollObserver) {
          el.classList.add("pe-ix-in");
        } else {
          el.classList.add("pe-ix-pending", "pe-ix-ready");
          ixConfigs.set(el, cfg);
          ixScrollObserver.observe(el);
        }
      }
    });
  }
  window.__peRunInteraction = runInteraction;
  window.__peInitInteractions = initInteractions;
  initInteractions(document);

  /* --- walkthrough video: robust play + helpful failure note ---
     Safari/iOS refuse to play a <video> served without HTTP Range (206)
     support. python -m http.server does NOT send 206, so "press play,
     nothing happens." serve.py (range-capable) fixes it; this surfaces the
     problem instead of failing silently, and lets a tap on the frame play. */
  (function video() {
    var v = document.querySelector(".video-el");
    if (!v) return;
    var stage = v.closest(".video-stage") || v.parentNode;

    function note(msg) {
      var n = stage.querySelector(".video-err");
      if (!n) {
        n = document.createElement("p");
        n.className = "video-err";
        stage.appendChild(n);
      }
      n.innerHTML = msg;
    }

    // tap anywhere on the phone frame to start (with audio, since it's a gesture)
    var phone = stage.querySelector(".video-phone");
    if (phone) {
      phone.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        // clicks on the <video> itself belong to the native controls —
        // intercepting them re-plays right after the user hits pause
        if (e.target === v || v.contains(e.target)) return;
        if (v.paused) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {/* error event handles it */});
        }
      });
    }

    v.addEventListener("error", showTrouble);
    v.addEventListener("stalled", function () { setTimeout(maybeTrouble, 1500); });
    function maybeTrouble() { if (v.readyState < 2 && !v.error) showTrouble(); }
    function showTrouble() {
      note(
        "Can't play here. If you're previewing with <code>python -m http.server</code>, " +
        "Safari needs byte-range support — run <code>python3 serve.py</code> instead, or " +
        "<a href=\"assets/video/Peregrine_Intro_720.mp4\">open the video directly</a>."
      );
    }
  })();

  /* --- ambient background videos (CTA + section backdrops): they ship
     without autoplay so the multi-MB files aren't fetched on page load.
     Start them when they approach the viewport; pause off-screen. --- */
  (function () {
    var vids = [].slice.call(document.querySelectorAll(".cta__video, .pe-bg-video"));
    if (!vids.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    function start(v) {
      v.preload = "auto";
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    if (!("IntersectionObserver" in window)) { vids.forEach(start); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { if (en.target.paused) start(en.target); }
        else if (!en.target.paused) en.target.pause();
      });
    }, { rootMargin: "600px 0px" });
    vids.forEach(function (v) { io.observe(v); });
  })();

  /* --- year --- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
