import type { Product } from "../types";

const BEST_SELLER_PRIORITY = [
  {
    slug: "yara-pinkish-night-cream",
    names: ["Pinkish Night Cream", "YARA Pinkish Night Cream", "YARA Night Cream"],
  },
  {
    slug: "yara-treatment-soap",
    names: ["Treatment Soap", "YARA Treatment Soap", "Acne & Pimple Treatment Soap"],
  },
  {
    slug: "yara-saffron-face-wash",
    names: ["Saffron Face Wash", "YARA Saffron Face Wash", "Saffron Face Wash (Niacinamide)"],
  },
] as const;

const normalizeIdentifier = (value: string | undefined) => value?.trim().toLowerCase() ?? "";

export const TOP_BEST_SELLER_SLUGS = BEST_SELLER_PRIORITY.map((item) => item.slug);

export function prioritizeBestSellers(
  products: Product[],
  logMissing: (message: string) => void = console.warn,
) {
  const usedProductIds = new Set<string>();

  const priorityProducts = BEST_SELLER_PRIORITY.flatMap((priority) => {
    const priorityNames = new Set(priority.names.map(normalizeIdentifier));
    const match = products.find((product) => {
      if (usedProductIds.has(product.id)) return false;
      return normalizeIdentifier(product.slug) === priority.slug
        || normalizeIdentifier(product.id) === priority.slug
        || priorityNames.has(normalizeIdentifier(product.name));
    });

    if (!match) {
      logMissing(`[best-sellers] Missing priority product: ${priority.slug}`);
      return [];
    }

    usedProductIds.add(match.id);
    return [match];
  });

  return [
    ...priorityProducts,
    ...products.filter((product) => !usedProductIds.has(product.id)),
  ];
}
