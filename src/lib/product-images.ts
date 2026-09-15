import sharp from "sharp";

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ProductImageAssets = {
  url: string | null;
  cardUrl: string | null;
  thumbnailUrl: string | null;
  originalUrl: string | null;
  paths: string[];
  originalBytes: number;
  optimizedBytes: number;
  width: number;
  height: number;
  outputWidth: number;
  outputHeight: number;
  durationMs: number;
};

export function validateProductImage(file: File) {
  if (!file.size || file.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error("Product images must be 5 MB or smaller.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Use a JPG, PNG, or WebP image.");
  }
  const extension = file.name.toLowerCase().split(".").pop();
  if (!extension || !new Set(["jpg", "jpeg", "png", "webp"]).has(extension)) {
    throw new Error("The file extension does not match a supported image type.");
  }
}

function extensionFor(type: string) {
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

export async function optimizeProductImage(file: File, pathPrefix: string) {
  validateProductImage(file);
  const started = Date.now();
  const input = Buffer.from(await file.arrayBuffer());
  const image = sharp(input, { failOn: "error", limitInputPixels: 40_000_000 });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || metadata.width < 1 || metadata.height < 1) {
    throw new Error("The image dimensions could not be read.");
  }
  if (metadata.width > 10000 || metadata.height > 10000) {
    throw new Error("Product images must be 10,000 pixels or smaller per edge.");
  }
  const output = async (size: number, quality: number) => image
    .clone()
    .rotate()
    .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
    .webp({ quality, alphaQuality: quality, effort: 4 })
    .toBuffer();
  const [detail, card, thumbnail] = await Promise.all([output(1600, 88), output(800, 88), output(320, 86)]);
  const assetId = crypto.randomUUID();
  const originalPath = `${pathPrefix}/original/${assetId}.${extensionFor(file.type)}`;
  const detailPath = `${pathPrefix}/web/${assetId}.webp`;
  const cardPath = `${pathPrefix}/card/${assetId}.webp`;
  const thumbnailPath = `${pathPrefix}/thumbnail/${assetId}.webp`;
  const detailMeta = await sharp(detail).metadata();
  return {
    input,
    originalPath,
    detailPath,
    cardPath,
    thumbnailPath,
    detail,
    card,
    thumbnail,
    originalBytes: input.byteLength,
    optimizedBytes: detail.byteLength + card.byteLength + thumbnail.byteLength,
    width: metadata.width,
    height: metadata.height,
    outputWidth: detailMeta.width ?? 0,
    outputHeight: detailMeta.height ?? 0,
    durationMs: Date.now() - started,
  };
}
