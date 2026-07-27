import type { Product } from "../types";

export function findProductByRouteKey(products: Product[], routeKey: string | undefined) {
  if (!routeKey) return undefined;
  return products.find((product) => product.id === routeKey || product.slug === routeKey);
}
