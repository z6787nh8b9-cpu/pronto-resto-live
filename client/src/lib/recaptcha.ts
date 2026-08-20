const RECAPTCHA_SITE_KEY = "6Lft5G0sAAAAAIJoMS8v8LzHlc9DH4UYHI3P30J_";
let recaptchaLoader: Promise<void> | undefined;

type RecaptchaEnterprise = {
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
  interface Window {
    grecaptcha?: { enterprise?: RecaptchaEnterprise };
  }
}

function loadRecaptcha(): Promise<void> {
  if (window.grecaptcha?.enterprise) return Promise.resolve();
  if (recaptchaLoader) return recaptchaLoader;

  recaptchaLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Impossible de charger la protection anti-spam"));
    document.head.appendChild(script);
  });
  return recaptchaLoader;
}

export async function executeRecaptcha(action: string): Promise<string> {
  if (import.meta.env.DEV) return "development-bypass";
  await loadRecaptcha();
  const enterprise = window.grecaptcha?.enterprise;
  if (!enterprise) throw new Error("Protection anti-spam indisponible");
  return enterprise.execute(RECAPTCHA_SITE_KEY, { action });
}
