/* ==========================================================================
   SCRIPT.JS

   0. Shared setup & helpers
   1. Smooth scroll (Lenis)
   2. CTA button hover animation
   3. Scroll parallax
   4. Marquee sliders (scroll-linked speed)
   5. Scrub text reveal (SplitText)
   6. Header: mobile drawer + hide on scroll
   7. Background music toggle
   8. Work cards: reveal + cursor-follow button
   9. Testimonial slider
  10. FAQ accordion
  11. Resume (pinned, scrubbed timeline)
  12. Click sound (global)
  13. Init (single entry point)
   ========================================================================== */

(() => {
  "use strict";

  /* ========================================================================
     0. SHARED SETUP & HELPERS
     ====================================================================== */

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  const isDesktop = window.matchMedia("(min-width: 1024px)");

  // Shared Lenis instance (set in initSmoothScroll, used by the resume tabs)
  let lenis = null;

  // Short query helpers
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];

  // True when GSAP and ScrollTrigger are both available
  const hasGsap = () =>
    typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  /* ========================================================================
     1. SMOOTH SCROLL (LENIS)
     ====================================================================== */

  function initSmoothScroll() {
    if (typeof Lenis === "undefined") return;

    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.3,
      infinite: false,
    });

    // Keep ScrollTrigger in sync and drive Lenis from GSAP's ticker
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ========================================================================
     2. CTA BUTTON HOVER ANIMATION
     Expects: .cta-btn > .cta-text + .cta-arrow-wrap > two .cta-arrow
     ====================================================================== */

  // Split the label into per-letter columns holding two stacked glyph copies
  function splitCtaText(textEl) {
    const label = textEl.textContent;
    textEl.textContent = "";

    return [...label].map((letter) => {
      const char = document.createElement("span");
      char.className = "cta-char";

      const inner = document.createElement("span");
      inner.className = "cta-char-inner";

      for (let i = 0; i < 2; i++) {
        const line = document.createElement("span");
        line.className = "cta-char-line";
        line.textContent = letter;
        inner.appendChild(line);
      }

      char.appendChild(inner);
      textEl.appendChild(char);
      return inner;
    });
  }

  // Returns swapArrows(true) for hover, swapArrows(false) for leave
  function createArrowSwap(arrowA, arrowB) {
    gsap.set(arrowA, { xPercent: 0 });
    gsap.set(arrowB, { xPercent: -150 });

    let timeline = null;

    return (hovered) => {
      if (timeline) timeline.kill();

      const outgoing = hovered ? arrowA : arrowB;
      const incoming = hovered ? arrowB : arrowA;

      // Reset both arrows so they never keep stale positions
      gsap.set(outgoing, { xPercent: 0 });
      gsap.set(incoming, { xPercent: hovered ? -150 : 150 });

      timeline = gsap.timeline();
      timeline.to(
        outgoing,
        { xPercent: hovered ? 150 : -150, duration: 0.5, ease: "power2.inOut" },
        0,
      );
      timeline.to(
        incoming,
        { xPercent: 0, duration: 0.7, ease: "power3.out" },
        0,
      );
    };
  }

  function initCtaButtons() {
    // No text splitting or hover animation for reduced motion
    if (prefersReducedMotion.matches) return;

    $$(".cta-btn").forEach((btn) => {
      if (btn.dataset.ctaInit === "true") return;

      const text = $(".cta-text", btn);
      const arrows = $$(".cta-arrow", btn);
      if (!text || arrows.length !== 2) return;

      btn.dataset.ctaInit = "true";

      const chars = splitCtaText(text);
      const swapArrows = createArrowSwap(arrows[0], arrows[1]);

      const textTimeline = gsap.timeline({ paused: true });
      textTimeline.to(chars, {
        yPercent: -50,
        duration: 0.45,
        ease: "power3.inOut",
        stagger: 0.025,
      });

      let isHovered = false;

      const enter = () => {
        if (isHovered) return;
        isHovered = true;
        textTimeline.play();
        swapArrows(true);
      };

      const leave = () => {
        if (!isHovered) return;
        isHovered = false;
        textTimeline.reverse();
        swapArrows(false);
      };

      btn.addEventListener("mouseenter", enter);
      btn.addEventListener("mouseleave", leave);

      // Keyboard accessibility
      btn.addEventListener("focus", enter);
      btn.addEventListener("blur", leave);
    });
  }

  /* ========================================================================
     3. SCROLL PARALLAX
     Add data-parallax="0.2" to any element inside a [data-parallax-root].
     Positive = drifts down (slower), negative = drifts up (faster).
     Desktop (>= 1024px) only.
     ====================================================================== */

  function initParallax() {
    const roots = $$("[data-parallax-root]");
    if (!roots.length) return;

    let ticking = false;

    // Clear inline transforms (reduced motion / below desktop)
    function reset() {
      roots.forEach((root) => {
        $$("[data-parallax]", root).forEach((el) => {
          el.style.transform = "";
        });
      });
    }

    function update() {
      ticking = false;

      if (prefersReducedMotion.matches || !isDesktop.matches) {
        reset();
        return;
      }

      roots.forEach((root) => {
        const rect = root.getBoundingClientRect();

        // Skip sections that are off-screen
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        // Distance the section has scrolled past the viewport top
        const scrolled = -rect.top;

        $$("[data-parallax]", root).forEach((el) => {
          const speed = parseFloat(el.dataset.parallax) || 0;
          el.style.transform = `translate3d(0, ${(scrolled * speed).toFixed(1)}px, 0)`;
        });
      });
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    isDesktop.addEventListener("change", requestUpdate);
    update();
  }

  /* ========================================================================
     4. MARQUEE SLIDERS
     Two Splide rows (opposite directions) whose speed follows scroll velocity.
     ====================================================================== */

  function initMarquee() {
    const section = $("section.marquee-slider");
    if (!section || typeof Splide === "undefined") return;

    const BASE_SPEED = 1.5; // resting speed (px per frame)
    const MIN_MULT = 0.2; // slowest (scrolling up hard)
    const MAX_MULT = 6; // fastest (scrolling down hard)
    const SENSITIVITY = 0.3; // how strongly scroll velocity changes speed
    const EASE = 0.08; // how quickly speed returns to normal (0-1)

    // Non-draggable looping rows, no arrows/pagination
    const baseOptions = {
      type: "loop",
      drag: false,
      arrows: false,
      pagination: false,
      gap: "1.5rem",
      autoWidth: true,
    };

    const createRow = (selector, direction) => {
      const el = $(selector, section);
      if (!el) return null;

      const splide = new Splide(el, {
        ...baseOptions,
        autoScroll: {
          speed: BASE_SPEED * direction,
          pauseOnHover: false,
          pauseOnFocus: false,
          rewind: false,
        },
      });
      splide.mount(window.splide.Extensions);
      return { splide, direction };
    };

    // Row 1 scrolls left, Row 2 scrolls right
    const rows = [
      createRow("#splide-row-1", 1),
      createRow("#splide-row-2", -1),
    ].filter(Boolean);
    if (!rows.length) return;

    // Only react while the section is on screen
    let isVisible = false;
    new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 },
    ).observe(section);

    let lastY = window.scrollY;
    let multiplier = 1; // current speed multiplier
    let target = 1; // multiplier we are easing toward
    let applied = 1; // last multiplier pushed to Splide

    const clamp = (v) => Math.min(MAX_MULT, Math.max(MIN_MULT, v));

    // Scroll down = faster, scroll up = slower
    window.addEventListener(
      "scroll",
      () => {
        const delta = window.scrollY - lastY;
        lastY = window.scrollY;
        if (!isVisible) return;
        target = clamp(1 + delta * SENSITIVITY);
      },
      { passive: true },
    );

    // Also react to wheel when the page can't scroll (top/bottom)
    window.addEventListener(
      "wheel",
      (e) => {
        if (!isVisible) return;
        target = clamp(1 + e.deltaY * SENSITIVITY * 0.25);
      },
      { passive: true },
    );

    const tick = () => {
      // Ease toward target, then ease target back to normal (1)
      multiplier += (target - multiplier) * 0.15;
      target += (1 - target) * EASE;

      // Only touch Splide when the speed actually changed
      if (Math.abs(multiplier - applied) > 0.01) {
        applied = multiplier;
        rows.forEach(({ splide, direction }) => {
          splide.options = {
            autoScroll: { speed: BASE_SPEED * direction * applied },
          };
        });
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  /* ========================================================================
     5. SCRUB TEXT REVEAL
     Words fade from their base color to white as the paragraph scrolls in.
     ====================================================================== */

  function initScrubText() {
    const elements = $$("#scrub-text");
    if (!elements.length || typeof SplitText === "undefined") return;

    elements.forEach((el) => {
      const split = new SplitText(el, { type: "words" });

      gsap.to(split.words, {
        color: "#ffffff",
        stagger: 0.1,
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          end: "bottom 30%",
          scrub: true,
        },
      });
    });
  }

  /* ========================================================================
     6. HEADER: MOBILE DRAWER + HIDE ON SCROLL
     ====================================================================== */

  function initMobileDrawer() {
    const openBtn = $("#mobile-menu-trigger");
    const closeBtn = $("#mobile-drawer-close");
    const overlay = $("#mobile-drawer-overlay");
    const drawer = $("#mobile-drawer");
    if (!openBtn || !closeBtn || !overlay || !drawer) return;

    const openDrawer = () => {
      drawer.classList.remove("translate-x-full");
      overlay.classList.remove("opacity-0", "pointer-events-none");
      document.body.style.overflow = "hidden";
    };

    const closeDrawer = () => {
      drawer.classList.add("translate-x-full");
      overlay.classList.add("opacity-0", "pointer-events-none");
      document.body.style.overflow = "";
    };

    openBtn.addEventListener("click", openDrawer);
    closeBtn.addEventListener("click", closeDrawer);
    overlay.addEventListener("click", closeDrawer);
  }

  function initHeaderHide() {
    const header = $("header");
    if (!header) return;

    const delta = 5; // ignore tiny scroll movements
    const navbarHeight = header.offsetHeight;
    let lastScrollTop = 0;

    window.addEventListener(
      "scroll",
      () => {
        const currentScroll =
          window.pageYOffset || document.documentElement.scrollTop;

        if (currentScroll < 0) return;
        if (Math.abs(lastScrollTop - currentScroll) <= delta) return;

        // Hide when scrolling down past the header, show when scrolling up
        if (currentScroll > lastScrollTop && currentScroll > navbarHeight) {
          header.classList.add("-translate-y-full");
        } else {
          header.classList.remove("-translate-y-full");
        }

        lastScrollTop = currentScroll;
      },
      { passive: true },
    );
  }

  /* ========================================================================
     7. BACKGROUND MUSIC TOGGLE
     ====================================================================== */

  function initMusicPlayer() {
    const musicBtn = $("#music-toggle");
    const audio = $("#bg-audio");
    if (!musicBtn || !audio) return;

    const iconPlay = $("#music-icon-play");
    const iconPause = $("#music-icon-pause");

    // Sync button state and icons with the audio state
    const setUI = (playing) => {
      musicBtn.classList.toggle("is-playing", playing);
      musicBtn.setAttribute("aria-pressed", String(playing));
      musicBtn.setAttribute(
        "aria-label",
        playing ? "Pause background music" : "Play background music",
      );
      if (iconPlay) iconPlay.classList.toggle("hidden", playing);
      if (iconPause) iconPause.classList.toggle("hidden", !playing);
    };

    audio.volume = 0.5;

    musicBtn.addEventListener("click", async () => {
      if (audio.paused) {
        try {
          await audio.play();
        } catch (err) {
          console.warn("Audio playback failed:", err);
        }
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", () => setUI(true));
    audio.addEventListener("pause", () => setUI(false));
  }

  /* ========================================================================
     8. WORK CARDS: REVEAL + CURSOR-FOLLOW BUTTON
     ====================================================================== */

  function initWorkCards() {
    const grid = $("#works-grid");
    if (!grid) return;

    // Fade/slide each card in as it enters the viewport
    const cards = gsap.utils.toArray(".work-card");
    gsap.set(cards, { y: 60, opacity: 0 });

    ScrollTrigger.batch(cards, {
      start: "top 90%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          overwrite: true,
        }),
    });

    // Cursor-follow button is skipped on touch devices
    if (window.matchMedia("(hover: none)").matches) return;

    const medias = $$(".work-media", grid);
    const buttons = medias.map((m) => $(".view-work", m)).filter(Boolean);
    if (!medias.length) return;

    buttons.forEach((btn) => {
      gsap.set(btn, {
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: 0,
        scale: 0,
        opacity: 0,
        force3D: true,
      });
      btn.style.willChange = "transform, opacity";
      btn.style.pointerEvents = "none"; // never steals hover from the card
    });

    const showBtn = (btn) =>
      gsap.to(btn, {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
        overwrite: "auto",
      });
    const hideBtn = (btn) =>
      gsap.to(btn, {
        scale: 0,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        overwrite: "auto",
      });

    let active = null; // { media, btn, rect, xTo, yTo }
    let lastX = 0;
    let lastY = 0;

    // Re-measure the active card when the page moves
    const measure = () => {
      if (active) active.rect = active.media.getBoundingClientRect();
    };

    // Move the button to the cursor position
    const follow = () => {
      if (!active) return;
      active.xTo(lastX - active.rect.left);
      active.yTo(lastY - active.rect.top);
    };

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", follow, { passive: true }); // follow while the mouse is still

    const activate = (media, btn, e) => {
      if (active && active.btn !== btn) hideBtn(active.btn);

      lastX = e.clientX;
      lastY = e.clientY;

      const rect = media.getBoundingClientRect();
      gsap.killTweensOf(btn, "x,y"); // drop old position tweens
      gsap.set(btn, { x: lastX - rect.left, y: lastY - rect.top }); // start under the cursor

      active = {
        media,
        btn,
        rect,
        xTo: gsap.quickTo(btn, "x", { duration: 0.35, ease: "power3.out" }),
        yTo: gsap.quickTo(btn, "y", { duration: 0.35, ease: "power3.out" }),
      };
      showBtn(btn);
    };

    const deactivate = (btn) => {
      hideBtn(btn);
      if (active && active.btn === btn) active = null;
    };

    medias.forEach((media) => {
      const btn = $(".view-work", media);
      if (!btn) return;

      media.addEventListener("pointerenter", (e) => activate(media, btn, e));
      media.addEventListener(
        "pointermove",
        (e) => {
          if (!active || active.btn !== btn) {
            activate(media, btn, e);
            return;
          }
          lastX = e.clientX;
          lastY = e.clientY;
          follow();
        },
        { passive: true },
      );
      media.addEventListener("pointerleave", () => deactivate(btn));
    });

    // Hide every button when the pointer leaves the grid or window
    const resetAll = () => {
      buttons.forEach(hideBtn);
      active = null;
    };
    grid.addEventListener("pointerleave", resetAll);
    document.addEventListener("mouseleave", resetAll);
    window.addEventListener("blur", resetAll);
  }

  /* ========================================================================
     9. TESTIMONIAL SLIDER
     ====================================================================== */

  function initTestimonials() {
    const el = $("#testimonial-slider");
    if (!el || typeof Splide === "undefined") return;

    const splide = new Splide(el, {
      type: "loop",
      drag: "free",
      perPage: 2,
      gap: "1.5rem",
      arrows: false, // hidden on desktop
      pagination: false,
      autoScroll: {
        speed: 1.3,
        pauseOnHover: true,
        pauseOnFocus: false,
      },
      breakpoints: {
        1280: { perPage: 2 },
        768: {
          perPage: 1,
          drag: true,
          arrows: true, // arrows on mobile
          autoScroll: false, // no auto-scroll on mobile
        },
      },
    });

    splide.mount(window.splide.Extensions);
  }

  /* ========================================================================
     10. FAQ ACCORDION (one open at a time)
     ====================================================================== */

  function initFaq() {
    const items = $$(".faq-item");
    if (!items.length) return;

    items.forEach((item) => {
      const btn = $(".faq-btn", item);
      if (!btn) return;

      btn.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");

        // Close all, then reopen the clicked one if it was closed
        items.forEach((i) => {
          i.classList.remove("open");
          const b = $(".faq-btn", i);
          if (b) b.setAttribute("aria-expanded", "false");
        });

        if (!isOpen) {
          item.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* ========================================================================
     11. RESUME (pinned, scrubbed timeline)
     Everything lives inside this function so its variables stay private.
     ====================================================================== */
  function initResume() {
    const cardsWrap = $("#cards");
    const wrap = $(".pin-wrap");
    const pill = $(".tab-pill");
    const tabs = $$(".tab-btn");
    if (!cardsWrap || !wrap || !pill || !tabs.length) return;

    /* ---- Content (edit this and the markup rebuilds itself) ---- */
    const DATA = [
      {
        tab: "Education",
        items: [
          {
            title: "Bachelor of Science (BSc)",
            meta: "Daffodil International University (2020 – 2024)",
            text: "Completed a BSc in Computer Science and Engineering (CSE), building a strong foundation in programming, software development, and emerging technologies.",
            label: "Computer Science & Engineering (CSE)",
            tags: ["Programming", "Software Development", "Emerging Tech"],
          },
          {
            title: "Higher Secondary Certificate (HSC)",
            meta: "Ideal College, Dhanmondi (2018 – 2019)",
            text: "Completed my HSC in the Science group, with a strong foundation in Physics, Chemistry, Biology, and Mathematics.",
            label: "Science",
            tags: ["Physics", "Chemistry", "Biology", "Mathematics"],
          },
          {
            title: "Secondary School Certificate (SSC)",
            meta: "Ashrafabad High School (2016 – 2017)",
            text: "Completed my SSC in the Science group at Ashrafabad High School.",
            label: "Science",
            tags: ["Science"],
          },
        ],
      },
      {
        tab: "Experience",
        items: [
          {
            title: "Getweb Inc.",
            meta: "Junior Web Developer & Sales Development Representative",
            text: "I work at Getweb Inc., a software and IT company in Dhaka, Bangladesh. I build user-friendly web applications and work directly with clients to drive growth, combining technical skills with communication and problem-solving.",
            label: "Web Development & Client Growth",
            tags: ["Web Development", "Communication", "Problem-solving"],
          },
          {
            title: "Creative IT Institute",
            meta: "Web Design & Development Course",
            text: "Trained in building modern, mobile-friendly websites that adapt to every device. Learned HTML, CSS, and responsive design techniques to create visually appealing, user-friendly web pages.",
            label: "Web Design & Development",
            tags: ["HTML", "CSS", "Responsive Design"],
          },
        ],
      },
    ];

    /* ---- Build markup ---- */
    const pad = (n) => String(n).padStart(2, "0");

    cardsWrap.innerHTML = DATA.map((g) => {
      const n = g.items.length;
      return `
    <article role="tabpanel" aria-label="${g.tab}" class="res-card border-glow absolute inset-0 rounded-[28px] bg-[#07080a]/85 backdrop-blur-xl overflow-hidden will-change-transform">
      <div class="dots pointer-events-none absolute inset-0"></div>
      <div class="dots-hot pointer-events-none absolute inset-0"></div>
      <div class="glow pointer-events-none absolute inset-0"></div>

      <!-- giant outlined index numerals -->
      ${g.items
        .map(
          (_, i) => `
        <span class="res-num num-stroke pointer-events-none select-none absolute right-4 md:right-12 -bottom-[0.14em] text-[130px] md:text-[250px] font-extrabold leading-none tracking-tighter">${pad(i + 1)}</span>
      `,
        )
        .join("")}

      <!-- progress rail with nodes -->
      <div class="hidden md:block absolute left-8 lg:left-12 top-14 bottom-14 w-px bg-white/10">
        <div class="res-fill absolute inset-0 bg-linear-to-b from-primary to-secondary"></div>
        ${g.items
          .map(
            (_, i) => `
          <span class="res-node absolute -left-[5px] size-[11px] rounded-full bg-[#0c0d10] border border-white/25"
                style="top:calc(${n > 1 ? (i / (n - 1)) * 100 : 0}% - 5px)">
            <i class="res-dot absolute -inset-px rounded-full bg-linear-to-br from-primary to-secondary"></i>
          </span>
        `,
          )
          .join("")}
      </div>

      <div class="relative h-full mx-auto max-w-5xl flex flex-col gap-6 px-6 py-6 md:grid md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] md:gap-14 md:px-20 md:py-14">

        <!-- gradient visual -->
        <div class="res-tilt md:order-2 md:self-start md:justify-self-end w-full md:max-w-[420px] h-36 md:h-[320px] shrink-0">
          <div class="res-flip h-full w-full">
            <div class="res-visual grad-card relative h-full w-full rounded-2xl overflow-hidden shadow-[0_30px_80px_-40px_rgba(255,77,28,.2)]">
              <div class="sheen pointer-events-none"></div>
              <div class="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full border border-white/35 animate-[spin_18s_linear_infinite]"></div>
              <div class="pointer-events-none absolute -right-4 -top-4 size-36 rounded-full border border-dashed border-white/30 animate-[spin_26s_linear_infinite_reverse]"></div>
              <div class="pointer-events-none absolute -left-20 -bottom-20 size-72 rounded-full border border-dashed border-white/25 animate-[spin_30s_linear_infinite]"></div>
              <div class="pointer-events-none absolute -top-16 -left-10 size-52 rounded-full bg-white/10 blur-3xl"></div>

              ${g.items
                .map(
                  (it) => `
                <p class="res-label absolute inset-0 grid place-items-center px-8 text-center text-lg md:text-2xl font-semibold leading-snug text-white">${it.label}</p>
              `,
                )
                .join("")}
            </div>
          </div>
        </div>

        <!-- NATIVE inner scroll area (Lenis ignores it, scroll chains to the page at the ends) -->
        <div data-lenis-prevent
             class="res-viewport fade-b md:order-1 relative flex-1 min-h-0 overflow-y-auto overscroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div class="res-list relative">
            ${g.items
              .map(
                (it) => `
              <div class="res-item cursor-pointer pb-10 md:pb-14">
                <h3 class="res-title text-2xl md:text-[28px] font-bold leading-tight text-white">${it.title}</h3>
                <p class="mt-4 md:mt-5 text-base md:text-xl font-medium bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">${it.meta}</p>
                <p class="mt-3 md:mt-4 max-w-md text-sm md:text-base leading-7 text-gray-300">${it.text}</p>
              </div>
            `,
              )
              .join("")}
            <div class="res-spacer" aria-hidden="true"></div>
          </div>
        </div>

      </div>
    </article>`;
    }).join("");

    /* ---- Setup ---- */
    const DIM = { opacity: 0.25, filter: "blur(2px)" };
    const ACTIVE = { opacity: 1, filter: "blur(0px)" };

    // Split titles into characters (inside nowrap words so wrapping still works)
    $$(".res-title").forEach((el) => {
      const text = el.textContent;
      el.setAttribute("aria-label", text);
      el.innerHTML = text
        .split(" ")
        .map(
          (w) =>
            `<span class="inline-block whitespace-nowrap" aria-hidden="true">${[
              ...w,
            ]
              .map((c) => `<span class="ch inline-block">${c}</span>`)
              .join("")}</span>`,
        )
        .join(" ");
    });

    // Cache the elements each card animates
    const refs = $$(".res-card").map((card) => ({
      card,
      items: $$(".res-item", card),
      chars: $$(".res-title", card).map((t) => $$(".ch", t)),
      labels: $$(".res-label", card),
      nums: $$(".res-num", card),
      nodes: $$(".res-node", card),
      dots: $$(".res-dot", card),
      fill: $(".res-fill", card),
      tilt: $(".res-tilt", card),
      flip: $(".res-flip", card),
      visual: $(".res-visual", card),
      viewport: $(".res-viewport", card),
      spacer: $(".res-spacer", card),
      active: -1,
    }));

    // Small spacer so the last item can reach the active zone without a long dead scroll
    function setSpacers() {
      refs.forEach((r) => {
        r.spacer.style.height =
          Math.round(r.viewport.clientHeight * 0.3) + "px";
      });
    }
    setSpacers();
    window.addEventListener("resize", setSpacers);

    // Initial states
    refs.forEach((r, ci) => {
      gsap.set(r.items, DIM);
      gsap.set(r.labels, { opacity: 0 });
      gsap.set(r.nums, { opacity: 0 });
      gsap.set(r.dots, { scale: 0 });
      gsap.set(r.fill, { scaleY: 0, transformOrigin: "50% 0%" });
      gsap.set(r.visual, { "--ang": "135deg" });
      gsap.set(r.card, { transformOrigin: "50% 0%" });
      if (ci !== 0)
        gsap.set(r.card, { autoAlpha: 0, yPercent: 8, scale: 0.97 });
      // Idle float on the gradient card
      gsap.to(r.tilt, {
        y: -8,
        duration: 2.4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    });

    /* ---- Item activation (per card) ---- */
    function setItem(ci, i, instant = false) {
      const r = refs[ci];
      if (i === r.active) return;
      const prev = r.active;
      const dir = i >= prev ? 1 : -1;
      r.active = i;
      const t = (v) => (instant ? 0 : v);
      const n = r.items.length;

      // Highlight the active item, dim the rest
      r.items.forEach((it, k) =>
        gsap.to(it, {
          ...(k === i ? ACTIVE : DIM),
          duration: t(0.4),
          overwrite: "auto",
        }),
      );

      // Previous item out
      if (prev >= 0) {
        gsap.to(r.labels[prev], {
          opacity: 0,
          y: -22 * dir,
          filter: "blur(8px)",
          duration: t(0.35),
          ease: "power2.in",
          overwrite: "auto",
        });
        gsap.to(r.nums[prev], {
          opacity: 0,
          yPercent: -35 * dir,
          duration: t(0.4),
          ease: "power2.in",
          overwrite: "auto",
        });
      }

      // Gradient card label
      gsap.fromTo(
        r.labels[i],
        { opacity: 0, y: 26 * dir, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: t(0.8),
          delay: t(0.12),
          ease: "power3.out",
          overwrite: "auto",
        },
      );

      // Giant numeral rolls in
      gsap.fromTo(
        r.nums[i],
        { opacity: 0, yPercent: 35 * dir },
        {
          opacity: 1,
          yPercent: 0,
          duration: t(0.9),
          ease: "power4.out",
          overwrite: "auto",
        },
      );

      // Title: orange wave rippling through the characters
      gsap.fromTo(
        r.chars[i],
        { y: 12, color: "#FF8C32" },
        {
          y: 0,
          color: "#ffffff",
          duration: t(0.8),
          stagger: t(0.015),
          ease: "power3.out",
          overwrite: "auto",
        },
      );

      // Visual card: springy flip + gradient angle shift
      gsap.fromTo(
        r.flip,
        { rotateY: -20 * dir, scale: 0.94, transformPerspective: 900 },
        {
          rotateY: 0,
          scale: 1,
          duration: t(1.1),
          ease: "elastic.out(1,.65)",
          overwrite: "auto",
        },
      );
      gsap.to(r.visual, {
        "--ang": 135 + i * 35 + "deg",
        duration: t(1),
        ease: "power2.out",
        overwrite: "auto",
      });

      // Progress rail
      gsap.to(r.fill, {
        scaleY: n > 1 ? i / (n - 1) : 0,
        duration: t(0.5),
        ease: "power2.out",
        overwrite: "auto",
      });
      r.nodes.forEach((nd, k) => {
        gsap.to(nd, {
          scale: k === i ? 1.6 : 1,
          boxShadow:
            k === i
              ? "0 0 8px 1px rgba(255,100,30,.35)"
              : "0 0 0 0 rgba(255,100,30,0)",
          duration: t(0.4),
          overwrite: "auto",
        });
        gsap.to(r.dots[k], {
          scale: k <= i ? 1 : 0,
          duration: t(0.4),
          overwrite: "auto",
        });
      });
    }

    /* ---- Inner scroll drives the active item ---- */
    const cue = $(".cue");
    refs.forEach((r, ci) => {
      const n = r.items.length;

      r.viewport.addEventListener(
        "scroll",
        () => {
          const v = r.viewport;
          const atEnd =
            v.scrollTop > 0 &&
            v.scrollTop + v.clientHeight >= v.scrollHeight - 4;
          let idx = 0;
          if (atEnd) idx = n - 1;
          else
            r.items.forEach((it, k) => {
              if (it.offsetTop <= v.scrollTop + v.clientHeight * 0.3) idx = k;
            });
          setItem(ci, idx);
          if (cue)
            gsap.to(cue, { opacity: 0, duration: 0.3, overwrite: "auto" });
        },
        { passive: true },
      );

      // Clicking an item also activates it (useful when nothing needs scrolling)
      r.items.forEach((it, k) =>
        it.addEventListener("click", () => setItem(ci, k)),
      );
    });

    /* ---- Tabs: swap cards ---- */
    let currentTab = -1;

    function setPill(i, instant = false) {
      const b = tabs[i];
      gsap.to(pill, {
        x: b.offsetLeft,
        width: b.offsetWidth,
        duration: instant ? 0 : 0.5,
        ease: "power3.out",
        overwrite: "auto",
      });
      tabs.forEach((t, k) => {
        t.setAttribute("aria-selected", k === i);
        t.classList.toggle("text-white", k === i);
        t.classList.toggle("text-gray-400", k !== i);
      });
    }

    function showCard(i, instant = false) {
      if (i === currentTab) return;
      const prev = currentTab;
      currentTab = i;
      setPill(i, instant);
      const d = instant ? 0 : 1;

      if (prev >= 0) {
        gsap.to(refs[prev].card, {
          autoAlpha: 0,
          yPercent: i > prev ? -6 : 6,
          scale: 0.97,
          duration: 0.45 * d,
          ease: "power2.inOut",
          overwrite: "auto",
        });
      }

      const r = refs[i];
      r.viewport.scrollTop = 0;
      gsap.fromTo(
        r.card,
        { autoAlpha: 0, yPercent: i > prev ? 6 : -6, scale: 0.97 },
        {
          autoAlpha: 1,
          yPercent: 0,
          scale: 1,
          duration: 0.6 * d,
          delay: 0.1 * d,
          ease: "power3.out",
          overwrite: "auto",
        },
      );

      // Replay the entrance effects for the first item
      r.active = -1;
      setItem(i, 0, instant);
    }

    tabs.forEach((btn, i) => btn.addEventListener("click", () => showCard(i)));

    showCard(0, true);
    document.fonts.ready.then(() => setPill(currentTab, true));
    window.addEventListener("resize", () => setPill(currentTab, true));

    /* ---- Ambient parallax on normal page scroll (no pin) ---- */
    const blobA = $(".blob-a");
    const blobB = $(".blob-b");
    const ghost = $(".ghost");
    const par = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: wrap,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
      },
    });
    if (blobA)
      par.fromTo(
        blobA,
        { xPercent: -10, yPercent: 0 },
        { xPercent: 70, yPercent: 40 },
        0,
      );
    if (blobB)
      par.fromTo(
        blobB,
        { xPercent: 0, yPercent: 0 },
        { xPercent: -60, yPercent: -40 },
        0,
      );
    if (ghost) par.fromTo(ghost, { xPercent: 0 }, { xPercent: -45 }, 0);

    /* ---- Pointer effects ---- */
    // Cursor spotlight on the card dots
    cardsWrap.addEventListener("pointermove", (e) => {
      refs.forEach((r) => {
        const b = r.card.getBoundingClientRect();
        r.card.style.setProperty("--mx", e.clientX - b.left + "px");
        r.card.style.setProperty("--my", e.clientY - b.top + "px");
      });
    });

    // 3D tilt on the gradient card
    refs.forEach((r) => {
      r.tilt.addEventListener("pointermove", (e) => {
        const b = r.tilt.getBoundingClientRect();
        const x = (e.clientX - b.left) / b.width - 0.5;
        const y = (e.clientY - b.top) / b.height - 0.5;
        gsap.to(r.tilt, {
          rotateY: x * 16,
          rotateX: -y * 16,
          transformPerspective: 900,
          duration: 0.5,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
      r.tilt.addEventListener("pointerleave", () => {
        gsap.to(r.tilt, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.9,
          ease: "elastic.out(1,.5)",
          overwrite: "auto",
        });
      });
    });
  }

  /* ========================================================================
     12. CLICK SOUND (global)
     Plays a short sound when a <button> or <a> is clicked (or activated by
     keyboard). A small audio pool lets rapid clicks overlap.
     ====================================================================== */

  function initClickSound() {
    const SRC = "assets/sounds/mouse-click.mp3";
    const VOLUME = 0.6;
    const POOL_SIZE = 4;

    // Pre-load a few audio elements so playback starts instantly
    const pool = Array.from({ length: POOL_SIZE }, () => {
      const audio = new Audio(SRC);
      audio.preload = "auto";
      audio.volume = VOLUME;
      return audio;
    });
    let index = 0;

    document.addEventListener(
      "click",
      (e) => {
        // Only react to buttons and links (including their child elements)
        if (!e.target.closest("button, a")) return;

        const audio = pool[index];
        index = (index + 1) % POOL_SIZE;

        audio.currentTime = 0;
        // Ignore autoplay-policy rejections
        audio.play().catch(() => {});
      },
      true, // capture, so it still fires if another handler stops propagation
    );
  }

  /* ========================================================================
     13. INIT (single entry point)
     Order matters: plugins first, then Lenis, then anything that creates
     ScrollTriggers in page order, then one final refresh.
     ====================================================================== */

  document.addEventListener("DOMContentLoaded", () => {
    // Features with no GSAP dependency
    initParallax();
    initClickSound();
    initMobileDrawer();
    initHeaderHide();
    initMusicPlayer();
    initFaq();
    initMarquee();
    initTestimonials();

    // GSAP-based features
    if (!hasGsap()) {
      console.error("GSAP / ScrollTrigger is not loaded.");
      return;
    }

    // Register plugins once (SplitText is optional)
    gsap.registerPlugin(ScrollTrigger);
    if (typeof SplitText !== "undefined") gsap.registerPlugin(SplitText);

    initSmoothScroll();
    initCtaButtons();
    initScrubText();
    initWorkCards();
    initResume();
  });

  // Recalculate trigger positions once images/fonts have finished loading
  window.addEventListener("load", () => {
    if (hasGsap()) ScrollTrigger.refresh();
  });
})();

// Load more project btn
(function () {
  const PER_PAGE = 4;

  const grid = document.getElementById("works-grid");
  const btn = document.getElementById("load-more-btn");
  const status = document.getElementById("works-status");
  if (!grid || !btn || !status) return;

  const items = Array.from(grid.querySelectorAll(":scope > .work-card"));
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Show only the first page, hide the rest
  items.forEach((item, i) => {
    if (i >= PER_PAGE) item.hidden = true;
  });

  btn.addEventListener("click", () => {
    const hiddenItems = items.filter((item) => item.hidden);

    // Nothing left to load: show message and remove the button
    if (hiddenItems.length === 0) {
      status.textContent = "No more projects available.";
      btn.hidden = true;
      return;
    }

    // Reveal the next page
    const nextBatch = hiddenItems.slice(0, PER_PAGE);
    nextBatch.forEach((item, i) => {
      item.hidden = false;

      if (!prefersReducedMotion) {
        item.animate(
          [
            { opacity: 0, transform: "translateY(24px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 500,
            delay: i * 80,
            easing: "ease-out",
            fill: "backwards",
          },
        );
      }
    });

    // Keyboard users land on the first new card
    nextBatch[0].focus({ preventScroll: true });
  });
})();


// 
document.querySelectorAll("[data-loop]").forEach(function (belt) {
      var originals = Array.from(belt.children);
      var clone = function (n) {
        var c = n.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.setAttribute("tabindex", "-1");
        belt.appendChild(c);
      };
      var guard = 0;
      while (belt.scrollWidth < window.innerWidth * 1.2 && guard++ < 6) originals.forEach(clone);
      var setCount = belt.children.length;
      for (var i = 0; i < setCount; i++) clone(belt.children[i]);
    });