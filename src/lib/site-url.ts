export const CANONICAL_SITE_ORIGIN = "https://www.yaraproduct.com";

const LOCAL_ORIGINS = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);

export function normalizeSiteUrl(value: string | undefined, environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV) {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    const origin = url.origin;
    if (environment === "production") return origin === CANONICAL_SITE_ORIGIN ? CANONICAL_SITE_ORIGIN : null;
    return origin;
  } catch {
    return null;
  }
}

export function getSiteUrl(requestUrl?: string) {
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  const configured = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL, environment);
  if (configured) return configured;
  if (environment === "production") return null;

  const vercelUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_VERCEL_URL, "preview");
  if (vercelUrl && !LOCAL_ORIGINS.has(vercelUrl)) return vercelUrl;
  if (requestUrl) {
    let requestOrigin: string | null = null;
    try { requestOrigin = normalizeSiteUrl(new URL(requestUrl).origin, "development"); } catch { requestOrigin = null; }
    if (requestOrigin) return requestOrigin;
  }
  if (typeof window !== "undefined") return normalizeSiteUrl(window.location.origin, "development");
  return "http://localhost:3000";
}

export function getAuthConfirmUrl() {
  const origin = getSiteUrl();
  return origin ? `${origin}/auth/confirm` : null;
}
