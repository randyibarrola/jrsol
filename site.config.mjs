// Site-wide settings. Values can be overridden with environment variables
// in the Cloudflare Pages build settings (Settings → Variables and Secrets).

export default {
  // Your production domain, no trailing slash. Used for canonical URLs,
  // hreflang tags, the sitemap and social previews.
  siteUrl: (process.env.SITE_URL || "https://jrsol.net").replace(/\/+$/, ""),

  // Cloudflare Turnstile SITE key (public). The default is Cloudflare's
  // test key, which always passes. Replace it before going live.
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || "1x00000000000000000000AA",

  // Contact details shown in the contact section and in structured data.
  // Leave empty ("") to hide them.
  phone: process.env.CONTACT_PHONE || "",   // e.g. "+1 407 555 0100"
  email: process.env.CONTACT_EMAIL || "",   // e.g. "hello@jrsol.net"
  city: "Orlando, FL",
};
