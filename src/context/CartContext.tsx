import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem, Product } from "../types";
import { useCountry } from "./CountryContext";
import { getProductPrice } from "../lib/format";
import { useCatalog } from "./CatalogContext";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "yara-cart";

const readStoredCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as CartItem[]) : [];
    return parsed;
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { country } = useCountry();
  const { products, loading, error } = useCatalog();
  const [items, setItems] = useState<CartItem[]>(readStoredCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (loading || error) return;
    setItems((current) => current.flatMap((item) => {
      const product = products.find((candidate) => candidate.id === item.product.id);
      if (!product || product.stockQuantity === 0) return [];
      return [{ product, quantity: Math.min(item.quantity, product.stockQuantity ?? item.quantity) }];
    }));
  }, [products, loading, error]);

  const addItem = (product: Product, quantity = 1) => {
    if (product.stockQuantity === 0) return;
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, product.stockQuantity ?? Infinity) } : item
        );
      }
      return [...current, { product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((current) => current.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return removeItem(productId);
    setItems((current) =>
      current.map((item) => (item.product.id === productId ? { ...item, quantity: Math.min(quantity, item.product.stockQuantity ?? Infinity) } : item))
    );
  };

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: country ? items.reduce((sum, item) => sum + getProductPrice(item.product, country) * item.quantity, 0) : 0,
      addItem,
      removeItem,
      updateQuantity,
      clearCart: () => setItems([])
    }),
    [items, country]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
