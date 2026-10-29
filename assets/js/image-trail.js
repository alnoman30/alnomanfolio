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

// 
/*
 * WebGL hover distortion for images (no libraries).
 *
 * Usage: add `data-webgl-image` to any <img>, then load this file.
 * The <img> stays in the page for layout, SEO and accessibility; a canvas is
 * layered on top of it. If WebGL is unavailable (or reduced motion is on),
 * the normal image is shown.
 *
 * Effect: a ripple that follows the cursor, plus a push in the direction you
 * move. Everything eases back to a clean image when you leave.
 */
(function () {
  "use strict";

  var imgs = document.querySelectorAll("img[data-webgl-image]");
  if (!imgs.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var VERT =
    "attribute vec2 p;" +
    "varying vec2 vUv;" +
    "void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }";

  var FRAG =
    "precision mediump float;" +
    "varying vec2 vUv;" +
    "uniform sampler2D uTex;" +
    "uniform vec2 uMouse;" +
    "uniform vec2 uVel;" +
    "uniform float uHover;" +
    "uniform float uTime;" +
    "uniform float uAspect;" +
    "uniform vec2 uScale;" +
    "uniform vec2 uOffset;" +
    "vec2 cover(vec2 uv){ return vec2(uv.x * uScale.x + uOffset.x, uOffset.y + uv.y * uScale.y); }" +
    "void main(){" +
    "  vec2 uv = vUv;" +
    "  vec2 d = uv - uMouse; d.x *= uAspect;" +
    "  float dist = length(d);" +
    "  float falloff = smoothstep(0.5, 0.0, dist) * uHover;" +
    "  vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);" +
    "  dir.x /= uAspect;" +
    "  float wave = sin(dist * 40.0 - uTime * 3.0);" +
    "  vec2 disp = dir * wave * 0.012 * falloff + uVel * falloff * 0.6;" +
    "  gl_FragColor = vec4(texture2D(uTex, cover(uv + disp)).rgb, 1.0);" +
    "}";

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }

  function init(img) {
    var wrap = img.parentElement;
    if (!wrap) return;
    if (window.getComputedStyle(wrap).position === "static") wrap.style.position = "relative";

    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";

    var gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Full-screen quad
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ["uTex", "uMouse", "uVel", "uHover", "uTime", "uAspect", "uScale", "uOffset"].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });

    // State
    var mouse = { x: 0.5, y: 0.5 };
    var target = { x: 0.5, y: 0.5 };
    var vel = { x: 0, y: 0 };
    var hover = 0;
    var hoverTarget = 0;
    var time = 0;
    var prev = 0;
    var raf = 0;
    var ready = false;

    function layout() {
      var w = wrap.clientWidth;
      var h = wrap.clientHeight;
      if (!w || !h) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);

      // "object-cover object-top": fill the box, keep the top of the image
      var ratio = w / h / (img.naturalWidth / img.naturalHeight);
      var sx = 1, sy = 1, ox = 0, oy = 0;
      if (ratio >= 1) { sy = 1 / ratio; oy = 1 - sy; }
      else { sx = ratio; ox = (1 - ratio) / 2; }
      gl.uniform2f(U.uScale, sx, sy);
      gl.uniform2f(U.uOffset, ox, oy);
      gl.uniform1f(U.uAspect, w / h);
      draw();
    }

    function draw() {
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.uniform2f(U.uVel, vel.x, vel.y);
      gl.uniform1f(U.uHover, hover);
      gl.uniform1f(U.uTime, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function frame(now) {
      var dt = Math.min(0.05, (now - prev) / 1000 || 0.016);
      prev = now;

      var k = 1 - Math.exp(-dt * 12);
      var px = mouse.x, py = mouse.y;
      mouse.x += (target.x - mouse.x) * k;
      mouse.y += (target.y - mouse.y) * k;

      vel.x += ((mouse.x - px) - vel.x) * 0.2;
      vel.y += ((mouse.y - py) - vel.y) * 0.2;
      var speed = Math.hypot(vel.x, vel.y);
      if (speed > 0.05) { vel.x *= 0.05 / speed; vel.y *= 0.05 / speed; }

      hover += (hoverTarget - hover) * (1 - Math.exp(-dt * 6));
      time += dt;

      draw();

      // Keep rendering only while something is still moving
      if (hoverTarget > 0 || hover > 0.002 || Math.hypot(vel.x, vel.y) > 0.0005) {
        raf = requestAnimationFrame(frame);
      } else {
        hover = 0; vel.x = 0; vel.y = 0;
        draw();
        raf = 0;
      }
    }

    function wake() {
      if (!raf && ready) { prev = performance.now(); raf = requestAnimationFrame(frame); }
    }

    function setTarget(e) {
      var r = wrap.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = 1 - (e.clientY - r.top) / r.height;
    }

    wrap.addEventListener("pointerenter", function (e) {
      setTarget(e);
      mouse.x = target.x; mouse.y = target.y;
      hoverTarget = 1;
      wake();
    });
    wrap.addEventListener("pointermove", function (e) { setTarget(e); wake(); });
    wrap.addEventListener("pointerleave", function () { hoverTarget = 0; wake(); });

    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      ready = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas); // fall back to the plain <img>
    });

    function start() {
      try {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      } catch (err) {
        return; // e.g. cross-origin image without CORS: keep the normal <img>
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(U.uTex, 0);

      wrap.appendChild(canvas);
      ready = true;
      layout();
      if ("ResizeObserver" in window) new ResizeObserver(layout).observe(wrap);
      else window.addEventListener("resize", layout);
    }

    if (img.complete && img.naturalWidth) start();
    else img.addEventListener("load", start, { once: true });
  }

  imgs.forEach(init);
})();