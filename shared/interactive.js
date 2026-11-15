/* Shared interactive behaviors for ANEXTVID Preview A & Preview B */
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  // 1. Hero background video Pause / Play toggle
  window.initHeroMediaToggle = function (videoId, btnId) {
    const vid = document.getElementById(videoId);
    const btn = document.getElementById(btnId);
    if (!vid || !btn) return;
    const sync = () => {
      btn.textContent = vid.paused ? "Play background" : "Pause background";
      btn.setAttribute("aria-pressed", vid.paused ? "true" : "false");
    };
    if (reduceMotion) vid.pause();
    sync();
    vid.addEventListener("play", sync);
    vid.addEventListener("pause", sync);
    btn.addEventListener("click", () => {
      if (vid.paused) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  };

  // 2. Slow, pausable marquee that reacts to scroll velocity (replaces stationary scroll-only ticker)
  window.initPausableTicker = function (trackId, toggleBtnId) {
    const track = document.getElementById(trackId);
    const toggleBtn = document.getElementById(toggleBtnId);
    if (!track) return;

    let xPos = 0;
    let scrollBoost = 0;
    let userPaused = reduceMotion;
    let hoverPaused = false;
    const BASE_SPEED = 0.55; // calm continuous drift so banner never looks broken/stationary

    const syncBtn = () => {
      if (!toggleBtn) return;
      toggleBtn.textContent = userPaused ? "Play ticker" : "Pause ticker";
      toggleBtn.setAttribute("aria-pressed", userPaused ? "true" : "false");
    };
    syncBtn();

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        userPaused = !userPaused;
        syncBtn();
      });
    }

    const band = track.closest(".ticker-band-wrap") || track.parentElement;
    if (band) {
      band.addEventListener("mouseenter", () => { hoverPaused = true; });
      band.addEventListener("mouseleave", () => { hoverPaused = false; });
      band.addEventListener("focusin", () => { hoverPaused = true; });
      band.addEventListener("focusout", () => { hoverPaused = false; });
    }

    if (window.ScrollTrigger) {
      window.ScrollTrigger.create({
        onUpdate(self) {
          const v = self.getVelocity() * 0.006;
          scrollBoost = Math.max(-10, Math.min(10, v));
        }
      });
    }

    const wrapWidth = () => (track.firstElementChild ? track.firstElementChild.offsetWidth : 1000);

    const tick = () => {
      scrollBoost *= 0.92;
      if (Math.abs(scrollBoost) < 0.02) scrollBoost = 0;

      if (!userPaused && !hoverPaused) {
        const delta = BASE_SPEED + scrollBoost;
        xPos -= delta;
        const w = wrapWidth();
        if (w > 0) xPos = ((xPos % w) - w) % w;
        if (window.gsap) {
          window.gsap.set(track, { x: xPos });
        } else {
          track.style.transform = `translate3d(${xPos}px, 0, 0)`;
        }
      }
      requestAnimationFrame(tick);
    };

    if (!reduceMotion) {
      requestAnimationFrame(tick);
    }
  };

  // 3. Founder portrait pointer-responsive depth (falls back to still on touch / reduced-motion)
  window.initFounderPortraitStudy = function (stageId) {
    const stage = document.getElementById(stageId);
    if (!stage || reduceMotion || coarsePointer) return;

    let rafId = null;
    let targetX = 0;
    let targetY = 0;

    const apply = () => {
      rafId = null;
      stage.style.setProperty("--px", targetX.toFixed(3));
      stage.style.setProperty("--py", targetY.toFixed(3));
    };

    stage.addEventListener("pointermove", (ev) => {
      if (ev.pointerType && ev.pointerType !== "mouse" && ev.pointerType !== "pen") return;
      const rect = stage.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, ((ev.clientX - rect.left) / rect.width - 0.5) * 2));
      targetY = Math.max(-1, Math.min(1, ((ev.clientY - rect.top) / rect.height - 0.5) * 2));
      if (!rafId) rafId = requestAnimationFrame(apply);
    });

    stage.addEventListener("pointerleave", () => {
      targetX = 0;
      targetY = 0;
      if (!rafId) rafId = requestAnimationFrame(apply);
    });
  };

  // 4. Accessible mobile menu toggle (<840px)
  window.initMobileNav = function (toggleId, navId) {
    const btn = document.getElementById(toggleId);
    const nav = document.getElementById(navId);
    if (!btn || !nav) return;

    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Close" : "Menu";
    };

    btn.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });
  };

  // 5. Interchangeable B2B hero headlines + tested text entrance animation
  const HERO_PHRASES = [
    ["Show the work", "you’re already doing.", "Build trust", "every month."],
    ["Turn real work", "into B2B video", "and LinkedIn", "authority."],
    ["One calm shoot.", "Months of video,", "stills and", "founder trust."],
    ["B2B video,", "product demos", "and LinkedIn", "that compounds."]
  ];

  window.initKineticHero = function (selector, defaultVariant) {
    const h1 = document.querySelector(selector);
    if (!h1) return { variant: "none", phraseIndex: 0 };

    let idx = 0;
    try {
      const prev = parseInt(localStorage.getItem("anextvid_hero_idx") || "-1", 10);
      idx = Number.isFinite(prev) ? (prev + 1) % HERO_PHRASES.length : 0;
      localStorage.setItem("anextvid_hero_idx", String(idx));
    } catch {}

    const lines = HERO_PHRASES[idx];
    h1.innerHTML = lines
      .map((line, i) =>
        i === lines.length - 1
          ? `<span class="word accent-word">${line}</span>`
          : `<span class="word">${line}</span>`
      )
      .join(" ");

    const params = new URLSearchParams(window.location.search);
    const variant = params.get("anim") || defaultVariant || "blur-rise";

    if (reduceMotion || !window.gsap) {
      return { variant: "reduced", phraseIndex: idx };
    }

    const words = h1.querySelectorAll(".word");
    if (variant === "word-stagger") {
      window.gsap.from(words, {
        y: 28, opacity: 0, rotateX: -18, stagger: 0.06, duration: 0.62, ease: "power3.out", clearProps: "transform"
      });
    } else if (variant === "mask-wipe") {
      window.gsap.fromTo(words,
        { yPercent: 90, clipPath: "inset(0 0 100% 0)", opacity: 0.2 },
        { yPercent: 0, clipPath: "inset(0 0 0% 0)", opacity: 1, stagger: 0.08, duration: 0.65, ease: "power3.out", clearProps: "transform,clipPath" }
      );
    } else {
      // blur-rise: crisp editorial entrance with zero layout shift
      window.gsap.fromTo(words,
        { y: 18, opacity: 0, filter: "blur(6px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", stagger: 0.07, duration: 0.6, ease: "power2.out", clearProps: "transform,filter" }
      );
    }

    return { variant, phraseIndex: idx };
  };
})();
