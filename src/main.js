// Contact form: sends to /api/contact and shows the result in the page's language.
(() => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const startedAt = Date.now();
  const status = form.querySelector("[data-status]");
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button.textContent;
  const msg = (key) => form.dataset["msg" + key.charAt(0).toUpperCase() + key.slice(1)] || "";
  const show = (text, kind) => {
    status.textContent = text;
    status.dataset.kind = kind || "";
  };
  const resetCaptcha = () => {
    try { if (window.turnstile) window.turnstile.reset(); } catch (_) { /* ignore */ }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) {
      show(msg("invalid"), "error");
      return;
    }

    const data = new FormData(form);
    if (!data.get("cf-turnstile-response")) {
      show(msg("captcha"), "error");
      return;
    }
    data.set("_elapsed", String(Date.now() - startedAt));

    button.disabled = true;
    button.textContent = msg("sending");
    show("", "");

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) {
        form.reset();
        show(msg("success"), "success");
      } else if (out.error === "captcha") {
        show(msg("captcha"), "error");
      } else if (out.error === "invalid") {
        show(msg("invalid"), "error");
      } else {
        show(msg("error"), "error");
      }
    } catch (_) {
      show(msg("error"), "error");
    } finally {
      button.disabled = false;
      button.textContent = buttonLabel;
      resetCaptcha(); // Turnstile tokens are single-use
    }
  });
})();
