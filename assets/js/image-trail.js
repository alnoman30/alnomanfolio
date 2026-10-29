/*
 * Image trail (GSAP), works on any number of sections.
 *
 * Add `data-image-trail` to a section, load GSAP, then load this file.
 * Optional per-section attributes:
 *   data-trail-images="a.jpg, b.jpg, c.jpg"   images for this section (defaults below)
 *   data-trail-z="2"                           z-index of the trail layer
 *   data-trail-size="180"                      image width in px
 *   data-trail-distance="90"                   px of cursor travel between images
 *   data-trail-drift="60"                      px each image drifts while fading
 */
(function () {
  "use strict";

  var DEFAULTS = {
    images: [
      "assets/images/socials/image-1.jpg",
      "assets/images/socials/image-2.jpg",
      "assets/images/socials/image-3.jpg",
      "assets/images/socials/image-4.jpg",
      "assets/images/socials/image-5.jpg",
      "assets/images/socials/image-6.jpg",
      "assets/images/socials/image-7.jpg",
      "assets/images/socials/image-8.jpg",
      "assets/images/socials/image-10.jpg"
    ],
    size: 180,        // image width in px (height is 5:4)
    distance: 90,     // px the cursor must travel before the next image appears
    drift: 60,        // px an image keeps drifting in the direction of movement
    zIndex: 2         // above the right image (z-1), below the left content (z-3)
  };

  var roots = document.querySelectorAll("[data-image-trail]");
  if (!roots.length || !window.gsap) return;

  // Desktop with a real hover pointer only, and respect reduced motion.
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) return;

  function num(value, fallback) {
    var n = parseFloat(value);
    return isNaN(n) ? fallback : n;
  }

  function initTrail(root) {
    var cfg = {
      images: root.dataset.trailImages
        ? root.dataset.trailImages.split(",").map(function (s) { return s.trim(); }).filter(Boolean)
        : DEFAULTS.images,
      size: num(root.dataset.trailSize, DEFAULTS.size),
      distance: num(root.dataset.trailDistance, DEFAULTS.distance),
      drift: num(root.dataset.trailDrift, DEFAULTS.drift),
      zIndex: num(root.dataset.trailZ, DEFAULTS.zIndex)
    };

    // The layer is positioned against the section, so it needs a positioned parent.
    if (window.getComputedStyle(root).position === "static") root.style.position = "relative";

    // Layer that holds the trail images
    var layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText =
      "position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:" + cfg.zIndex + ";";
    root.appendChild(layer);

    // Image pool (reused, so no elements are created while moving)
    var pool = cfg.images.map(function (src) {
      var img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.decoding = "async";
      img.draggable = false;
      img.style.cssText =
        "position:absolute;left:0;top:0;opacity:0;width:" + cfg.size + "px;" +
        "aspect-ratio:5/4;object-fit:cover;border-radius:10px;" +
        "will-change:transform,opacity;";
      layer.appendChild(img);
      return img;
    });

    var index = 0;
    var zTop = 1;
    var started = false;
    var last = { x: 0, y: 0 };

    function spawn(x, y, dx, dy) {
      var el = pool[index++ % pool.length];
      var len = Math.hypot(dx, dy) || 1;
      var nx = dx / len;
      var ny = dy / len;

      if (++zTop > 1000) zTop = 1;
      gsap.killTweensOf(el);
      gsap.set(el, {
        x: x,
        y: y,
        xPercent: -50,
        yPercent: -50,
        scale: 0.6,
        opacity: 0,
        rotation: gsap.utils.random(-12, 12),
        zIndex: zTop
      });

      gsap
        .timeline()
        .to(el, { opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" }, 0)
        .to(el, { x: x + nx * cfg.drift, y: y + ny * cfg.drift, duration: 1.1, ease: "power1.out" }, 0)
        .to(el, { opacity: 0, scale: 0.85, duration: 0.5, ease: "power2.in" }, 0.55);
    }

    root.addEventListener("mousemove", function (e) {
      var r = root.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;

      if (!started) {
        last = { x: x, y: y };
        started = true;
        return;
      }

      var dx = x - last.x;
      var dy = y - last.y;
      if (Math.hypot(dx, dy) < cfg.distance) return;

      spawn(x, y, dx, dy);
      last = { x: x, y: y };
    });

    root.addEventListener("mouseleave", function () {
      started = false;
    });
  }

  roots.forEach(initTrail);
})();