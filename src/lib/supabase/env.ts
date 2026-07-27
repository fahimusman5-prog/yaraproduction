const placeholderPatterns = ["your-project", "your_key", "sb_secret_your_key", "sb_publishable_your_key"];
type SupabaseConfig = { url: string; publishableKey: string };
type SupabaseAdminConfig = { url: string; secretKey: string };

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) {
    issues.push("NEXT_PUBLIC_APP_URL is missing.");
  } else if (!isHttpUrl(appUrl)) {
    issues.push("NEXT_PUBLIC_APP_URL must be a valid HTTP or HTTPS origin.");
  } else if (new URL(appUrl).pathname !== "/" || new URL(appUrl).search || new URL(appUrl).hash) {
    issues.push("NEXT_PUBLIC_APP_URL must be an origin without a path, query, or hash.");
  } else if (process.env.VERCEL_ENV === "production" && appUrl !== "https://www.yaraproduct.com") {
    issues.push("NEXT_PUBLIC_APP_URL must be https://www.yaraproduct.com in production.");
  } else if (appUrl.includes("yaraproduct.com") && appUrl !== "https://www.yaraproduct.com") {
    issues.push("NEXT_PUBLIC_APP_URL must be https://www.yaraproduct.com in production.");
  }
  return issues;
}

export function getAppOrigin(requestUrl?: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
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
  const payhereMerchantId = process.env.PAYHERE_MERCHANT_ID?.trim();
  const payhereMerchantSecret = process.env.PAYHERE_MERCHANT_SECRET?.trim();

  if (!payhereMerchantId) issues.push("PAYHERE_MERCHANT_ID is missing.");
  if (!payhereMerchantSecret) issues.push("PAYHERE_MERCHANT_SECRET is missing.");

  return issues;
}
