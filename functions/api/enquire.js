// Cloudflare Pages Function: POST /api/enquire
// Server-held secrets required in Cloudflare Pages Settings -> Environment Variables:
//   RESEND_API_KEY (required for confirmed email delivery; free tier: 3,000/mo, 100/day)
//   ENQUIRY_FROM   (optional, defaults to "ANEXTVID Website <onboarding@resend.dev>")
//   ENQUIRY_TO     (optional, defaults to "Anextvid@gmail.com")
//   TURNSTILE_SECRET (optional Cloudflare Turnstile secret)

export async function onRequestPost(context) {
  const { request, env } = context;

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON payload." }, 400);
  }

  // Honeypot spam trap
  if (body._gotcha && String(body._gotcha).trim() !== "") {
    return json({ ok: true, spamFiltered: true }, 200);
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const service = String(body.package || "General Inquiry").trim();
  const timeline = String(body.timeline || "Not specified").trim();
  const message = String(body.message || "").trim();

  if (name.length < 2 || name.length > 120) {
    return json({ ok: false, error: "Please enter your name." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }
  if (message.length < 5 || message.length > 4000) {
    return json({ ok: false, error: "Please share a short note about what you are working on." }, 400);
  }

  // Optional Turnstile verification
  if (env.TURNSTILE_SECRET) {
    const token = String(body.turnstileToken || "");
    if (!token) {
      return json({ ok: false, error: "Verification check missing." }, 400);
    }
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token })
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return json({ ok: false, error: "Verification failed. Please try again." }, 400);
    }
  }

  if (!env.RESEND_API_KEY) {
    return json({ ok: false, error: "Email delivery not configured yet.", fallback: true }, 503);
  }

  const attribution = {
    landing_page: String(body.landing_page || "/").slice(0, 200),
    utm_source: String(body.utm_source || "").slice(0, 100),
    utm_medium: String(body.utm_medium || "").slice(0, 100),
    utm_campaign: String(body.utm_campaign || "").slice(0, 100),
    utm_content: String(body.utm_content || "").slice(0, 100)
  };

  const textBody = [
    `New ANEXTVID Project Enquiry`,
    `----------------------------`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Service: ${service}`,
    `Timeline: ${timeline}`,
    ``,
    `Project Details:`,
    message,
    ``,
    `Attribution:`,
    `Landing Page: ${attribution.landing_page}`,
    `UTM Source: ${attribution.utm_source || "(direct)"}`,
    `UTM Medium: ${attribution.utm_medium || "-"}`,
    `UTM Campaign: ${attribution.utm_campaign || "-"}`,
    `UTM Content: ${attribution.utm_content || "-"}`
  ].join("\n");

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.ENQUIRY_FROM || "ANEXTVID Website <onboarding@resend.dev>",
      to: [(env.ENQUIRY_TO || "anextvid@gmail.com").toLowerCase()],
      reply_to: email,
      subject: `ANEXTVID Enquiry: ${service} — ${name}`,
      text: textBody
    })
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    return json({ ok: false, error: "Upstream email provider error.", detail: errText.slice(0, 200) }, 502);
  }

  const resendData = await resendRes.json();
  return json({ ok: true, confirmed: true, id: resendData.id || null }, 200);
}
