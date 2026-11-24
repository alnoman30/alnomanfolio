/* =========================================================================
   "Everything your website needs, one developer"
   Pills drop in with real physics (Matter.js) and can be dragged and thrown.
   The DOM pills follow their physics bodies. Without Matter.js or with
   reduced motion, the pills simply sit in a tidy wrap.
   ========================================================================= */
(function () {
  "use strict";
  var wrap = document.querySelector("[data-toss]");
  if (!wrap || !window.Matter) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var M = window.Matter;
  var section = wrap.closest(".toss");
  var started = false;
  // Switch to the physics layout right away; the section's height comes from CSS,
  // so nothing jumps when the pills start falling.
  wrap.classList.add("is-live", "is-pending");

  function start() {
    if (started) return;
    started = true;

    var pills = Array.prototype.slice.call(wrap.querySelectorAll(".pill"));
    var sizes = pills.map(function (el) { return { w: el.offsetWidth, h: el.offsetHeight }; });
    var W = wrap.clientWidth, H = wrap.clientHeight, T = 120;

    var engine = M.Engine.create({ gravity: { y: 1.1 } });
    var world = engine.world;
    var walls = [
      M.Bodies.rectangle(W / 2, H + T / 2, W * 3, T, { isStatic: true }),     // floor
      M.Bodies.rectangle(-T / 2, H / 2, T, H * 4, { isStatic: true }),        // left
      M.Bodies.rectangle(W + T / 2, H / 2, T, H * 4, { isStatic: true }),     // right
      M.Bodies.rectangle(W / 2, -H * 1.5, W * 3, T, { isStatic: true })       // ceiling (far above)
    ];
    M.Composite.add(world, walls);

    var bodies = pills.map(function (el, i) {
      var s = sizes[i];
      var b = M.Bodies.rectangle(W * (0.12 + Math.random() * 0.76), -60 - i * 50, s.w, s.h, {
        chamfer: { radius: s.h / 2 }, restitution: 0.38, friction: 0.3, frictionAir: 0.012, density: 0.002,
        angle: (Math.random() - 0.5) * 0.8
      });
      b.el = el; b.w = s.w; b.h = s.h;
      return b;
    });
    bodies.forEach(function (b, i) { setTimeout(function () { M.Composite.add(world, b); }, i * 85); });
    wrap.classList.remove("is-pending");

    /* drag and throw with pointer events (the page still scrolls outside the pills) */
    var drag = null;
    function point(e) { var r = wrap.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    pills.forEach(function (el, i) {
      el.addEventListener("pointerdown", function (e) {
        var b = bodies[i], p = point(e);
        el.setPointerCapture(e.pointerId);
        el.classList.add("is-dragging");
        drag = M.Constraint.create({ pointA: p, bodyB: b, pointB: { x: p.x - b.position.x, y: p.y - b.position.y }, stiffness: 0.2, damping: 0.1, length: 0 });
        M.Composite.add(world, drag);
      });
      el.addEventListener("pointermove", function (e) {
        if (!drag || drag.bodyB !== bodies[i]) return;
        drag.pointA = point(e);
      });
      function end() {
        if (!drag || drag.bodyB !== bodies[i]) return;
        M.Composite.remove(world, drag);
        drag = null;
        el.classList.remove("is-dragging");
      }
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
    });

    function sync() {
      for (var k = 0; k < bodies.length; k++) {
        var b = bodies[k];
        b.el.style.transform = "translate(" + (b.position.x - b.w / 2).toFixed(1) + "px," + (b.position.y - b.h / 2).toFixed(1) + "px) rotate(" + b.angle.toFixed(3) + "rad)";
      }
    }
    var running = true, lastT = performance.now();
    function loop(now) {
      if (running) { M.Engine.update(engine, Math.min(32, now - lastT)); sync(); }
      lastT = now;
      requestAnimationFrame(loop);
    }
    sync();
    requestAnimationFrame(loop);

    // pause the simulation while the section is off screen
    new IntersectionObserver(function (en) { running = en[0].isIntersecting; }).observe(section);

    // keep the walls and pills inside on resize
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var nW = wrap.clientWidth, nH = wrap.clientHeight;
        M.Body.setPosition(walls[0], { x: nW / 2, y: nH + T / 2 });
        M.Body.setPosition(walls[2], { x: nW + T / 2, y: nH / 2 });
        bodies.forEach(function (b) { if (b.position.x > nW - 20) M.Body.setPosition(b, { x: nW - b.w / 2 - 10, y: b.position.y }); });
        W = nW; H = nH;
      }, 200);
    });
  }

  // start once the section is properly on screen
  new IntersectionObserver(function (en, obs) {
    if (en[0].isIntersecting) { start(); obs.disconnect(); }
  }, { threshold: 0.35 }).observe(section);
})();
