import { countryDetails, type Country } from "../context/CountryContext";
import { defaultLocale, getWhatsAppLabels, type Locale } from "../i18n";
import { localizeCountryName, localizeProduct } from "./storefront-localization";
import type { CartItem, Product } from "../types";

export const getProductPrice = (product: Product, country: Country) =>
  country === "sri-lanka" ? product.priceLKR : product.priceAED;

export const getProductOriginalPrice = (product: Product, country: Country) =>
  country === "sri-lanka" ? product.originalPriceLKR : product.originalPriceAED;

export const formatPrice = (price: number, country: Country) => {
  const amount = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(price);
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

export interface WhatsAppOrderSummary {
  subtotal: number;
  discount?: number;
  deliveryFee?: number | null;
  paymentFee?: number;
  deliveryLabel?: string;
}

export const cartOrderMessage = (
  items: CartItem[],
  total: number | null,
  country: Country,
  customer: CustomerDetails = {},
  locale: Locale = defaultLocale,
  summary?: WhatsAppOrderSummary,
) => {
  const details = countryDetails[country];
  const labels = getWhatsAppLabels(locale);
  const lines = items.map(({ product, quantity }, index) => {
    const displayProduct = localizeProduct(product, locale);
    return `${index + 1}. ${labels.product}: ${displayProduct.name}\n   ${labels.quantity}: ${quantity}\n   ${labels.price}: ${formatPrice(getProductPrice(product, country) * quantity, country)}`;
  });
  const totals = summary
    ? [
        `Subtotal: ${formatPrice(summary.subtotal, country)}`,
        summary.discount
          ? `Discount: -${formatPrice(summary.discount, country)}`
          : null,
        `Delivery: ${
          summary.deliveryFee === null ||
          summary.deliveryFee === undefined
            ? summary.deliveryLabel || "To be confirmed"
            : formatPrice(summary.deliveryFee, country)
        }`,
        summary.paymentFee
          ? `Payment fee: ${formatPrice(summary.paymentFee, country)}`
          : null,
        `${labels.total}: ${
          total === null ? "To be confirmed" : formatPrice(total, country)
        }`,
      ]
        .filter(Boolean)
        .join("\n")
    : `${labels.total}: ${
        total === null ? "To be confirmed" : formatPrice(total, country)
      }`;
  return `${labels.greeting}\n\n${labels.newOrder}\n\n${labels.country}: ${localizeCountryName(country, locale) || details.name}\n${labels.currency}: ${details.currency}\n\n${labels.products}:\n${lines.join("\n")}\n\n${totals}\n\n${labels.name}: ${customer.name ?? ""}\n${labels.phone}: ${customer.phone ?? ""}\n${labels.address}: ${customer.address ?? ""}\n${labels.paymentMethod}: ${customer.paymentMethod ?? ""}\n${labels.notes}: ${customer.notes ?? ""}`;
};

export const productOrderMessage = (product: Product, quantity: number, country: Country, locale: Locale = defaultLocale) =>
  cartOrderMessage(
    [{ product, quantity }],
    null,
    country,
    {},
    locale,
    {
      subtotal: getProductPrice(product, country) * quantity,
      deliveryFee: null,
      deliveryLabel: "To be confirmed",
    },
  );
