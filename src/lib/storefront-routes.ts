import { isLocale, type Locale } from "./locales";

export function getCataloguePath(locale: Locale = "en", search = "") {
  return `/${locale}/shop${search}`;
}

export function resolveStorefrontLocale(value?: string | null): Locale {
  return value && isLocale(value) ? value : "en";
}
