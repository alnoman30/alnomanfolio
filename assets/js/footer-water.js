/* ==========================================================================
   FOOTER WATER
   The giant "AL NOMAN" in the footer is redrawn in WebGL. The letters are
   painted once into a mask texture; a fragment shader fills them with the
   same flowing violet gradient as before and bends them with water ripples
   that spread out from the cursor (or a finger) as it moves over the text.
   Falls back to the plain CSS version when WebGL is missing or the visitor
   prefers reduced motion.
   ========================================================================== */
(function () {
  "use strict";

  var big = document.querySelector(".footer__big");
  if (!big) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var canvas = document.createElement("canvas");
  canvas.className = "footer__water";
  canvas.setAttribute("aria-hidden", "true");
  var gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return;

  var MAX_DROPS = 24;
  var BLEED = 0.12; // extra canvas room around the text (fraction of height) so ripples are not clipped

  var vsrc =
    "attribute vec2 aPos;" +
    "varying vec2 vUv;" +
    "void main(){ vUv = aPos * 0.5 + 0.5; vUv.y = 1.0 - vUv.y; gl_Position = vec4(aPos, 0.0, 1.0); }";

  var fsrc =
    "precision highp float;" +
    "varying vec2 vUv;" +
    "uniform sampler2D uMask;" +
    "uniform vec2 uSize;" +            // canvas size in css px
    "uniform float uTime;" +
    "uniform vec4 uDrops[" + MAX_DROPS + "];" + // xy = position (css px), z = start time, w = strength
    "uniform vec2 uMouse;" +
    "uniform float uHover;" +
    "uniform vec2 uGrad;" +            // x = gradient tile width, y = bleed offset (css px)
    "vec3 grad(float x){" +
    // same stops as the CSS footer gradient, tiled so it loops seamlessly
    "  x = fract(x);" +
    "  vec3 c0 = vec3(1.0);" +
    "  vec3 c1 = vec3(0.788, 0.749, 1.0);" +
    "  vec3 c2 = vec3(0.369, 0.161, 1.0);" +
    "  vec3 c3 = vec3(0.561, 0.482, 1.0);" +
    "  vec3 c4 = vec3(0.616, 0.549, 1.0);" +
    "  if (x < 0.18) return mix(c0, c1, x / 0.18);" +
    "  if (x < 0.40) return mix(c1, c2, (x - 0.18) / 0.22);" +
    "  if (x < 0.62) return mix(c2, c3, (x - 0.40) / 0.22);" +
    "  if (x < 0.82) return mix(c3, c4, (x - 0.62) / 0.20);" +
    "  return mix(c4, c0, (x - 0.82) / 0.18);" +
    "}" +
    "void main(){" +
    "  vec2 p = vUv * uSize;" +
    "  float scale = uSize.y;" +
    "  vec2 disp = vec2(0.0);" +
    "  float h = 0.0;" +
    "  for (int i = 0; i < " + MAX_DROPS + "; i++) {" +
    "    vec4 d = uDrops[i];" +
    "    if (d.w <= 0.0) continue;" +
    "    float age = uTime - d.z;" +
    "    if (age < 0.0 || age > 5.0) continue;" +
    "    vec2 dir = p - d.xy;" +
    "    float dist = length(dir) / scale;" +
    "    float front = age * 0.3;" +               // ring radius grows with time
    "    float k = dist - front;" +
    "    float env = exp(-k * k * 28.0) * exp(-age * 1.0) * d.w;" +
    "    float wave = sin(k * 38.0) * env;" +
    "    h += wave;" +
    "    disp += (dist > 0.0001 ? dir / (dist * scale) : vec2(0.0)) * wave;" +
    "  }" +
    // a soft lens that follows the cursor while it is over the text
    "  vec2 md = p - uMouse;" +
    "  float ml = length(md) / scale;" +
    "  float lens = exp(-ml * ml * 18.0) * uHover;" +
    "  vec2 off = disp * 0.011 * scale - md * lens * 0.06;" +
    "  vec2 uv = (p + off) / uSize;" +
    "  float a = texture2D(uMask, uv).a;" +
    "  vec3 col = grad((p.x + off.x - uGrad.y) / uGrad.x - uTime / 9.0);" +
    "  col += max(h, 0.0) * 0.13 - max(-h, 0.0) * 0.04;" + // light on the crests, a little shade in the troughs
    "  col = clamp(col, 0.0, 1.0);" +
    "  gl_FragColor = vec4(col * a, a);" +
    "}";

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = shader(gl.VERTEX_SHADER, vsrc), fs = shader(gl.FRAGMENT_SHADER, fsrc);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uSize = gl.getUniformLocation(prog, "uSize");
  var uTime = gl.getUniformLocation(prog, "uTime");
  var uDrops = gl.getUniformLocation(prog, "uDrops");
  var uMouse = gl.getUniformLocation(prog, "uMouse");
  var uHover = gl.getUniformLocation(prog, "uHover");
  var uGrad = gl.getUniformLocation(prog, "uGrad");

  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

  var mask = document.createElement("canvas");
  var mctx = mask.getContext("2d");
  var W = 0, H = 0, bleed = 0, dpr = 1, tile = 1;

  big.appendChild(canvas);

  // paint the letters exactly where the DOM puts them
  function layout() {
    var box = big.getBoundingClientRect();
    if (!box.width) return;
    bleed = Math.round(box.height * BLEED);
    tile = box.width * 0.5; // the CSS gradient is 50% wide and repeats
    W = Math.round(box.width + bleed * 2);
    H = Math.round(box.height + bleed * 2);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.style.left = -bleed + "px";
    canvas.style.top = -bleed + "px";
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    mask.width = canvas.width;
    mask.height = canvas.height;
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.clearRect(0, 0, W, H);
    mctx.fillStyle = "#fff";

    var spans = big.querySelectorAll("span");
    for (var i = 0; i < spans.length; i++) {
      var sp = spans[i], cs = getComputedStyle(sp), r = sp.getBoundingClientRect();
      mctx.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
      mctx.textBaseline = "alphabetic";
      var text = cs.textTransform === "uppercase" ? sp.textContent.toUpperCase() : sp.textContent;
      var m = mctx.measureText(text);
      var asc = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent;
      var desc = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent;
      var lh = parseFloat(cs.lineHeight) || r.height;
      // CSS centres the font's content box inside the line box
      var baseline = (r.top - box.top) + (lh - (asc + desc)) / 2 + asc;
      mctx.fillText(text, r.left - box.left + bleed, baseline + bleed);
    }

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
    gl.viewport(0, 0, canvas.width, canvas.height);
    big.classList.add("is-gl");
  }

  // ---------- ripples ----------
  var drops = new Float32Array(MAX_DROPS * 4);
  var next = 0, last = null, lastT = 0;
  var start = performance.now();
  var mouse = { x: -9999, y: -9999 }, hover = 0, hoverTarget = 0;
  function now() { return (performance.now() - start) / 1000; }

  function addDrop(x, y, strength) {
    var o = next * 4;
    drops[o] = x; drops[o + 1] = y; drops[o + 2] = now(); drops[o + 3] = strength;
    next = (next + 1) % MAX_DROPS;
    wake();
  }

  function local(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  big.addEventListener("pointermove", function (e) {
    var p = local(e), t = performance.now();
    mouse.x = p.x; mouse.y = p.y; hoverTarget = 1;
    if (!last) { last = p; lastT = t; addDrop(p.x, p.y, 0.4); return; }
    var dx = p.x - last.x, dy = p.y - last.y, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > H * 0.1 || t - lastT > 180) {
      var speed = dist / Math.max(t - lastT, 16);
      addDrop(p.x, p.y, Math.min(0.25 + speed * 0.2, 0.6));
      last = p; lastT = t;
    }
    wake();
  });
  big.addEventListener("pointerleave", function () { hoverTarget = 0; last = null; wake(); });
  big.addEventListener("pointerdown", function (e) { var p = local(e); addDrop(p.x, p.y, 0.8); });

  // ---------- render loop (only while the footer is on screen) ----------
  var visible = false, raf = 0;
  function frame() {
    raf = 0;
    if (!visible) return;
    hover += (hoverTarget - hover) * 0.05;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uSize, W, H);
    gl.uniform1f(uTime, now());
    gl.uniform4fv(uDrops, drops);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uHover, hover);
    gl.uniform2f(uGrad, tile, bleed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  }
  function wake() { if (visible && !raf) raf = requestAnimationFrame(frame); }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      wake();
    }).observe(big);
  } else { visible = true; }

  var resizeT;
  window.addEventListener("resize", function () { clearTimeout(resizeT); resizeT = setTimeout(function () { layout(); wake(); }, 120); });
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); big.classList.remove("is-gl"); visible = false; });

  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
    layout();
    wake();
  });
})();
