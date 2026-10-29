/*
 * Image trail (GSAP) for the hero section.
 * Usage: add `data-image-trail` to the hero <section>, load GSAP, then load this file.
 * The script creates its own layer inside the section, so no other markup changes.
 */
(function () {
  "use strict";

  var CFG = {
    images: [
      "assets/images/socials/image-1.jpg",
      "assets/images/socials/image-2.jpg",
      "assets/images/socials/image-3.jpg",
      "assets/images/socials/image-4.jpg",
      "assets/images/socials/image-5.jpg",
      "assets/images/socials/image-6.jpg",
      "assets/images/socials/image-7.jpg",
      "assets/images/socials/image-8.jpg",
      "assets/images/socials/image-10.jpg",
    ],
    size: 180,        // image width in px (height is 5:4)
    distance: 90,     // px the cursor must travel before the next image appears
    drift: 60,        // px an image keeps drifting in the direction of movement
    zIndex: 2         // above the right image (z-1), below the left content (z-3)
  };

  var root = document.querySelector("[data-image-trail]");
  if (!root || !window.gsap) return;

  // Desktop with a real hover pointer only, and respect reduced motion.
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) return;

  // Layer that holds the trail images
  var layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText =
    "position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:" + CFG.zIndex + ";";
  root.appendChild(layer);

  // Image pool (reused, so no elements are created while moving)
  var pool = CFG.images.map(function (src) {
    var img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.decoding = "async";
    img.draggable = false;
    img.style.cssText =
      "position:absolute;left:0;top:0;opacity:0;width:" + CFG.size + "px;" +
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
      .to(el, { x: x + nx * CFG.drift, y: y + ny * CFG.drift, duration: 1.1, ease: "power1.out" }, 0)
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
    if (Math.hypot(dx, dy) < CFG.distance) return;

    spawn(x, y, dx, dy);
    last = { x: x, y: y };
  });

  root.addEventListener("mouseleave", function () {
    started = false;
  });
})();