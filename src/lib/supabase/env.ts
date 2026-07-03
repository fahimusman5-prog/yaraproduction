const placeholderPatterns = ["your-project", "your_key"];
type SupabaseConfig = { url: string; publishableKey: string };

function hasPlaceholder(value: string | undefined) {
  return !value || placeholderPatterns.some((pattern) => value.includes(pattern));
}

export function getSupabaseConfigIssues() {
  const issues: string[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (hasPlaceholder(url)) issues.push("NEXT_PUBLIC_SUPABASE_URL is missing or still a placeholder.");
  if (hasPlaceholder(publishableKey)) issues.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing or still a placeholder.");

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

export function getServerEnvIssues() {
  const issues = [...getSupabaseConfigIssues()];
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const payhereMerchantId = process.env.PAYHERE_MERCHANT_ID?.trim();
  const payhereMerchantSecret = process.env.PAYHERE_MERCHANT_SECRET?.trim();

  if (hasPlaceholder(secret)) issues.push("SUPABASE_SECRET_KEY is missing or still a placeholder.");
  if (!appUrl) issues.push("NEXT_PUBLIC_APP_URL is missing.");
  if (!payhereMerchantId) issues.push("PAYHERE_MERCHANT_ID is missing.");
  if (!payhereMerchantSecret) issues.push("PAYHERE_MERCHANT_SECRET is missing.");

  return issues;
}
