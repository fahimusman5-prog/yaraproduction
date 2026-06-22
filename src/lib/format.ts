import type { CartItem, Product } from "../types";

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

export const createWhatsAppLink = (message: string) => {
  const number = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.replace(/\D/g, "");
  const base = number ? `https://wa.me/${number}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
};

export const productOrderMessage = (product: Product, quantity = 1) =>
  `Hello YARA, I would like to order ${quantity} × ${product.name} (${product.size}) for ${formatPrice(product.price * quantity)}.`;

export const cartOrderMessage = (items: CartItem[], total: number) => {
  const lines = items.map(({ product, quantity }) => `• ${quantity} × ${product.name}`);
  return `Hello YARA, I would like to place this order:\n${lines.join("\n")}\nTotal: ${formatPrice(total)}`;
};
