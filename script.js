/* Peregrine — site interactions
   Small, dependency-free. Everything degrades gracefully without JS. */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     CONFIG — edit these
     ---------------------------------------------------------- */
  var CONFIG = {
    // Where launch-list signups go.
    notifyEmail: "tylerjbeattie@gmail.com",
    // OPTIONAL: paste a Formspree / Getform / Basin endpoint URL here to collect
    // emails silently in your inbox. If left blank, the form opens the visitor's
    // email app addressed to notifyEmail instead.
    formEndpoint: ""
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
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* --- stat band count-up (re-runs on every pass through the viewport) --- */
  (function () {
    var band = document.getElementById("measure");
    if (!band || reduce || !("IntersectionObserver" in window)) return;
    var targets = []; // captured once from the markup: {node, value, decimals}
    band.querySelectorAll(".chip__num").forEach(function (numEl) {
      var textNode = numEl.firstChild; // number text; <small> suffix stays put
      if (!textNode || textNode.nodeType !== 3) return;
      var value = parseFloat(textNode.textContent);
      if (isNaN(value)) return;
      targets.push({ node: textNode, value: value, decimals: (textNode.textContent.split(".")[1] || "").length });
    });
    if (!targets.length) return;
    var gen = 0;
    function runTicker() {
      var myGen = ++gen;
      targets.forEach(function (t) {
        var t0 = performance.now(), dur = 900;
        function tick(now) {
          if (myGen !== gen) return; // superseded by a newer pass
          var p = Math.min(1, (now - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          t.node.textContent = (t.value * eased).toFixed(t.decimals);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }
    var visible = false;
    var io = new IntersectionObserver(function (entries) {
      var nowVisible = entries.some(function (e) { return e.isIntersecting; });
      if (nowVisible && !visible) runTicker(); // fires on every entry, any direction
      visible = nowVisible;
    }, { threshold: 0.4 });
    io.observe(band);
  })();

  /* --- hero laser ping: click anywhere in the hero to dry-fire --- */
  (function () {
    var hero = document.getElementById("hero");
    if (!hero) return;
    var shots = 0;
    var heroScoreLabels = ["+1", "+2", "+3", "+4", "+5"];
    function heroClickScore(x, y, r) {
      var reticleCenterX = r.width * 0.64;
      var reticleCenterY = r.height * 0.46;
      var reticleRadius = 115;
      var laserBullseyeRadius = 18;
      var dx = x - reticleCenterX;
      var dy = y - reticleCenterY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= laserBullseyeRadius) return heroScoreLabels[4];
      var closeness = 1 - Math.min(1, Math.max(0, (distance - laserBullseyeRadius) / (reticleRadius - laserBullseyeRadius)));
      var score = Math.max(1, Math.min(4, Math.ceil(closeness * 4)));
      return heroScoreLabels[score - 1];
    }
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
        chip.textContent = heroClickScore(x, y, r);
        chip.style.left = (x + 18) + "px"; chip.style.top = (y - 14) + "px";
        hero.appendChild(chip);
        setTimeout(function () { chip.remove(); }, 1100);
      }
    });

    /* the signup CTA is a range too — dry-fire at it */
    var ctaSec = document.querySelector(".cta");
    if (ctaSec) ctaSec.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a,button,input,form,.signup,img")) return;
      var r = ctaSec.getBoundingClientRect();
      var ping = document.createElement("span");
      ping.className = "laser-ping" + (reduce ? " laser-ping--static" : "");
      ping.style.left = (e.clientX - r.left) + "px";
      ping.style.top = (e.clientY - r.top) + "px";
      ctaSec.appendChild(ping);
      setTimeout(function () { ping.remove(); }, 1600);
    });
  })();

  /* --- per-section entrance effects (added via the Customize panel) ---
     Exposed so the editor can re-observe newly-animated sections live. Works
     on the published export too, since this runs without the editor present. */
  function observeAnims() {
    var els = document.querySelectorAll("[data-pe-anim]:not(.pe-in)");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("pe-in"); });
      return;
    }
    var ao = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("pe-in"); ao.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { ao.observe(el); });
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
        // silent collection into your inbox
        var data = new FormData();
        data.append("email", value);
        data.append("_subject", "New Peregrine launch-list signup");
        fetch(CONFIG.formEndpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: data
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

  /* --- hero cosmos: drifting ember particle field --- */
  (function cosmos() {
    var canvas = document.getElementById("cosmos");
    var hero = document.getElementById("hero");
    if (!canvas || !hero) return;
    var ctx = canvas.getContext("2d");
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, parts = [], raf = null;

    function build() {
      parts = [];
      var density = window.__peCosmos || 1;
      var n = Math.round(Math.min(140, (W * H) / 12000) * density);
      var cx = W * 0.64, cy = H * 0.46;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2;
        var r = Math.random() * Math.max(W, H) * 0.62;
        parts.push({
          x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a: a,
          sp: 0.05 + Math.random() * 0.22, s: 0.4 + Math.random() * 1.7,
          o: 0.12 + Math.random() * 0.5, tw: Math.random() * Math.PI * 2
        });
      }
    }
    function size() {
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
    }
    function dot(p, tw) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(255," + (150 + Math.floor(60 * tw)) + ",95," + (p.o * tw).toFixed(3) + ")";
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
    }
    function staticDraw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) dot(parts[i], 0.8);
    }
    function frame() {
      var cx = W * 0.64, cy = H * 0.46;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += Math.cos(p.a) * p.sp; p.y += Math.sin(p.a) * p.sp; p.tw += 0.03;
        if (p.x < -24 || p.x > W + 24 || p.y < -24 || p.y > H + 24) {
          p.x = cx + (Math.random() - 0.5) * 50; p.y = cy + (Math.random() - 0.5) * 50;
          p.a = Math.random() * Math.PI * 2;
        }
        dot(p, Math.sin(p.tw) * 0.3 + 0.7);
      }
      raf = requestAnimationFrame(frame);
    }

    size();
    if (reduce) {
      staticDraw();
    } else {
      raf = requestAnimationFrame(frame);
    }
    // let the Customize panel re-tune density live
    window.__peCosmosRebuild = function () {
      if (raf) cancelAnimationFrame(raf);
      build();
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
    if (!host || host.getAttribute("data-pe-drift-ready") === "true") return;
    var readout = document.getElementById("driftReadout");
    host.textContent = "";
    host.setAttribute("data-pe-drift-ready", "true");
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
    show(6, false); // start on the classic 6 o'clock flinch
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
    if (car.getAttribute("data-pe-carousel-ready") === readyKey && (isPhoneCarousel || clones.length === 2)) return;
    clones.forEach(function (clone) { clone.remove(); });
    car.setAttribute("data-pe-carousel-ready", readyKey);
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
  function setupInteractionVars(el, cfg) {
    var duration = Math.max(100, Math.min(5000, parseInt(cfg.duration || 650, 10)));
    var delay = Math.max(0, Math.min(3000, parseInt(cfg.delay || 0, 10)));
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
  }
  function runInteraction(el, cfg) {
    cfg = cfg || parseInteraction(el);
    setupInteractionVars(el, cfg);
    el.classList.remove("pe-ix-run");
    void el.offsetWidth;
    el.classList.add("pe-ix-run");
    var duration = Math.max(100, Math.min(5000, parseInt(cfg.duration || 650, 10)));
    var delay = Math.max(0, Math.min(3000, parseInt(cfg.delay || 0, 10)));
    if (cfg.repeat === "loop") {
      el.style.animationIterationCount = "infinite";
    } else {
      el.style.animationIterationCount = "1";
      window.setTimeout(function () { el.classList.remove("pe-ix-run"); }, duration + delay + 80);
    }
  }
  function initInteractions(root) {
    var els = (root || document).querySelectorAll("[data-pe-interaction]");
    els.forEach(function (el) {
      var cfg = parseInteraction(el);
      setupInteractionVars(el, cfg);
      el.classList.remove("pe-ix-pending", "pe-ix-in", "pe-ix-run");
      el.onmouseenter = null;
      el.onclick = null;
      if (reduce) {
        el.classList.add("pe-ix-in");
        return;
      }
      if (cfg.trigger === "hover") {
        el.onmouseenter = function () { runInteraction(el, cfg); };
      } else if (cfg.trigger === "click") {
        el.onclick = function () { runInteraction(el, cfg); };
      } else if (cfg.trigger === "load") {
        window.setTimeout(function () { runInteraction(el, cfg); }, Math.max(0, parseInt(cfg.delay || 0, 10)));
      } else {
        el.classList.add("pe-ix-pending");
        if (!("IntersectionObserver" in window)) {
          el.classList.add("pe-ix-in");
          return;
        }
        var ixObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("pe-ix-in");
              if (cfg.repeat !== "replay") ixObserver.unobserve(entry.target);
            } else if (cfg.repeat === "replay") {
              entry.target.classList.remove("pe-ix-in");
            }
          });
        }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
        ixObserver.observe(el);
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

  /* --- year --- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
