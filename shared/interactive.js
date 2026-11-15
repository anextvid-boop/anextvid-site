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
})();
