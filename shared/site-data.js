// Shared ANEXTVID data & accessible interactive helpers
window.ANEXTVID_DATA = {
  brand: {
    name: "ANEXTVID",
    founder: "Jahronimo Ellis",
    tagline: "Video production, photography and LinkedIn content for founders and B2B teams.",
    location: "Brighton, UK",
    email: "Anextvid@gmail.com",
    phoneDisplay: "07538 068550",
    whatsappUrl: "https://wa.me/447538068550",
    sisterCompany: {
      name: "THEBOLDEST.",
      url: "https://theboldeststudio.com/"
    }
  },

  caseStudy: {
    id: "founder-b2b-system",
    showreelId: "Ow0lct6Ft_U"
  },

  videos: {
    youtube: [
      { id: "Ow0lct6Ft_U", title: "Featured Brand & Content Production", category: "Showreel" },
      { id: "R_Sp1-Hm8zU", title: "Commercial & Social Campaign", category: "Video Marketing" },
      { id: "Z-EjqwN0e5I", title: "Personal Brand & Executive Visuals", category: "B2B / LinkedIn" },
      { id: "QkFMmZKzOAA", title: "High-Impact Motion & Storytelling", category: "Production" },
      { id: "foie-hJEEoM", title: "Creative Direction & Edit Showcase", category: "Post-Production" }
    ]
  },

  termsHtml: `
    <p>These Terms and Conditions (“Agreement”) govern the provision of video production, content creation, and associated services provided by ANEXTVID (“we”, “our”, or “us”) to the client (“you” or “the Client”).</p>
    <h4>1. Services Provided</h4>
    <p>We provide video production, photography, editing, social media management, content strategy, and delivery of final content as described in your proposal, package, or statement of work.</p>
    <h4>2. Payment Terms</h4>
    <ul>
      <li><strong>Payment Schedule:</strong> A 50% deposit is required to confirm your booking. The remaining balance is due upon completion or as outlined in your payment plan.</li>
      <li><strong>Late Payments:</strong> Subject to a late fee of 10% of the total project fee per week.</li>
      <li><strong>Hourly Rate:</strong> Additional out-of-scope services are billed at £50/hour.</li>
      <li><strong>Refunds:</strong> No refunds once a project has commenced unless agreed in writing.</li>
    </ul>
    <h4>3. Revisions</h4>
    <p>Packages include a specified number of revisions (typically two rounds per video or photo). Additional rounds or major brief changes are billed at £50/hour.</p>
    <h4>4. Content Delivery & Turnaround</h4>
    <p>Final deliverables are provided in agreed formats (e.g., MP4 for video, JPEG/PNG for photos). Timelines may shift if client feedback or external factors delay production.</p>
    <h4>5. Client Responsibilities</h4>
    <p>You agree to provide timely access to logos, branding materials, shooting locations (if applicable), and necessary property, model, and copyright clearances.</p>
    <h4>6. Intellectual Property & Usage Rights</h4>
    <p>Upon full payment, you own the final deliverables. ANEXTVID retains the right to feature deliverables in our portfolio and promotional materials unless agreed otherwise in writing.</p>
    <h4>7. Cancellation & Termination</h4>
    <p>Written notice is required. Cancellations prior to shoot incur 50% of total project cost; after shoot commencement, 100% is due.</p>
    <h4>8. Confidentiality, Liability & Governing Law</h4>
    <p>Both parties keep proprietary information confidential. Liability is limited to the amount paid for services. Governed by the laws of the United Kingdom.</p>
  `
};

// Load YouTube IFrame API once on demand and bind milestone tracking
window.mountTrackedYouTube = function (containerEl, videoId, title) {
  const uid = "yt-player-" + videoId + "-" + Math.random().toString(36).slice(2, 7);
  containerEl.innerHTML = `<iframe id="${uid}" src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1&cc_load_policy=1" title="${title || "ANEXTVID Video"}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0;display:block;"></iframe>`;

  const tracker = window.createVideoMilestoneTracker
    ? window.createVideoMilestoneTracker(videoId, "youtube")
    : null;
  if (!tracker) return;

  const attachApi = () => {
    if (!window.YT || !window.YT.Player) return;
    let pollTimer = null;
    new window.YT.Player(uid, {
      events: {
        onStateChange(ev) {
          if (ev.data === window.YT.PlayerState.PLAYING) {
            tracker.onPlay();
            if (!pollTimer) {
              pollTimer = setInterval(() => {
                try {
                  tracker.onProgress(ev.target.getCurrentTime(), ev.target.getDuration());
                } catch {}
              }, 500);
            }
          } else if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
        }
      }
    });
  };

  if (window.YT && window.YT.Player) {
    attachApi();
  } else {
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === "function") prevReady();
      attachApi();
    };
  }
};

window.initYouTubeFacades = function (containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.innerHTML = window.ANEXTVID_DATA.videos.youtube.map((v, i) => `
    <article class="yt-card" data-yt-id="${v.id}">
      <div class="yt-thumb-wrap">
        <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="${v.title}" width="480" height="360" loading="lazy" />
        <button class="yt-play-btn" type="button" aria-label="Play ${v.title}">
          <span aria-hidden="true">▶</span>
        </button>
        <span class="yt-badge">${v.category}</span>
      </div>
      <div class="yt-meta">
        <span class="yt-index">0${i + 1}</span>
        <h3>${v.title}</h3>
      </div>
    </article>
  `).join("");

  container.addEventListener("click", (e) => {
    const card = e.target.closest(".yt-card");
    if (!card || card.classList.contains("is-playing")) return;
    const id = card.getAttribute("data-yt-id");
    const title = card.querySelector("h3")?.textContent || "ANEXTVID Video";
    const wrap = card.querySelector(".yt-thumb-wrap");
    window.mountTrackedYouTube(wrap, id, title);
    card.classList.add("is-playing");
  });
};

function createAccessibleModal({ id, title, bodyHtml, triggerSelector, onOpen, onClose }) {
  const modal = document.createElement("div");
  modal.id = id;
  modal.className = "av-modal";
  modal.setAttribute("hidden", "");
  modal.innerHTML = `
    <div class="av-modal-backdrop" data-close="true"></div>
    <div class="av-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
      <div class="av-modal-header">
        <h3 id="${id}-title">${title}</h3>
        <button type="button" class="av-modal-close" aria-label="Close modal">✕</button>
      </div>
      <div class="av-modal-body">${bodyHtml}</div>
    </div>
  `;
  document.body.appendChild(modal);

  let lastTrigger = null;
  const closeBtn = modal.querySelector(".av-modal-close");

  const open = (e) => {
    e.preventDefault();
    lastTrigger = e.currentTarget;
    modal.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    if (onOpen) onOpen(modal);
    closeBtn.focus();
  };

  const close = () => {
    if (modal.hasAttribute("hidden")) return;
    modal.setAttribute("hidden", "");
    document.body.style.overflow = "";
    if (onClose) onClose(modal);
    if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
  };

  document.querySelectorAll(triggerSelector).forEach((el) => el.addEventListener("click", open));
  modal.querySelector(".av-modal-backdrop").addEventListener("click", close);
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

window.initTermsModal = function (triggerSelector) {
  createAccessibleModal({
    id: "av-terms-modal",
    title: "Terms &amp; Conditions — ANEXTVID",
    bodyHtml: window.ANEXTVID_DATA.termsHtml,
    triggerSelector
  });
};

window.initPrivacyModal = function (triggerSelector) {
  const optedOut = window.ANEXTVID_ANALYTICS && window.ANEXTVID_ANALYTICS.isOptedOut();
  createAccessibleModal({
    id: "av-privacy-modal",
    title: "Privacy &amp; Analytics Notice — ANEXTVID",
    bodyHtml: `
      <p>ANEXTVID uses privacy-first, cookieless statistical analytics (Cloudflare Web Analytics and memory-only PostHog) solely to understand which pages and videos help B2B visitors.</p>
      <ul>
        <li>No advertising pixels, cross-site tracking, or session recordings are used.</li>
        <li>Names, email addresses, phone numbers, and enquiry messages are <strong>never</strong> sent to behavioural analytics.</li>
      </ul>
      <div style="margin-top:1.25rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
        <button type="button" id="av-optout-btn" class="btn btn-ghost">${optedOut ? "Analytics Opted Out (Click to Re-enable)" : "Opt Out of Statistical Analytics"}</button>
      </div>
    `,
    triggerSelector,
    onOpen: (modal) => {
      const btn = modal.querySelector("#av-optout-btn");
      if (btn && window.ANEXTVID_ANALYTICS) {
        btn.onclick = () => {
          const next = !window.ANEXTVID_ANALYTICS.isOptedOut();
          window.ANEXTVID_ANALYTICS.setOptOut(next);
          btn.textContent = next ? "Analytics Opted Out (Click to Re-enable)" : "Opt Out of Statistical Analytics";
        };
      }
    }
  });
};

window.initShowreelModal = function (triggerSelector) {
  const ytId = window.ANEXTVID_DATA.caseStudy.showreelId;
  createAccessibleModal({
    id: "av-showreel-modal",
    title: "ANEXTVID — Featured Showreel",
    bodyHtml: `
      <div class="showreel-frame-wrap" style="position:relative;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;"></div>
      <p style="margin-top:0.85rem;font-size:0.85rem;">Captions can be toggled via CC in the player. <a href="/watch/showreel/" style="color:var(--violet-soft);">Read the showreel overview &amp; transcript →</a></p>
    `,
    triggerSelector,
    onOpen: (modal) => {
      window.mountTrackedYouTube(modal.querySelector(".showreel-frame-wrap"), ytId, "ANEXTVID Showreel");
    },
    onClose: (modal) => {
      modal.querySelector(".showreel-frame-wrap").innerHTML = "";
    }
  });
};

window.initMobileMenu = function (toggleSelector, navSelector) {
  const toggle = document.querySelector(toggleSelector);
  const nav = document.querySelector(navSelector);
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
};

window.initContactForm = function (formSelector) {
  const form = document.querySelector(formSelector);
  if (!form) return;
  const statusEl = form.querySelector(".form-status");
  const pkgSelect = form.querySelector('select[name="package"]');

  // Preselect service if arriving from a service page (?service=...)
  const params = new URLSearchParams(window.location.search);
  const svc = params.get("service");
  if (svc && pkgSelect) {
    const match = Array.from(pkgSelect.options).find(
      (o) => o.value.toLowerCase().includes(svc.toLowerCase())
    );
    if (match) pkgSelect.value = match.value;
  }

  let started = false;
  form.addEventListener("focusin", () => {
    if (!started) {
      started = true;
      if (window.ANEXTVID_ANALYTICS) {
        window.ANEXTVID_ANALYTICS.track("form_start", {
          selected_package: pkgSelect ? pkgSelect.value : ""
        });
      }
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const pkg = String(data.get("package") || "General Inquiry").trim();
    const timeline = String(data.get("timeline") || "Not specified").trim();
    const msg = String(data.get("message") || "").trim();
    const gotcha = String(data.get("_gotcha") || "");

    const attr = window.ANEXTVID_ANALYTICS
      ? window.ANEXTVID_ANALYTICS.getAttribution()
      : { landing_page: window.location.pathname };

    if (window.ANEXTVID_ANALYTICS) {
      window.ANEXTVID_ANALYTICS.track("form_accepted", {
        selected_package: pkg,
        timeline
      });
    }

    if (statusEl) statusEl.textContent = "Sending enquiry...";

    try {
      const res = await fetch("/api/enquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, package: pkg, timeline, message: msg, _gotcha: gotcha, ...attr
        })
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.confirmed) {
        if (window.ANEXTVID_ANALYTICS) {
          window.ANEXTVID_ANALYTICS.track("form_confirmed", {
            selected_package: pkg,
            timeline
          });
        }
        if (statusEl) statusEl.textContent = "Enquiry received! Jahronimo will reply shortly.";
        form.reset();
        return;
      }
    } catch {}

    // Clean fallback if running locally without Pages Functions or before RESEND_API_KEY is set
    const text = encodeURIComponent(`Hi Jahronimo, I'm ${name} (${email}).\nService: ${pkg}\nTimeline: ${timeline}\n\n${msg}`);
    if (statusEl) {
      statusEl.innerHTML = `Send directly via <a href="https://wa.me/447538068550?text=${text}" target="_blank" rel="noopener">WhatsApp</a> or <a href="mailto:Anextvid@gmail.com?subject=${encodeURIComponent("ANEXTVID Enquiry - " + name)}&body=${text}">Anextvid@gmail.com</a>.`;
    }
  });
};
