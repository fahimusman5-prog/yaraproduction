import { countryDetails, type Country } from "../context/CountryContext";
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
}

export const cartOrderMessage = (
  items: CartItem[],
  total: number,
  country: Country,
  customer: CustomerDetails = {}
) => {
  const details = countryDetails[country];
  const lines = items.map(({ product, quantity }, index) =>
    `${index + 1}. ${product.name} x ${quantity} - ${formatPrice(getProductPrice(product, country) * quantity, country)}`
  );
  return `Hello YARA, I want to place an order.\n\nCountry: ${details.name}\nCurrency: ${details.currency}\n\nProducts:\n${lines.join("\n")}\n\nTotal: ${formatPrice(total, country)}\n\nName: ${customer.name ?? ""}\nPhone: ${customer.phone ?? ""}\nAddress: ${customer.address ?? ""}`;
};

export const productOrderMessage = (product: Product, quantity: number, country: Country) =>
  cartOrderMessage([{ product, quantity }], getProductPrice(product, country) * quantity, country);
