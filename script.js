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
