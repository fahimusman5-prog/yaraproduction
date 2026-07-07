import { countryDetails, type Country } from "../context/CountryContext";
import { defaultLocale, getWhatsAppLabels, type Locale } from "../i18n";
import { localizeCountryName, localizeProduct } from "./storefront-localization";
import type { CartItem, Product } from "../types";

export const getProductPrice = (product: Product, country: Country) =>
  country === "sri-lanka" ? product.priceLKR : product.priceAED;

export const formatPrice = (price: number, country: Country) => {
  const amount = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(price);
  return country === "sri-lanka" ? `Rs. ${amount}` : `AED ${amount}`;
};

export const createWhatsAppLink = (message: string, country: Country) =>
  `https://wa.me/${countryDetails[country].whatsapp}?text=${encodeURIComponent(message)}`;

export interface CustomerDetails {
  name?: string;
  phone?: string;
  address?: string;
  paymentMethod?: string;
  notes?: string;
}

export const cartOrderMessage = (
  items: CartItem[],
  total: number,
  country: Country,
  customer: CustomerDetails = {},
  locale: Locale = defaultLocale,
) => {
  const details = countryDetails[country];
  const labels = getWhatsAppLabels(locale);
  const lines = items.map(({ product, quantity }, index) => {
    const displayProduct = localizeProduct(product, locale);
    return `${index + 1}. ${labels.product}: ${displayProduct.name}\n   ${labels.quantity}: ${quantity}\n   ${labels.price}: ${formatPrice(getProductPrice(product, country) * quantity, country)}`;
  });
  return `${labels.greeting}\n\n${labels.newOrder}\n\n${labels.country}: ${localizeCountryName(country, locale) || details.name}\n${labels.currency}: ${details.currency}\n\n${labels.products}:\n${lines.join("\n")}\n\n${labels.total}: ${formatPrice(total, country)}\n\n${labels.name}: ${customer.name ?? ""}\n${labels.phone}: ${customer.phone ?? ""}\n${labels.address}: ${customer.address ?? ""}\n${labels.paymentMethod}: ${customer.paymentMethod ?? ""}\n${labels.notes}: ${customer.notes ?? ""}`;
};

export const productOrderMessage = (product: Product, quantity: number, country: Country, locale: Locale = defaultLocale) =>
  cartOrderMessage([{ product, quantity }], getProductPrice(product, country) * quantity, country, {}, locale);
