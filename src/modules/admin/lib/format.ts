export function formatMoney(value: number, currency: "LKR" | "AED" = "LKR") {
  return new Intl.NumberFormat(currency === "LKR" ? "en-LK" : "en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" as const } : {}),
  }).format(new Date(value));
}

export function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
