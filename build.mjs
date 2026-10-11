// Builds the static site into ./dist. No dependencies: `node build.mjs`.

import { mkdir, writeFile, readFile, rm, cp } from "node:fs/promises";
import { createHash } from "node:crypto";
import config from "./site.config.mjs";
import { i18n, LANGS } from "./src/i18n.mjs";
import { renderPage, render404 } from "./src/page.mjs";

const DIST = "dist";
const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 10);

await rm(DIST, { recursive: true, force: true });
await mkdir(`${DIST}/assets`, { recursive: true });
await cp("public", DIST, { recursive: true });

// Fingerprinted assets, so they can be cached forever
const css = await readFile("src/styles.css", "utf8");
const js = await readFile("src/main.js", "utf8");
const assets = {
  css: `/assets/styles.${hash(css)}.css`,
  js: `/assets/main.${hash(js)}.js`,
};
await writeFile(DIST + assets.css, css);
await writeFile(DIST + assets.js, js);

// One page per language
for (const lang of LANGS) {
  const html = renderPage({ lang, t: i18n[lang.code], config, assets });
  await mkdir(DIST + lang.path, { recursive: true });
  await writeFile(`${DIST}${lang.path}index.html`, html);
}

// 404 page (also stops Cloudflare Pages from treating the site as a single-page app)
await writeFile(`${DIST}/404.html`, render404({ lang: LANGS[0], t: i18n.en, config, assets }));

// Sitemap with hreflang alternates
const today = new Date().toISOString().slice(0, 10);
const alt = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l.html}" href="${config.siteUrl}${l.path}"/>`).join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LANGS.map((l) => `  <url>
    <loc>${config.siteUrl}${l.path}</loc>
    <lastmod>${today}</lastmod>
${alt}
    <xhtml:link rel="alternate" hreflang="x-default" href="${config.siteUrl}/"/>
  </url>`).join("\n")}
</urlset>
`;
await writeFile(`${DIST}/sitemap.xml`, sitemap);
await writeFile(`${DIST}/robots.txt`, `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);

if (config.turnstileSiteKey.startsWith("1x000000")) {
  console.warn("⚠  Using Cloudflare's TEST Turnstile site key. Set TURNSTILE_SITE_KEY before going live.");
}
console.log(`Built ${LANGS.length} languages → ${DIST}/ (site: ${config.siteUrl})`);
