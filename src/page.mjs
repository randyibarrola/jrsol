// Renders one language version of the homepage (and the 404 page) to static HTML.

import { LANGS } from "./i18n.mjs";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const pad = (n) => String(n).padStart(2, "0");

// The JRSOL mark: a sun setting between two code brackets.
// variant "light" = for light backgrounds, "dark" = for dark backgrounds.
const mark = (size, variant = "light", extra = "") =>
  `<svg class="mark mark--${variant}${extra ? " " + extra : ""}" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><polyline points="20,18 8,32 20,46"/><polyline points="44,18 56,32 44,46"/><circle cx="32" cy="32" r="11"/><rect x="19" y="34" width="26" height="2.6"/><rect x="19" y="39.4" width="26" height="2.6"/></svg>`;

const check = `<svg class="check" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

const icons = {
  h: `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>`,
  r: `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 21V4h10v17"/><path d="M14 9h6v12"/><path d="M3 21h18"/><path d="M8 8h2M8 12h2M8 16h2"/></svg>`,
  f: `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3v18"/><path d="M4 3v5a3 3 0 0 0 6 0V3"/><path d="M17 21V3c-2.2 0-3.5 2.5-3.5 6v4H17"/></svg>`,
};

function head({ lang, t, config, assets, path, title, description, noindex = false }) {
  const url = config.siteUrl + path;
  const alternates = noindex
    ? ""
    : LANGS.map((l) => `<link rel="alternate" hreflang="${l.html}" href="${config.siteUrl}${l.path}">`).join("\n") +
      `\n<link rel="alternate" hreflang="x-default" href="${config.siteUrl}/">`;

  const ld = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "JRSOL",
    url,
    logo: `${config.siteUrl}/logo-512.png`,
    image: `${config.siteUrl}/og-image.png`,
    description,
    areaServed: { "@type": "City", name: "Orlando" },
    address: { "@type": "PostalAddress", addressLocality: "Orlando", addressRegion: "FL", addressCountry: "US" },
    availableLanguage: ["English", "Spanish", "Portuguese"],
    knowsAbout: ["Web development", "Custom software", "Mobile apps", "AI automation", "AI agents"],
    ...(config.phone ? { telephone: config.phone } : {}),
    ...(config.email ? { email: config.email } : {}),
  };
  const ldJson = JSON.stringify(ld).replace(/</g, "\\u003c");

  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">\n${alternates}`}
<meta name="theme-color" content="#0D1B22">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="JRSOL">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${config.siteUrl}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${lang.ogLocale}">
${LANGS.filter((l) => l.code !== lang.code).map((l) => `<meta property="og:locale:alternate" content="${l.ogLocale}">`).join("\n")}
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&amp;family=Instrument+Sans:wght@400..700&amp;family=JetBrains+Mono:wght@500;600&amp;display=swap">
<link rel="stylesheet" href="${assets.css}">
${noindex ? "" : `<script type="application/ld+json">${ldJson}</script>`}
</head>`;
}

function header({ lang, t, home }) {
  const switcher = LANGS.map(
    (l) =>
      `<a class="lang" href="${l.path}" hreflang="${l.html}" lang="${l.html}" title="${esc(l.name)}"${l.code === lang.code ? ' aria-current="true"' : ""}>${l.label}</a>`
  ).join("");
  return `<header class="site-header">
<div class="wrap header-row">
<a class="brand" href="${lang.path}" aria-label="JRSOL">${mark(44, "light")}<span class="wordmark">JRSOL</span></a>
<nav class="main-nav" aria-label="Main">
<a href="${home}#industries">${esc(t.nav.industries)}</a>
<a href="${home}#ai">${esc(t.nav.ai)}</a>
<a href="${home}#process">${esc(t.nav.process)}</a>
<a href="${home}#contact">${esc(t.nav.contact)}</a>
</nav>
<div class="header-actions">
<nav class="langs" aria-label="${esc(t.nav.lang)}">${switcher}</nav>
<a class="btn btn--sun btn--sm" href="${home}#contact">${esc(t.nav.cta)}</a>
</div>
</div>
</header>`;
}

function footer({ t }) {
  return `<footer class="site-footer">
<div class="wrap footer-row">
<div class="footer-brand">${mark(44, "dark")}<div><span class="wordmark">JRSOL</span><span class="footer-tag">${esc(t.footer.tag)}</span></div></div>
<div class="footer-meta"><span>English · Español · Português</span><span>${esc(t.footer.rights)}</span></div>
</div>
</footer>`;
}

function industryCard(c, key) {
  return `<article class="card ind-card">
<div class="ind-icon">${icons[key]}</div>
<p class="eyebrow eyebrow--sm">${esc(c.tag)}</p>
<h3>${esc(c.title)}</h3>
<p class="muted">${esc(c.desc)}</p>
<ul class="checks">${c.points.map((p) => `<li>${check}<span>${esc(p)}</span></li>`).join("")}</ul>
</article>`;
}

export function renderPage({ lang, t, config, assets }) {
  const c = t.contact;
  const contactLines = [
    config.phone ? `<a href="tel:${esc(config.phone.replace(/[^\d+]/g, ""))}">${esc(config.phone)}</a>` : "",
    config.email ? `<a href="mailto:${esc(config.email)}">${esc(config.email)}</a>` : "",
    `<span class="muted">${esc(config.city)}</span>`,
  ].filter(Boolean).join("\n");

  return `<!doctype html>
<html lang="${lang.html}">
${head({ lang, t, config, assets, path: lang.path, title: t.meta.title, description: t.meta.description })}
<body>
<a class="skip" href="#main">${esc(t.skip)}</a>
${header({ lang, t, home: "" })}
<main id="main">

<section class="wrap hero" id="top">
<div class="hero-copy">
<p class="eyebrow"><span class="dot" aria-hidden="true"></span>${esc(t.hero.eyebrow)}</p>
<h1>${esc(t.hero.title)}</h1>
<p class="lead">${esc(t.hero.sub)}</p>
<div class="btn-row">
<a class="btn btn--ink" href="#contact">${esc(t.hero.cta1)}</a>
<a class="btn btn--outline" href="#ai">${esc(t.hero.cta2)}</a>
</div>
<p class="muted small">${esc(t.hero.langs)}</p>
</div>
<figure class="chat" aria-label="${esc(t.chat.label)}">
<div class="chat-head">
<div class="avatar">${mark(30, "dark")}</div>
<div class="chat-id"><span class="chat-name">JRSOL Concierge</span><span class="chat-status"><span class="online" aria-hidden="true"></span>${esc(t.chat.status)}</span></div>
</div>
<div class="chat-body">
<p class="bubble bubble--out">${esc(t.chat.m1)}</p>
<p class="bubble bubble--in">${esc(t.chat.m2)}</p>
<p class="bubble bubble--out">${esc(t.chat.m3)}</p>
<p class="bubble bubble--in">${esc(t.chat.m4)}</p>
</div>
<figcaption class="chat-caption">${esc(t.chat.label)}</figcaption>
</figure>
</section>

<section class="wrap section" id="industries" aria-labelledby="ind-title">
<div class="section-head">
<p class="eyebrow">${esc(t.ind.eyebrow)}</p>
<h2 id="ind-title">${esc(t.ind.title)}</h2>
<p class="lead lead--sm">${esc(t.ind.sub)}</p>
</div>
<div class="grid grid--3">
${industryCard(t.ind.h, "h")}
${industryCard(t.ind.r, "r")}
${industryCard(t.ind.f, "f")}
</div>
<div class="custom-strip">
<div><h3>${esc(t.ind.custom.title)}</h3><p>${esc(t.ind.custom.desc)}</p></div>
<a class="btn btn--sun" href="#contact">${esc(t.ind.custom.cta)}</a>
</div>
</section>

<section class="dark" id="ai" aria-labelledby="ai-title">
<div class="wrap section">
<div class="section-head">
<p class="eyebrow eyebrow--sun">${esc(t.ai.eyebrow)}</p>
<h2 id="ai-title">${esc(t.ai.title)}</h2>
<p class="lead lead--sm">${esc(t.ai.sub)}</p>
</div>
<div class="grid grid--ai">
${t.ai.items.map((it, i) => `<article class="ai-card">
<span class="ai-num">${pad(i + 1)}</span>
<h3>${esc(it.title)}</h3>
<p>${esc(it.desc)}</p>
<div class="ai-ex"><span class="ai-label">${esc(t.ai.label)}</span><span>${esc(it.ex)}</span></div>
</article>`).join("\n")}
</div>
</div>
</section>

<section class="wrap section" id="process" aria-labelledby="proc-title">
<div class="section-head">
<p class="eyebrow">${esc(t.proc.eyebrow)}</p>
<h2 id="proc-title">${esc(t.proc.title)}</h2>
</div>
<ol class="grid grid--3 steps">
${t.proc.steps.map((s, i) => `<li class="card step">
<div class="step-top"><span class="step-num">${pad(i + 1)}</span><span class="step-bar" aria-hidden="true"></span></div>
<h3>${esc(s.title)}</h3>
<p class="muted">${esc(s.desc)}</p>
</li>`).join("\n")}
</ol>
</section>

<section class="wrap section section--tight" aria-labelledby="why-title">
<h2 id="why-title" class="h2-sm">${esc(t.why.title)}</h2>
<div class="grid grid--4">
${t.why.items.map((w) => `<div class="why"><h3>${esc(w.title)}</h3><p class="muted">${esc(w.desc)}</p></div>`).join("\n")}
</div>
</section>

<section class="wrap section section--last" id="contact" aria-labelledby="contact-title">
<div class="contact-card">
<div class="contact-copy">
<h2 id="contact-title">${esc(c.title)}</h2>
<p class="lead lead--sm">${esc(c.sub)}</p>
<address class="contact-lines">${contactLines}</address>
</div>
<form id="contact-form" class="form" action="/api/contact" method="post" novalidate
  data-msg-sending="${esc(c.sending)}" data-msg-success="${esc(c.success)}" data-msg-error="${esc(c.error)}"
  data-msg-captcha="${esc(c.captcha)}" data-msg-invalid="${esc(c.invalid)}">
<input type="hidden" name="lang" value="${lang.code}">
<input type="hidden" name="_elapsed" value="">
<div class="hp" aria-hidden="true">
<label for="company_website">Website</label>
<input type="text" id="company_website" name="company_website" tabindex="-1" autocomplete="off">
</div>
<div class="field"><label for="f-name">${esc(c.name)}</label><input id="f-name" name="name" type="text" required maxlength="100" autocomplete="name"></div>
<div class="field"><label for="f-email">${esc(c.email)}</label><input id="f-email" name="email" type="email" required maxlength="200" autocomplete="email"></div>
<div class="field"><label for="f-phone">${esc(c.phone)} <span class="opt">(${esc(c.optional)})</span></label><input id="f-phone" name="phone" type="tel" maxlength="40" autocomplete="tel"></div>
<div class="field"><label for="f-business">${esc(c.business)} <span class="opt">(${esc(c.optional)})</span></label><input id="f-business" name="business" type="text" maxlength="150" autocomplete="organization"></div>
<div class="field field--full"><label for="f-industry">${esc(c.industry)}</label><select id="f-industry" name="industry">${Object.entries(c.opts).map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
<div class="field field--full"><label for="f-msg">${esc(c.msg)}</label><textarea id="f-msg" name="message" rows="5" required minlength="10" maxlength="5000"></textarea></div>
<div class="field--full turnstile-box"><div class="cf-turnstile" data-sitekey="${esc(config.turnstileSiteKey)}" data-action="contact" data-language="${lang.turnstile}" data-theme="light" data-size="flexible"></div></div>
<div class="field--full form-foot">
<button class="btn btn--sun" type="submit">${esc(c.send)}</button>
<p class="status" role="status" aria-live="polite" data-status></p>
</div>
<p class="field--full muted small">${esc(c.privacy)}</p>
<noscript><p class="field--full status" data-kind="error">${esc(c.noscript)}</p></noscript>
</form>
</div>
</section>

</main>
${footer({ t })}
<script src="${assets.js}" defer></script>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</body>
</html>
`;
}

export function render404({ lang, t, config, assets }) {
  return `<!doctype html>
<html lang="${lang.html}">
${head({ lang, t, config, assets, path: "/404", title: `${t.notFound.title} | JRSOL`, description: t.notFound.text, noindex: true })}
<body>
${header({ lang, t, home: lang.path })}
<main id="main" class="wrap notfound">
<p class="eyebrow">404</p>
<h1>${esc(t.notFound.title)}</h1>
<p class="lead">${esc(t.notFound.text)}</p>
<div class="btn-row"><a class="btn btn--ink" href="/">${esc(t.notFound.back)}</a><a class="btn btn--outline" href="/es/">Español</a><a class="btn btn--outline" href="/pt/">Português</a></div>
</main>
${footer({ t })}
</body>
</html>
`;
}
