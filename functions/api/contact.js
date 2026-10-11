// Cloudflare Pages Function: POST /api/contact
//
// Protection layers, in order:
//   1. Origin check: only accepts posts from your own site
//   2. Body size limit
//   3. Honeypot field: bots that fill it get a fake "ok"
//   4. Time trap: forms submitted in under 3 seconds get a fake "ok"
//   5. Cloudflare Turnstile: verified server-side on every request
//   6. Strict validation and length limits; all values are HTML-escaped in the email
// Add a Cloudflare WAF rate-limiting rule on /api/contact as the final layer (see README).
//
// Required environment variables (Pages → Settings → Variables and Secrets):
//   RESEND_API_KEY        (secret) Resend API key
//   TURNSTILE_SECRET_KEY  (secret) Turnstile secret key
//   CONTACT_TO            Inbox that receives inquiries, e.g. "you@jrsol.net" (comma-separate several)
//   CONTACT_FROM          Sender on a domain verified in Resend, e.g. "JRSOL Website <website@jrsol.net>"
// Optional:
//   ALLOWED_ORIGINS       Comma-separated origins, e.g. "https://jrsol.net,https://www.jrsol.net"
//                         (defaults to the origin the request was made to)
//   TURNSTILE_HOSTNAMES   Comma-separated hostnames the Turnstile token must come from

const LIMITS = { name: 100, email: 200, phone: 40, business: 150, message: 5000 };
const INDUSTRIES = {
  hospitality: "Hospitality",
  "real-estate": "Real estate",
  food: "Restaurants & food trucks",
  other: "Other",
};
const LANGS = { en: "English", es: "Spanish", pt: "Portuguese" };
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const MIN_FILL_MS = 3000;
const MAX_BODY_BYTES = 32 * 1024;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Single-line fields: drop control characters and newlines.
const oneLine = (s) => s.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
// Multi-line fields: keep newlines and tabs, drop other control characters.
const multiLine = (s) => s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim();

const list = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);

async function verifyTurnstile(token, ip, env) {
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET_KEY);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  if (!res.ok) return { success: false, "error-codes": [`http-${res.status}`] };
  return res.json();
}

export async function onRequestPost({ request, env }) {
  // Configuration check
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.error("contact: missing environment variables");
    return json(500, { ok: false, error: "server" });
  }

  // 1. Origin check
  const origin = request.headers.get("origin");
  const allowed = list(env.ALLOWED_ORIGINS);
  if (allowed.length === 0) allowed.push(new URL(request.url).origin);
  if (!origin || !allowed.includes(origin)) {
    return json(403, { ok: false, error: "forbidden" });
  }

  // 2. Size limit
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) return json(413, { ok: false, error: "invalid" });

  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, error: "invalid" });
  }
  const get = (key) => {
    const v = form.get(key);
    return typeof v === "string" ? v : "";
  };

  // 3. Honeypot: pretend it worked so bots don't adapt
  if (get("company_website").trim() !== "") return json(200, { ok: true });

  // 4. Time trap: too fast to be a person
  const elapsed = Number(get("_elapsed"));
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return json(200, { ok: true });

  // 5. Turnstile
  const token = get("cf-turnstile-response");
  if (!token || token.length > 2048) return json(400, { ok: false, error: "captcha" });
  let verdict;
  try {
    verdict = await verifyTurnstile(token, request.headers.get("CF-Connecting-IP"), env);
  } catch (err) {
    console.error("contact: turnstile request failed", err);
    return json(502, { ok: false, error: "server" });
  }
  if (!verdict.success) {
    console.warn("contact: turnstile rejected", verdict["error-codes"]);
    return json(403, { ok: false, error: "captcha" });
  }
  if (verdict.action && verdict.action !== "contact") return json(403, { ok: false, error: "captcha" });
  const hosts = list(env.TURNSTILE_HOSTNAMES);
  if (hosts.length && !hosts.includes(verdict.hostname)) return json(403, { ok: false, error: "captcha" });

  // 6. Validation
  const name = oneLine(get("name"));
  const email = oneLine(get("email")).toLowerCase();
  const phone = oneLine(get("phone"));
  const business = oneLine(get("business"));
  const message = multiLine(get("message"));
  const industryKey = get("industry");
  const langKey = get("lang");

  const valid =
    name.length >= 1 && name.length <= LIMITS.name &&
    email.length <= LIMITS.email && EMAIL_RE.test(email) &&
    phone.length <= LIMITS.phone && (phone === "" || /^[\d\s()+.\-]{7,}$/.test(phone)) &&
    business.length <= LIMITS.business &&
    message.length >= 10 && message.length <= LIMITS.message &&
    Object.hasOwn(INDUSTRIES, industryKey) &&
    Object.hasOwn(LANGS, langKey);
  if (!valid) return json(400, { ok: false, error: "invalid" });

  const industry = INDUSTRIES[industryKey];
  const language = LANGS[langKey];

  // Compose the email
  const subject = `New inquiry: ${name}${business ? ` (${business})` : ""} · ${industry}`.slice(0, 180);
  const rows = [
    ["Name", name],
    ["Email", email],
    ["Phone / WhatsApp", phone || "—"],
    ["Business", business || "—"],
    ["Industry", industry],
    ["Site language", language],
  ];
  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0D1B22;line-height:1.5">
<h2 style="margin:0 0 16px">New website inquiry</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#43555C;vertical-align:top">${escapeHtml(k)}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`)
    .join("")}</table>
<h3 style="margin:24px 0 8px">Message</h3>
<p style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</p>
<p style="color:#43555C;font-size:13px;margin-top:24px">Reply to this email to answer ${escapeHtml(name)} directly.</p>
</body></html>`;
  const text = `New website inquiry\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nMessage:\n${message}\n`;

  // Send with Resend
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: list(env.CONTACT_TO),
        reply_to: email,
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      console.error("contact: resend error", res.status, await res.text());
      return json(502, { ok: false, error: "server" });
    }
  } catch (err) {
    console.error("contact: resend request failed", err);
    return json(502, { ok: false, error: "server" });
  }

  return json(200, { ok: true });
}
