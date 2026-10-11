# JRSOL website

A static site in three languages, with a protected contact form. It runs on **Cloudflare Pages**, and email is sent through **Resend**.

```
/        English     (index.html)
/es/     Español     (es/index.html)
/pt/     Português   (pt/index.html)
```

## Project layout

| Path | What it is |
|---|---|
| `src/i18n.mjs` | **All page text**, one block per language. Edit copy here. |
| `src/page.mjs` | The HTML template, shared by all three languages |
| `src/styles.css`, `src/main.js` | Styles, and the form script |
| `site.config.mjs` | Domain, Turnstile site key, phone/email shown on the page |
| `public/` | Files copied as-is: favicon, logo, social image, `_headers` (security headers) |
| `functions/api/contact.js` | The contact form endpoint (a Cloudflare Pages Function) |
| `build.mjs` | Generates `dist/`: three pages, 404, sitemap, robots.txt. No dependencies. |

## 1. Set up Turnstile (the captcha)

1. In the Cloudflare dashboard, open **Turnstile** and click **Add widget**.
2. Add your hostnames: `jrsol.net` and `www.jrsol.net`. Add `localhost` if you want to test locally with real keys.
3. Choose the **Managed** widget mode.
4. Copy the **Site key** (it's public) and the **Secret key** (keep it private).

## 2. Set up Resend

1. In Resend, add and **verify your domain**, e.g. `jrsol.net`. This means adding the DNS records Resend gives you. If your DNS is on Cloudflare, that takes a few clicks.
2. Create an **API key** with *Sending access*.

## 3. Deploy to Cloudflare Pages

1. Push this folder to a GitHub repository.
2. In Cloudflare, go to **Workers & Pages → Create → Pages → Connect to Git** and pick the repository.
3. Use these build settings:
   - Framework preset: **None**
   - Build command: `node build.mjs`
   - Build output directory: `dist`
4. Under **Settings → Variables and Secrets**, add the following for **Production**:

| Name | Type | Example |
|---|---|---|
| `SITE_URL` | Text | `https://jrsol.net` |
| `TURNSTILE_SITE_KEY` | Text | your Turnstile site key |
| `TURNSTILE_SECRET_KEY` | **Secret** | your Turnstile secret key |
| `RESEND_API_KEY` | **Secret** | `re_…` |
| `CONTACT_TO` | Text | the inbox that receives inquiries |
| `CONTACT_FROM` | Text | `JRSOL Website <website@jrsol.net>` (must be on your verified domain) |
| `ALLOWED_ORIGINS` | Text | `https://jrsol.net,https://www.jrsol.net` |
| `TURNSTILE_HOSTNAMES` | Text (optional) | `jrsol.net,www.jrsol.net` |
| `CONTACT_PHONE`, `CONTACT_EMAIL` | Text (optional) | shown in the contact section |

5. Under **Custom domains**, add `jrsol.net`, then redeploy so the variables take effect.
6. Submit `https://jrsol.net/sitemap.xml` in Google Search Console.

## 4. Add a rate limit (recommended)

Go to **Security → WAF → Rate limiting rules → Create rule**:
- If: URI Path *equals* `/api/contact` **and** Request Method *equals* `POST`
- Rate: about 5 requests per 1 minute (or the shortest window your plan allows) per IP
- Action: **Block**

## How the form is protected

1. **Cloudflare Turnstile**: every submission needs a fresh token, and the server verifies it with Cloudflare. Tokens are single-use, and the widget resets after each try.
2. **Honeypot**: a hidden `company_website` field. Bots that fill it in get a fake "success" and no email is sent.
3. **Time trap**: forms submitted less than 3 seconds after the page loads are silently dropped.
4. **Origin check**: only posts from your own domain are accepted.
5. **Validation**: required fields, length limits, email format, and a fixed list of industries. Every value is HTML-escaped before it goes into the email.
6. **WAF rate limit**: set this up in step 4.
7. **Security headers** (`public/_headers`): a strict Content Security Policy, no framing, and HSTS.

The email arrives with **Reply-To** set to the visitor's address, so you answer by hitting Reply. The site never sends email to the visitor's address, so the form can't be used to spam other people.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # then add your real Resend key and inbox
npm run dev                      # http://localhost:8788
```

`.dev.vars.example` uses Cloudflare's **test** Turnstile keys, which always pass. Emails are still sent for real if `RESEND_API_KEY` is valid.

## Editing

- **Text**: edit `src/i18n.mjs`. Keep the three languages in sync.
- **Colors and fonts**: the variables at the top of `src/styles.css`.
- **New page** (e.g. `/hospitality/`): add a render function in `src/page.mjs`, write it from `build.mjs` for each language, and add it to the sitemap.
