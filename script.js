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

  window.__peInitDriftWheel = function () {
    var host = document.getElementById("driftWheel");
    if (!host || host.querySelector("svg")) return;
    var readout = document.getElementById("driftReadout");
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "-14 -14 388 388");
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

    var idleTimer = null, interacted = false;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function show(i) {
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

  /* --- carousels (drills + targets) --- */
  function initCarousel(car) {
    var track = car.querySelector(".carousel__track");
    var clones = track ? track.querySelectorAll("[data-carousel-clone]") : [];
    var slides = track ? Array.prototype.slice.call(track.querySelectorAll(".carousel__slide:not([data-carousel-clone])")) : [];
    var dotsWrap = car.querySelector(".carousel__dots");
    var prev = car.querySelector(".carousel__arrow--prev");
    var next = car.querySelector(".carousel__arrow--next");
    if (!track || slides.length < 2) return;
    var readyKey = slides.length + ":loop";
    if (car.getAttribute("data-pe-carousel-ready") === readyKey && clones.length === 2) return;
    clones.forEach(function (clone) { clone.remove(); });
    car.setAttribute("data-pe-carousel-ready", readyKey);
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
  }
  window.__peInitCarousels = function (root) {
    (root || document).querySelectorAll("[data-carousel]").forEach(initCarousel);
  };
  window.__peInitCarousels(document);

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
