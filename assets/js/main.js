/* =========================================================================
   Abdullah Al Noman · Portfolio interactions
   GSAP 3 + ScrollTrigger + Lenis smooth scroll.

   Part 1 always runs (menu, music, filters, FAQ, copy email, etc.).
   Part 2 only runs when GSAP is present AND the visitor has not asked for
   reduced motion. Without it, the page is fully usable and static.
   ========================================================================= */
(function () {
  "use strict";

  var doc = document.documentElement;
  var body = document.body;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var animate = hasGSAP && !reduce;
  var lenis = null;

  /* =======================================================================
     PART 1 · ALWAYS ON
     ===================================================================== */

  /* ---------- year + Dhaka clock ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  function tickClock() {
    var t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" }).format(new Date());
    $$("[data-clock]").forEach(function (el) { el.textContent = t + " local"; });
  }
  tickClock();
  setInterval(tickClock, 30000);

  var hint = $(".work__hint");
  if (hint && window.innerWidth <= 900) hint.firstChild.textContent = "Swipe to explore ";

  /* ---------- background music (kept from the previous site) ---------- */
  var musicBtn = $("#music-toggle");
  var audio = $("#bg-audio");
  if (musicBtn && audio) {
    audio.volume = 0.5;
    musicBtn.addEventListener("click", function () {
      if (audio.paused) {
        var p = audio.play();
        if (p && p.catch) p.catch(function () { setMusic(false); });
        setMusic(true);
      } else {
        audio.pause();
        setMusic(false);
      }
    });
  }
  function setMusic(on) {
    musicBtn.setAttribute("aria-pressed", on ? "true" : "false");
    musicBtn.setAttribute("aria-label", on ? "Pause background music" : "Play background music");
  }

  /* ---------- mobile menu ---------- */
  var burger = $(".nav__burger");
  var menu = $("#menu");
  var menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", !open);
    if (animate) {
      gsap.killTweensOf(menu);
      if (open) {
        gsap.set(menu, { visibility: "visible" });
        gsap.to(menu, { clipPath: "inset(0 0 0% 0)", duration: 0.8, ease: "expo.inOut" });
        gsap.fromTo($$(".menu__links a", menu), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.8, delay: 0.3, ease: "expo.out" });
      } else {
        gsap.to(menu, { clipPath: "inset(0 0 100% 0)", duration: 0.7, ease: "expo.inOut", onComplete: function () { gsap.set(menu, { visibility: "hidden" }); } });
      }
    } else {
      menu.style.visibility = open ? "visible" : "hidden";
      menu.style.clipPath = open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)";
    }
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  if (burger && menu) burger.addEventListener("click", function () { setMenu(!menuOpen); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menuOpen) setMenu(false); });

  /* ---------- smooth scroll (Lenis) ---------- */
  if (animate && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else if (typeof target === "number") window.scrollTo({ top: target, behavior: reduce ? "auto" : "smooth" });
    else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      var wasOpen = menuOpen;
      if (menuOpen) setMenu(false);
      setTimeout(function () { scrollToTarget(target); }, wasOpen ? 380 : 0);
      try { history.replaceState(null, "", id); } catch (err) { /* sandboxed frames */ }
    });
  });
  $$("[data-scrolltop]").forEach(function (b) { b.addEventListener("click", function () { scrollToTarget(0); }); });

  /* ---------- header: hide on scroll down, highlight the current section ---------- */
  var nav = $(".nav");
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    if (!menuOpen) nav.classList.toggle("is-hidden", y > lastY && y > 500);
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var navLinks = $$(".nav__links a");
  if ("IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id === "projects" ? "work" : en.target.id;
        navLinks.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["home", "about", "services", "work", "projects", "resume", "faq", "contact"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) navIO.observe(s);
    });
  }

  /* ---------- copy email ---------- */
  $$("[data-copy]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      if (!navigator.clipboard) return;
      e.preventDefault();
      var label = $(".crow__a", el);
      navigator.clipboard.writeText(el.dataset.copy).then(function () {
        var old = label.textContent;
        label.textContent = "Copied!";
        setTimeout(function () { label.textContent = old; }, 1800);
      }, function () { window.location.href = el.getAttribute("href"); });
    });
  });

  /* ---------- project index filter ---------- */
  var filters = $$(".pfilter");
  var rows = $$(".prow");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.dataset.filter;
      filters.forEach(function (b) { var on = b === btn; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on); });
      var show = rows.filter(function (r) { return f === "all" || r.dataset.cat === f; });
      rows.forEach(function (r) { r.classList.toggle("is-hidden", show.indexOf(r) === -1); });
      if (animate) {
        gsap.fromTo(show, { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.6, ease: "power3.out", clearProps: "transform,opacity" });
        ScrollTrigger.refresh();
      }
    });
  });

  /* ---------- FAQ: smooth open / close (native <details> without JS) ---------- */
  $$(".faq__item").forEach(function (item) {
    var summary = $("summary", item);
    var panel = $(".faq__a", item);
    summary.addEventListener("click", function (e) {
      if (!animate) return;
      e.preventDefault();
      if (item.open) {
        gsap.to(panel, { height: 0, duration: 0.5, ease: "power3.inOut", onComplete: function () { item.open = false; gsap.set(panel, { clearProps: "height" }); refresh(); } });
      } else {
        item.open = true;
        gsap.fromTo(panel, { height: 0 }, { height: "auto", duration: 0.6, ease: "power3.out", onComplete: function () { gsap.set(panel, { clearProps: "height" }); refresh(); } });
      }
    });
  });

  /* ---------- project cards: scroll the full-page screenshot on hover ---------- */
  if (finePointer) {
    $$(".pcard").forEach(function (card) {
      var full = $(".pcard__full", card);
      var media = $(".pcard__media", card);
      if (!full || !media) return;
      var timer;
      function setDur() {
        var ratio = full.naturalHeight && full.naturalWidth ? full.naturalHeight / full.naturalWidth : 4;
        card.style.setProperty("--dur", Math.min(9, Math.max(3, ratio * 1.1)).toFixed(1) + "s");
      }
      card.addEventListener("mouseenter", function () {
        if (!full.getAttribute("src")) {
          full.addEventListener("load", setDur, { once: true });
          full.src = full.dataset.src;
        }
        clearTimeout(timer);
        timer = setTimeout(function () { card.classList.add("is-scrolling"); }, 120);
      });
      card.addEventListener("mouseleave", function () { clearTimeout(timer); card.classList.remove("is-scrolling"); });
    });
  }

  function refresh() { if (hasGSAP) ScrollTrigger.refresh(); }

  /* ---------- stop here without GSAP or with reduced motion ---------- */
  if (!animate) {
    var ld = $(".loader");
    if (ld) ld.remove();
    return;
  }

  /* =======================================================================
     PART 2 · MOTION (GSAP + ScrollTrigger)
     ===================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  doc.classList.add("anim");
  body.classList.add("is-loading");
  if (lenis) lenis.stop();

  var isDesk = window.matchMedia("(min-width: 901px)").matches;
  var small = !isDesk;

  /* ---------- split titles into masked characters ----------
     Keeps nested elements (like the italic serif word) intact and gives the
     heading an aria-label so screen readers still hear whole words. */
  function splitChars(root) {
    if (root.dataset.split) return;
    root.dataset.split = "1";
    if (!root.hasAttribute("aria-label") && !root.closest("[aria-label]")) root.setAttribute("aria-label", root.textContent.replace(/\s+/g, " ").trim());
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1) { walk(n); return; }
        if (n.nodeType !== 3 || !n.textContent.trim()) return;
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span");
          w.className = "w";
          w.setAttribute("aria-hidden", "true");
          part.split("").forEach(function (ch) {
            var c = document.createElement("span");
            c.className = "c";
            c.textContent = ch;
            w.appendChild(c);
          });
          frag.appendChild(w);
        });
        node.replaceChild(frag, n);
      });
    })(root);
  }
  $$(".split").forEach(splitChars);
  // the contact title holds two split rows: label the heading as a whole
  var ct = $(".contact__title");
  if (ct) ct.setAttribute("aria-label", "Have a project? Let's build it.");

  /* ---------- reveal engine ----------
     Checks real positions every scroll frame, so nothing can stay hidden
     because of stale trigger positions (lazy images, fonts, pinned sections). */
  var pending = [];
  function whenVisible(el, fn, line) { if (el) pending.push({ el: el, fn: fn, line: line || 0.9 }); }
  function checkPending() {
    if (!pending.length || body.classList.contains("is-loading")) return;
    var vh = window.innerHeight, n = 0;
    pending = pending.filter(function (p) {
      if (p.el.getBoundingClientRect().top < vh * p.line) { p.fn(Math.min(n++, 5) * 0.08); return false; }
      return true;
    });
  }
  var queued = false;
  function queueCheck() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; checkPending(); }); }
  window.addEventListener("scroll", queueCheck, { passive: true });
  window.addEventListener("resize", queueCheck);

  /* ---------- hero start state ---------- */
  var heroWords = $$(".hero__word");
  gsap.set(heroWords, { yPercent: 70, opacity: 0 });
  gsap.set(".hero__portrait img", { yPercent: 28, opacity: 0 });
  gsap.set(".tile", { opacity: 0, scale: 0.6 });
  gsap.set([".hero__intro > *", ".hero__actions > *", ".hero__note", ".nav"], { opacity: 0, y: 24 });

  /* ---------- preloader → intro ---------- */
  var loader = $(".loader");
  var num = $(".loader__num");
  var counter = { v: 0 };
  var imgReady = new Promise(function (res) {
    var im = $(".hero__portrait img");
    if (!im || im.complete) return res();
    im.addEventListener("load", res);
    im.addEventListener("error", res);
    setTimeout(res, 2500);
  });
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var loadTl = gsap.timeline();
  loadTl.from(".loader__name span", { yPercent: 100, opacity: 0, stagger: 0.1, duration: 0.9, ease: "expo.out" })
    .to(counter, { v: 100, duration: 1.3, ease: "power2.inOut", onUpdate: function () { num.textContent = Math.round(counter.v); } }, 0)
    .to(".loader__bar span", { scaleX: 1, duration: 1.3, ease: "power2.inOut" }, 0);

  Promise.all([new Promise(function (r) { loadTl.eventCallback("onComplete", r); }), imgReady, fontsReady]).then(intro);

  function intro() {
    var tl = gsap.timeline({
      onComplete: function () {
        body.classList.remove("is-loading");
        if (lenis) lenis.start();
        if (loader) loader.remove();
        ScrollTrigger.refresh();
        checkPending();
      }
    });
    tl.to(".loader__inner, .loader__bar", { opacity: 0, y: -30, duration: 0.5, ease: "power2.in" })
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1.05, ease: "expo.inOut" }, "-=.1")
      .to(heroWords, { yPercent: 0, opacity: 1, duration: 1.3, stagger: 0.12, ease: "expo.out" }, "-=.55")
      .to(".hero__portrait img", { yPercent: 0, opacity: 1, duration: 1.5, ease: "expo.out", clearProps: "transform" }, "-=1.1")
      .to(".tile", { opacity: 1, scale: 1, duration: 0.9, stagger: { each: 0.05, from: "random" }, ease: "back.out(1.7)", clearProps: "scale" }, "-=1.1")
      .to([".nav", ".hero__intro > *", ".hero__actions > *", ".hero__note"], { opacity: 1, y: 0, stagger: 0.07, duration: 1.1, ease: "expo.out", clearProps: "transform" }, "-=1");
  }

  /* ---------- scroll progress ---------- */
  gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { trigger: body, start: "top top", end: "bottom bottom", scrub: 0.3 } });

  /* ---------- hero: pinned scroll parallax (desktop) ----------
     The portrait rises, the name lifts while its outlined echoes fan out
     below it, and the tool tiles fly off one after another. */
  function heroParallax() {
    var stage = $(".hero__stage");
    if (!stage) return null;
    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=110%", pin: stage, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true }
    });
    tl.fromTo(".hero__portrait", { yPercent: 12, scale: 0.95 }, { yPercent: -4, scale: 1.04, duration: 1 }, 0)
      .fromTo(".hero__name", { yPercent: 0, scale: 1 }, { yPercent: -28, scale: 0.94, duration: 1 }, 0)
      .to(".hero__glow", { scale: 1.3, opacity: 0.5, duration: 1 }, 0)
      .to(".hero__grid", { yPercent: -12, opacity: 0, duration: 1 }, 0)
      .to(".hero__note", { opacity: 0, y: -30, duration: 0.3 }, 0.1)
      .to(".hero__bar", { opacity: 0, y: 40, duration: 0.45 }, 0.55);
    $$(".hero__echo").forEach(function (el, i) {
      tl.fromTo(el, { yPercent: 0, opacity: 0 }, { yPercent: (i + 1) * 34, opacity: 0.9 - i * 0.25, duration: 0.8 }, 0.05 + i * 0.06);
    });
    // Tiles leave up and to the left, front tiles first, at slightly uneven speeds.
    function seeded(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
    var sr = stage.getBoundingClientRect();
    var tiles = $$(".tile");
    var ang = 60 * Math.PI / 180, ux = -Math.cos(ang), uy = -Math.sin(ang);
    var rects = tiles.map(function (el) { return el.getBoundingClientRect(); });
    var lowest = Math.max.apply(null, rects.map(function (r) { return r.bottom; })) - sr.top;
    var dist = (lowest + 180) / -uy;
    var order = tiles.map(function (el, i) {
      var r = rects[i];
      return { el: el, lead: (r.left + r.width / 2) * ux + (r.top + r.height / 2) * uy };
    }).sort(function (p, q) { return q.lead - p.lead; });
    var start = 0, dur = 0.62;
    order.forEach(function (o, k) {
      if (k) { start += 0.008 + seeded(k + 7) * 0.03; dur = Math.min(1 - start, dur + seeded(k + 17) * 0.035); }
      tl.fromTo(o.el, { x: 0, y: 0 }, { x: dist * ux, y: dist * uy, duration: dur, ease: "power1.in" }, start);
      tl.fromTo($(".tile__face", o.el), { opacity: 1 }, { opacity: 0, duration: dur * 0.3 }, start + dur * 0.7);
    });
    return tl;
  }
  gsap.matchMedia().add("(min-width: 901px)", function () {
    var tl = heroParallax();
    return function () {
      if (tl) { if (tl.scrollTrigger) tl.scrollTrigger.kill(true); tl.kill(); }
      gsap.set([".hero__portrait", ".hero__name", ".hero__echo", ".tile", ".tile__face", ".hero__bar", ".hero__glow", ".hero__grid", ".hero__note"], { clearProps: "transform,opacity" });
    };
  });

  /* hero glow and portrait lean toward the pointer */
  if (finePointer) {
    var glow = $(".hero__glow");
    var gx = gsap.quickTo(glow, "x", { duration: 1.4, ease: "power3" });
    var gy = gsap.quickTo(glow, "y", { duration: 1.4, ease: "power3" });
    var nameX = gsap.quickTo(".hero__name", "x", { duration: 1.6, ease: "power3" });
    $(".hero").addEventListener("mousemove", function (e) {
      var dx = e.clientX - window.innerWidth / 2, dy = e.clientY - window.innerHeight / 2;
      gx(dx * 0.35); gy(dy * 0.35); nameX(dx * -0.02);
    });
  }

  /* ---------- section titles: character reveal ---------- */
  $$(".split").forEach(function (t) {
    var cs = $$(".c", t);
    gsap.set(cs, { yPercent: 115 });
    whenVisible(t, function () { gsap.to(cs, { yPercent: 0, duration: 1.15, stagger: 0.022, ease: "power3.out", onComplete: function () { t.classList.add("is-revealed"); } }); }, 0.92);
  });

  /* ---------- generic reveals (phones get a plain fade) ---------- */
  $$("[data-reveal]").forEach(function (el) {
    whenVisible(el, function (d) {
      el.classList.add("is-in");
      if (small) gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "sine.out" });
      else gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, delay: d * 1.5, duration: 1.2, ease: "power3.out", clearProps: "transform" });
    }, small ? 1.05 : 0.9);
  });

  /* handwritten notes pop in, eyebrows slide in */
  $$(".hand").forEach(function (n) {
    if (n.closest(".hero")) return;
    gsap.set(n, small ? { opacity: 0 } : { opacity: 0, scale: 0.6 });
    whenVisible(n, function () {
      gsap.to(n, small ? { opacity: 1, duration: 0.9, delay: 0.2 } : { opacity: 1, scale: 1, duration: 1, delay: 0.25, ease: "back.out(1.6)", clearProps: "scale" });
    }, 0.92);
  });
  $$(".eyebrow").forEach(function (e) {
    if (e.closest(".hero")) return;
    gsap.set(e, { opacity: 0, x: -16 });
    whenVisible(e, function () { gsap.to(e, { opacity: 1, x: 0, duration: 1, ease: "power3.out" }); }, 0.94);
  });

  /* ---------- page theme: light while a light section fills the middle of the screen ---------- */
  var lightSecs = $$('[data-theme="light"]');
  function themeCheck() {
    var mid = window.innerHeight * 0.5, light = false;
    for (var i = 0; i < lightSecs.length; i++) {
      var r = lightSecs[i].getBoundingClientRect();
      if (r.top < mid && r.bottom > mid) { light = true; break; }
    }
    if (light !== doc.classList.contains("is-light")) doc.classList.toggle("is-light", light);
  }

  /* ---------- about statement: words sharpen from blurred as you scroll ---------- */
  var blurSets = $$(".blur-words").map(function (el) {
    var words = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span");
          w.className = "word";
          w.textContent = part;
          frag.appendChild(w);
          words.push(w);
        });
        el.replaceChild(frag, n);
      } else if (n.nodeType === 1) { n.classList.add("word"); words.push(n); }
    });
    return { el: el, words: words, last: [] };
  });
  function blurCheck() {
    var vh = window.innerHeight;
    blurSets.forEach(function (b) {
      var r = b.el.getBoundingClientRect();
      var P = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (r.height + vh * 0.4)));
      var n = b.words.length, k = 6;
      b.words.forEach(function (w, i) {
        var v = Math.round(Math.min(1, Math.max(0, (P * (n + k) - i) / k)) * 100) / 100;
        if (b.last[i] !== v) { b.last[i] = v; w.style.setProperty("--p", v); }
      });
    });
  }
  var frameQueued = false;
  function onFrame() { frameQueued = false; themeCheck(); blurCheck(); }
  function queueFrame() { if (!frameQueued) { frameQueued = true; requestAnimationFrame(onFrame); } }
  window.addEventListener("scroll", queueFrame, { passive: true });
  window.addEventListener("resize", queueFrame);
  onFrame();

  /* ---------- counters ---------- */
  $$("[data-count]").forEach(function (el) {
    var end = parseInt(el.dataset.count, 10);
    var o = { v: 0 };
    el.textContent = "0";
    whenVisible(el, function () { gsap.to(o, { v: end, duration: 1.8, ease: "power3.out", onUpdate: function () { el.textContent = Math.round(o.v); } }); }, 0.95);
  });

  /* ---------- marquee: endless loop that speeds up and skews with scroll velocity ---------- */
  var track = $(".marquee__track");
  if (track) {
    var loop = gsap.to(track, { xPercent: -50, ease: "none", duration: 28, repeat: -1 });
    var dir = 1;
    ScrollTrigger.create({
      trigger: ".marquee", start: "top bottom", end: "bottom top",
      onUpdate: function (self) {
        var v = self.getVelocity();
        if (v !== 0) dir = v > 0 ? 1 : -1;
        var boost = 1 + Math.min(Math.abs(v) / 300, 5);
        gsap.to(loop, { timeScale: dir * boost, duration: 0.2, overwrite: true, onComplete: function () { gsap.to(loop, { timeScale: dir, duration: 1.2, ease: "power2.out" }); } });
        gsap.to(".marquee__item", { skewX: gsap.utils.clamp(-8, 8, v / -250), duration: 0.4, overwrite: true });
      }
    });
  }

  /* ---------- services rows: staggered icon spin on reveal ---------- */
  $$(".svc__icon").forEach(function (ic) {
    gsap.set(ic, { rotate: -90, scale: 0.6 });
    whenVisible(ic, function (d) { gsap.to(ic, { rotate: 0, scale: 1, delay: d, duration: 1, ease: "back.out(1.8)" }); }, 0.92);
  });

  /* ---------- work: horizontal pinned scroll (desktop) ---------- */
  var mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", function () {
    var pin = $(".work__pin");
    var tr = $(".work__track");
    var cards = $$(".pcard", tr);
    var dist = function () { return Math.max(0, tr.scrollWidth - window.innerWidth); };
    var tween = gsap.to(tr, {
      x: function () { return -dist(); }, ease: "none",
      scrollTrigger: { trigger: pin, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    // each screenshot drifts inside its frame as the track moves
    $$(".pcard__cover", tr).forEach(function (img) {
      gsap.fromTo(img, { xPercent: -5 }, { xPercent: 5, ease: "none", scrollTrigger: { trigger: img.closest(".pcard"), containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
    });
    // cards rise in with a clip reveal
    gsap.set(cards, { y: 70, opacity: 0 });
    gsap.set($$(".pcard__media", tr), { clipPath: "inset(18% 0 0 0 round 22px)" });
    whenVisible(pin, function () {
      gsap.to(cards, { y: 0, opacity: 1, stagger: 0.1, duration: 1.3, ease: "power3.out" });
      gsap.to($$(".pcard__media", tr), { clipPath: "inset(0% 0 0 0 round 22px)", stagger: 0.1, duration: 1.4, ease: "expo.out" });
    }, 0.8);
    return function () { gsap.set(cards.concat($$(".pcard__media", tr)), { clearProps: "all" }); };
  });

  /* ---------- project index: floating preview follows the pointer ---------- */
  var preview = $(".preview");
  if (preview && finePointer) {
    var pimg = $("img", preview);
    var plist = $(".plist");
    var px = gsap.quickTo(preview, "x", { duration: 0.45, ease: "power3" });
    var py = gsap.quickTo(preview, "y", { duration: 0.45, ease: "power3" });
    var mx = -999, my = -999, lastRot = 0, shown = false, curRow = null;
    var cache = {};
    function warm() {
      rows.forEach(function (r) {
        var src = r.dataset.img;
        if (!src || cache[src]) return;
        var im = new Image(); im.decoding = "async"; im.src = src; cache[src] = im;
      });
    }
    if ("requestIdleCallback" in window) requestIdleCallback(warm, { timeout: 3000 }); else setTimeout(warm, 1500);
    function showFor(row) {
      curRow = row;
      if (pimg.getAttribute("src") !== row.dataset.img) pimg.src = row.dataset.img;
      if (!shown) { shown = true; gsap.to(preview, { opacity: 1, scale: 1, duration: 0.35, ease: "expo.out", overwrite: "auto" }); }
    }
    function hidePreview() {
      curRow = null;
      if (!shown) return;
      shown = false;
      gsap.to(preview, { opacity: 0, scale: 0.6, duration: 0.35, ease: "power3.out", overwrite: "auto" });
    }
    function rowAt(x, y) {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].classList.contains("is-hidden")) continue;
        var r = rows[i].getBoundingClientRect();
        if (y >= r.top && y < r.bottom && x >= r.left && x <= r.right) return rows[i];
      }
      return null;
    }
    function check() {
      var row = rowAt(mx, my);
      if (row) { if (row !== curRow || !shown) showFor(row); } else hidePreview();
    }
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      var dx = mx - (gsap.getProperty(preview, "x") || 0);
      px(mx); py(my);
      var rot = gsap.utils.clamp(-12, 12, dx * 0.04);
      if (Math.abs(rot - lastRot) > 0.5) { gsap.to(preview, { rotation: rot, duration: 0.5 }); lastRot = rot; }
      check();
    }, { passive: true });
    window.addEventListener("scroll", function () { if (mx > -999) check(); }, { passive: true });
    if (plist) plist.addEventListener("mouseleave", hidePreview);
    document.addEventListener("mouseleave", hidePreview);
    window.addEventListener("blur", hidePreview);
    filters.forEach(function (b) { b.addEventListener("click", hidePreview); });
  }
  rows.forEach(function (r) {
    gsap.set(r, { y: 30, opacity: 0 });
    whenVisible(r, function (d) { gsap.to(r, { y: 0, opacity: 1, delay: d * 1.5, duration: 1.1, ease: "power3.out", clearProps: "transform,opacity" }); }, 0.94);
  });

  /* ---------- resume: timeline line draws as you scroll ---------- */
  $$(".timeline").forEach(function (t) {
    gsap.to($(".timeline__line i", t), { scaleY: 1, ease: "none", scrollTrigger: { trigger: t, start: "top 75%", end: "bottom 60%", scrub: true } });
  });

  /* ---------- off screen: photo burst ----------
     1. Canvas loop (inspired by GreenSock's "Canvas particles" pen): small
        spinning photo particles keep flying out from the centre while the
        section is on screen.
     2. Scroll: the stage pins, the real photos burst out from behind the
        heading with a spin, then settle as tilted polaroids. */
  var burstSec = $("[data-burst]");
  if (burstSec) {
    var bStage = $(".burst__stage", burstSec);
    var bItems = $$(".burst__item", burstSec);

    // 1 · canvas particles
    var cvs = $(".burst__canvas", burstSec), ctx = cvs.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1), cw = 0, ch = 0;
    function sizeCanvas() {
      cw = bStage.clientWidth; ch = bStage.clientHeight;
      cvs.width = cw * dpr; cvs.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);
    var srcs = bItems.map(function (it) { return $("img", it).getAttribute("src"); });
    var pics = srcs.map(function (src) { var im = new Image(); im.decoding = "async"; im.src = src; return im; });
    var parts = [];
    var COUNT = window.innerWidth < 700 ? 22 : 40;
    for (var pi = 0; pi < COUNT; pi++) {
      var pt = { x: 0, y: 0, scale: 0, rotate: 0, img: pics[pi % pics.length] };
      parts.push(pt);
      var ang = Math.random() * Math.PI * 2;
      pt.tl = gsap.timeline({ repeat: -1, paused: true });
      pt.tl.fromTo(pt, { x: 0, y: 0, scale: 0, rotate: gsap.utils.random(-90, 90) },
          { x: function () { return Math.cos(ang) * Math.max(cw, ch) * 0.75; }, y: function () { return Math.sin(ang) * Math.max(cw, ch) * 0.75; },
            scale: gsap.utils.random(0.6, 1.3), rotate: "+=" + gsap.utils.random(-360, 360), duration: gsap.utils.random(4, 7), ease: "power1.in" });
      pt.tl.progress(Math.random());                         // start each particle mid-flight
    }
    function drawParts() {
      ctx.clearRect(0, 0, cw, ch);
      parts.forEach(function (pt) {
        var im = pt.img;
        if (!im.complete || !im.naturalWidth || pt.scale <= 0.01) return;
        var w = 64 * pt.scale, h = w * 1.25;
        ctx.save();
        ctx.translate(cw / 2 + pt.x, ch / 2 + pt.y);
        ctx.rotate(pt.rotate * Math.PI / 180);
        ctx.globalAlpha = Math.min(1, pt.scale);
        ctx.drawImage(im, -w / 2, -h / 2, w, h);
        ctx.restore();
      });
    }
    var partsOn = false;
    function setParts(on) {
      if (on === partsOn) return;
      partsOn = on;
      parts.forEach(function (pt) { on ? pt.tl.play() : pt.tl.pause(); });
      on ? gsap.ticker.add(drawParts) : gsap.ticker.remove(drawParts);
    }
    ScrollTrigger.create({ trigger: burstSec, start: "top bottom", end: "bottom top", onToggle: function (st) { setParts(st.isActive); } });

    // 2 · scroll: burst out, then settle as polaroids
    // phones: no room beside the heading, so the polaroids sit in rows above and below it
    var MOBILE_SPOTS = [[-32, -40], [0, -42], [32, -39], [-33, -25], [0, -27], [33, -24], [-32, 28], [0, 30], [32, 27], [-20, 43], [20, 44]];
    function applySpots() {
      var m = window.innerWidth < 700;
      bItems.forEach(function (it, i) {
        if (!it.dataset.dx) { it.dataset.dx = it.style.getPropertyValue("--x"); it.dataset.dy = it.style.getPropertyValue("--y"); }
        var sp = m && MOBILE_SPOTS[i];
        it.style.setProperty("--x", sp ? sp[0] : it.dataset.dx);
        it.style.setProperty("--y", sp ? sp[1] : it.dataset.dy);
      });
    }
    applySpots();
    ScrollTrigger.addEventListener("refreshInit", applySpots);
    var bx = function (it) { return function () { return parseFloat(it.style.getPropertyValue("--x")) * bStage.clientWidth / 100; }; };
    var by = function (it) { return function () { return parseFloat(it.style.getPropertyValue("--y")) * bStage.clientHeight / 100; }; };
    var btl = gsap.timeline({
      scrollTrigger: { trigger: burstSec, start: "top top", end: function () { return "+=" + window.innerHeight * 1.8; }, pin: bStage, scrub: 0.8, invalidateOnRefresh: true }
    });
    bItems.forEach(function (it, i) {
      var r = parseFloat(it.style.getPropertyValue("--r")) || 0;
      var ang = Math.atan2(parseFloat(it.style.getPropertyValue("--y")), parseFloat(it.style.getPropertyValue("--x")));
      var far = function () { return Math.max(bStage.clientWidth, bStage.clientHeight) * 0.62; };
      var fly = $(".burst__fly", it);
      gsap.set(fly, { transform: "none" });
      btl.fromTo(fly,
        { x: 0, y: 0, scale: 0.2, rotation: gsap.utils.random(-180, 180), opacity: 0 },
        { x: function () { return Math.cos(ang) * far(); }, y: function () { return Math.sin(ang) * far(); }, scale: 1.25,
          rotation: r + (i % 2 ? 540 : -540), opacity: 1, duration: 0.5, ease: "power3.out" }, i * 0.02)
        .to(fly, { x: bx(it), y: by(it), scale: 1, rotation: r, duration: 0.5, ease: "back.out(1.4)" }, 0.55 + i * 0.015);
    });
    btl.fromTo(".burst__head", { scale: 0.85 }, { scale: 1, duration: 0.6, ease: "power2.out" }, 0);
  }

  /* ---------- contact photo: image reveal + slow parallax ---------- */
  var cardImg = $(".contact__card img");
  if (cardImg) {
    gsap.set(".contact__card", { clipPath: "inset(100% 0 0 0 round 28px)" });
    whenVisible($(".contact__card"), function () { gsap.to(".contact__card", { clipPath: "inset(0% 0 0 0 round 28px)", duration: 1.2, ease: "expo.inOut" }); }, 0.95);
    gsap.fromTo(cardImg, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: "none", scrollTrigger: { trigger: ".contact__card", start: "top bottom", end: "bottom top", scrub: true } });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer) {
    $$("[data-magnetic]").forEach(function (el) {
      var xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, .4)" });
      var yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, .4)" });
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener("mouseleave", function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- custom cursor ---------- */
  if (finePointer) {
    doc.classList.add("has-cursor");
    var cur = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring"), label = $(".cursor__label");
    var dX = gsap.quickTo(dot, "x", { duration: 0.1 }), dY = gsap.quickTo(dot, "y", { duration: 0.1 });
    var rX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), rY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    window.addEventListener("mousemove", function (e) { dX(e.clientX); dY(e.clientY); rX(e.clientX); rY(e.clientY); }, { passive: true });
    document.addEventListener("mouseover", function (e) {
      var v = e.target.closest("[data-cursor]");
      var h = e.target.closest("a, button, summary, label, .pill");
      cur.classList.toggle("is-view", !!v);
      cur.classList.toggle("is-hover", !v && !!h);
      if (v) label.textContent = v.dataset.cursor;
    });
    document.addEventListener("mouseleave", function () { gsap.to(cur, { opacity: 0, duration: 0.2 }); });
    document.addEventListener("mouseenter", function () { gsap.to(cur, { opacity: 1, duration: 0.2 }); });
  }

  /* ---------- keep trigger positions honest ---------- */
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  if ("ResizeObserver" in window) {
    var lastH = 0, rt;
    new ResizeObserver(function () {
      var h = doc.scrollHeight;
      if (Math.abs(h - lastH) < 2) return;
      lastH = h;
      clearTimeout(rt);
      rt = setTimeout(function () { ScrollTrigger.refresh(); checkPending(); }, 200);
    }).observe(body);
  }
})();