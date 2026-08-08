const placeholderPatterns = ["your-project", "your_key", "sb_secret_your_key", "sb_publishable_your_key"];
type SupabaseConfig = { url: string; publishableKey: string };
type SupabaseAdminConfig = { url: string; secretKey: string };
const productionOrigins = new Set([
  "https://www.yaraproduct.com",
  "https://yaraproduct.com",
]);
const canonicalProductionOrigin = "https://yaraproduct.com";

function hasPlaceholder(value: string | undefined) {
  return !value || placeholderPatterns.some((pattern) => value.includes(pattern));
}

function isHttpUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function getSupabaseUrlIssue(url: string | undefined) {
  if (hasPlaceholder(url)) return "NEXT_PUBLIC_SUPABASE_URL is missing or still a placeholder.";
  if (!isHttpUrl(url)) return "NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL.";
  return null;
}

export function getAppUrlIssues() {
  const issues: string[] = [];
  const appUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL)?.trim();
  const resolvedUrl = appUrl || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}` : undefined);
  if (!resolvedUrl) {
    issues.push("NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL is missing.");
  } else if (!isHttpUrl(resolvedUrl)) {
    issues.push("NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL must be a valid HTTP or HTTPS origin.");
  } else if (new URL(resolvedUrl).pathname !== "/" || new URL(resolvedUrl).search || new URL(resolvedUrl).hash) {
    issues.push("NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL must be an origin without a path, query, or hash.");
  } else if (process.env.VERCEL_ENV === "production" && !productionOrigins.has(new URL(resolvedUrl).origin)) {
    issues.push("NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL must be https://www.yaraproduct.com or https://yaraproduct.com in production.");
  } else if (resolvedUrl.includes("yaraproduct.com") && !productionOrigins.has(new URL(resolvedUrl).origin)) {
    issues.push("NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL must be https://www.yaraproduct.com or https://yaraproduct.com in production.");
  }
  return issues;
}

export function getAppOrigin(requestUrl?: string) {
  const configuredUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL)?.trim();
  const fallbackUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
    : process.env.VERCEL_ENV === "production"
      ? canonicalProductionOrigin
      : undefined;
  const appUrl = configuredUrl || fallbackUrl;
  if (appUrl && getAppUrlIssues().length === 0) return new URL(appUrl).origin;

  const nonProduction = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV !== "production"
    : process.env.NODE_ENV !== "production";
  if (nonProduction && requestUrl && isHttpUrl(requestUrl)) return new URL(requestUrl).origin;
  return null;
}

export function getSupabaseConfigIssues() {
  const issues: string[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  const urlIssue = getSupabaseUrlIssue(url);
  if (urlIssue) issues.push(urlIssue);
  if (hasPlaceholder(publishableKey)) issues.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing or still a placeholder.");
  if (publishableKey?.startsWith("sb_secret_")) issues.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must not contain a Supabase secret key.");

  return issues;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey || getSupabaseConfigIssues().length) {
    return null;
  }

  return { url, publishableKey };
}

export function getSupabaseAdminConfigIssues() {
  const issues: string[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const urlIssue = getSupabaseUrlIssue(url);

  if (urlIssue) issues.push(urlIssue);
  if (hasPlaceholder(secret)) issues.push("SUPABASE_SECRET_KEY is missing or still a placeholder.");
  if (secret?.startsWith("sb_publishable_")) issues.push("SUPABASE_SECRET_KEY must not contain a publishable key.");
  if (secret && publishableKey && secret === publishableKey) issues.push("SUPABASE_SECRET_KEY must be different from the publishable key.");
  return issues;
}

export function getSupabaseAdminConfig(): SupabaseAdminConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey || getSupabaseAdminConfigIssues().length) return null;
  return { url, secretKey };
}

export function getServerEnvIssues() {
  const issues = [...new Set([...getSupabaseConfigIssues(), ...getSupabaseAdminConfigIssues(), ...getAppUrlIssues()])];
  const parseBoolean = (value: string | undefined) => ["true", "1"].includes(value?.trim().toLowerCase() ?? "");
  const paymentsEnabled = parseBoolean(process.env.PAYMENTS_ENABLED);
  const payhereMerchantId = process.env.PAYHERE_MERCHANT_ID?.trim();
  const payhereMerchantSecret = process.env.PAYHERE_MERCHANT_SECRET?.trim();

  const payHereEnabled = parseBoolean(process.env.PAYHERE_ENABLED) || paymentsEnabled;
  if (payHereEnabled && !payhereMerchantId) issues.push("PAYHERE_MERCHANT_ID is missing while PayHere is enabled.");
  if (payHereEnabled && !payhereMerchantSecret) issues.push("PAYHERE_MERCHANT_SECRET is missing while PayHere is enabled.");
  if (process.env.PAYMENTS_ENABLED && !["true", "false", "1", "0"].includes(process.env.PAYMENTS_ENABLED.trim().toLowerCase())) issues.push("PAYMENTS_ENABLED must be true, false, 1, or 0.");
  if (process.env.PAYHERE_ENABLED && !["true", "false", "1", "0"].includes(process.env.PAYHERE_ENABLED.trim().toLowerCase())) issues.push("PAYHERE_ENABLED must be true, false, 1, or 0.");
  for (const name of [
    "PAYHERE_SANDBOX",
  ] as const)
    if (process.env[name] && !["true", "false", "1", "0"].includes(process.env[name]!.trim().toLowerCase()))
      issues.push(`${name} must be true, false, 1, or 0.`);
  const emailVariables = [
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "EMAIL_REPLY_TO",
    "ADMIN_NOTIFICATION_EMAIL",
  ] as const;
  const configuredEmailVariables = emailVariables.filter((name) =>
    process.env[name]?.trim(),
  );
  if (
    configuredEmailVariables.length > 0 &&
    configuredEmailVariables.length < emailVariables.length
  )
    issues.push(
      "Transactional email configuration is incomplete. Set RESEND_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO, and ADMIN_NOTIFICATION_EMAIL together.",
    );
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED && !["true", "false"].includes(process.env.NEXT_PUBLIC_ANALYTICS_ENABLED)) issues.push("NEXT_PUBLIC_ANALYTICS_ENABLED must be true or false.");
  if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG && !["true", "false"].includes(process.env.NEXT_PUBLIC_ANALYTICS_DEBUG)) issues.push("NEXT_PUBLIC_ANALYTICS_DEBUG must be true or false.");
  if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && !/^G-[A-Z0-9]+$/i.test(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID)) issues.push("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID must be a Google Analytics measurement ID.");

  return issues;
}
