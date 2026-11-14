// Privacy-safe, zero-PII behavioural analytics for ANEXTVID
// Supports PostHog (cookieless memory mode) + local debug buffer when key is unset.
(function () {
  const OPTOUT_KEY = "anextvid_analytics_optout";
  window.__anextvidEvents = window.__anextvidEvents || [];

  function isOptedOut() {
    try {
      if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return true;
      return localStorage.getItem(OPTOUT_KEY) === "1";
    } catch {
      return false;
    }
  }

  function getAttribution() {
    const params = new URLSearchParams(window.location.search);
    const current = {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || ""
    };
    try {
      const saved = JSON.parse(sessionStorage.getItem("anextvid_attr") || "{}");
      const merged = {
        landing_page: saved.landing_page || window.location.pathname,
        utm_source: current.utm_source || saved.utm_source || "",
        utm_medium: current.utm_medium || saved.utm_medium || "",
        utm_campaign: current.utm_campaign || saved.utm_campaign || "",
        utm_content: current.utm_content || saved.utm_content || ""
      };
      sessionStorage.setItem("anextvid_attr", JSON.stringify(merged));
      return merged;
    } catch {
      return { landing_page: window.location.pathname, ...current };
    }
  }

  window.ANEXTVID_ANALYTICS = {
    getAttribution,
    isOptedOut,
    setOptOut(val) {
      try {
        if (val) localStorage.setItem(OPTOUT_KEY, "1");
        else localStorage.removeItem(OPTOUT_KEY);
      } catch {}
    },
    track(eventName, props = {}) {
      if (isOptedOut()) return;
      // Strip any accidental PII keys
      const clean = { ...props };
      delete clean.name;
      delete clean.email;
      delete clean.phone;
      delete clean.message;

      const attr = getAttribution();
      const payload = {
        event: eventName,
        path: window.location.pathname,
        referrer: document.referrer || "",
        utm_source: attr.utm_source,
        utm_medium: attr.utm_medium,
        utm_campaign: attr.utm_campaign,
        utm_content: attr.utm_content,
        ...clean,
        ts: Date.now()
      };

      window.__anextvidEvents.push(payload);
      if (window.posthog && typeof window.posthog.capture === "function") {
        window.posthog.capture(eventName, payload);
      }
    }
  };

  // Optional PostHog init if key is provided in window.ANEXTVID_CONFIG
  const cfg = window.ANEXTVID_CONFIG || {};
  if (!isOptedOut() && cfg.posthogKey) {
    const s = document.createElement("script");
    s.async = true;
    s.src = (cfg.posthogHost || "https://eu.i.posthog.com") + "/static/array.js";
    s.onload = () => {
      if (window.posthog) {
        window.posthog.init(cfg.posthogKey, {
          api_host: cfg.posthogHost || "https://eu.i.posthog.com",
          persistence: "memory",
          autocapture: false,
          capture_pageview: false,
          disable_session_recording: true
        });
        window.ANEXTVID_ANALYTICS.track("$pageview");
      }
    };
    document.head.appendChild(s);
  } else {
    window.addEventListener("DOMContentLoaded", () => {
      window.ANEXTVID_ANALYTICS.track("$pageview");
    });
  }

  // Active time on page (excludes background tabs)
  let visibleStart = document.visibilityState === "visible" ? performance.now() : null;
  let activeMs = 0;
  let maxScrollPct = 0;

  function updateScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    if (max > 0) {
      const pct = Math.min(100, Math.round((window.scrollY / max) * 100));
      if (pct > maxScrollPct) maxScrollPct = pct;
    }
  }
  window.addEventListener("scroll", updateScroll, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && visibleStart !== null) {
      activeMs += performance.now() - visibleStart;
      visibleStart = null;
    } else if (document.visibilityState === "visible" && visibleStart === null) {
      visibleStart = performance.now();
    }
  });

  window.addEventListener("pagehide", () => {
    if (visibleStart !== null) {
      activeMs += performance.now() - visibleStart;
      visibleStart = null;
    }
    window.ANEXTVID_ANALYTICS.track("page_active_time", {
      active_seconds: Math.round(activeMs / 1000),
      max_scroll_pct: maxScrollPct
    });
  });

  // CTA click tracking
  document.addEventListener("click", (e) => {
    const el = e.target.closest("a, button");
    if (!el) return;
    const href = el.getAttribute("href") || "";
    const text = (el.textContent || "").trim();
    if (href.startsWith("mailto:")) {
      window.ANEXTVID_ANALYTICS.track("cta_click", { cta_label: "email", target: "mailto" });
    } else if (href.includes("wa.me/")) {
      window.ANEXTVID_ANALYTICS.track("cta_click", { cta_label: "whatsapp", target: "whatsapp" });
    } else if (
      el.classList.contains("js-showreel-v2") ||
      text === "See the work" ||
      text === "Talk through a project" ||
      text === "Watch the showreel"
    ) {
      window.ANEXTVID_ANALYTICS.track("cta_click", { cta_label: text, target: href || "modal" });
    }
  });

  // Deduplicated Video Milestone Tracker (ignores seek-jumps & replays)
  window.createVideoMilestoneTracker = function (videoId, playerType) {
    const reached = new Set();
    let watchedSeconds = 0;
    let lastTime = 0;

    return {
      onPlay() {
        if (!reached.has("start")) {
          reached.add("start");
          window.ANEXTVID_ANALYTICS.track("video_milestone", {
            video_id: videoId, player_type: playerType, milestone: "start", watch_seconds: Math.round(watchedSeconds)
          });
        }
      },
      onProgress(currentTime, duration) {
        if (!duration || duration <= 0) return;
        const delta = currentTime - lastTime;
        // Only accumulate watch time on normal forward playback (0 < delta <= 2.0s), ignore seek jumps
        if (delta > 0 && delta <= 2.0) {
          watchedSeconds += delta;
        }
        lastTime = currentTime;

        const pct = (currentTime / duration) * 100;
        const watchPct = (watchedSeconds / duration) * 100;
        // Require actual watched time >= milestone threshold so seeking to 90% doesn't fake 25/50/75
        [25, 50, 75, 95].forEach((m) => {
          const label = m === 95 ? "complete" : String(m);
          if (pct >= m && watchPct >= m * 0.7 && !reached.has(label)) {
            reached.add(label);
            window.ANEXTVID_ANALYTICS.track("video_milestone", {
              video_id: videoId, player_type: playerType, milestone: label, watch_seconds: Math.round(watchedSeconds)
            });
          }
        });
      }
    };
  };
})();
