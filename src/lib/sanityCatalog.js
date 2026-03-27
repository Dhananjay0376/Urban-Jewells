const SANITY_PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const SANITY_DATASET = import.meta.env.VITE_SANITY_DATASET;
const SANITY_API_VERSION = import.meta.env.VITE_SANITY_API_VERSION || "2025-02-19";
const SANITY_USE_CDN = import.meta.env.DEV ? false : import.meta.env.VITE_SANITY_USE_CDN !== "false";

export const isSanityConfigured = () => Boolean(SANITY_PROJECT_ID && SANITY_DATASET);

const buildUrl = (query) => {
  const host = SANITY_USE_CDN
    ? `${SANITY_PROJECT_ID}.apicdn.sanity.io`
    : `${SANITY_PROJECT_ID}.api.sanity.io`;
  const base = `https://${host}/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`;
  const params = new URLSearchParams({
    query,
    perspective: "published",
  });

  if (SANITY_USE_CDN) {
    params.set("tag", "urban-jewells-catalog");
  }

  return `${base}?${params.toString()}`;
};

const catalogQuery = `{
  "products": *[_type == "product"] | order(name asc) {
    _id,
    "id": coalesce(id, _id),
    name,
    "slug": slug.current,
    price,
    originalPrice,
    "category": category->slug.current,
    "collection": collection->slug.current,
    shortDescription,
    materials,
    sizes,
    "images": array::compact(images[].asset->url),
    inStock,
    "isFeatured": coalesce(isFeatured, false),
    "isNew": coalesce(isNew, false),
    "isSale": coalesce(isSale, false),
    rating,
    reviewCount,
    tags,
    "variants": variants[]{
      id,
      colorName,
      colorHex,
      "images": array::compact(images[].asset->url),
      price,
      originalPrice,
      inStock,
      sku
    }
  },
  "collections": *[_type == "collection"] | order(name asc) {
    _id,
    "id": coalesce(id, slug.current, _id),
    name,
    "slug": slug.current,
    tagline,
    "coverImage": coverImage.asset->url,
    productCount,
    mood
  },
  "categories": *[_type == "category"] | order(name asc) {
    _id,
    "id": coalesce(id, slug.current, _id),
    name,
    "slug": slug.current,
    icon,
    "coverImage": coverImage.asset->url
  }
}`;

const ensureArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];

const normalizeVariant = (variant, fallbackProduct) => ({
  id: variant.id,
  colorName: variant.colorName || "Variant",
  colorHex: variant.colorHex || "#A8E6CF",
  images: ensureArray(variant.images),
  price: typeof variant.price === "number" ? Number(variant.price) : undefined,
  originalPrice: typeof variant.originalPrice === "number" ? Number(variant.originalPrice) : undefined,
  inStock: variant.inStock !== false,
  sku: variant.sku || "",
  productId: fallbackProduct.id,
});

const normalizeProduct = (product) => {
  const variants = ensureArray(product.variants).map(variant => normalizeVariant(variant, product));
  const fallbackImages = ensureArray(product.images);
  const primaryVariant = variants[0];
  return {
    id: product.id,
    name: product.name || "Untitled Product",
    slug: product.slug || String(product.id),
    price: Number(product.price || 0),
    originalPrice: typeof product.originalPrice === "number" ? Number(product.originalPrice) : undefined,
    category: product.category || "",
    collection: product.collection || "",
    shortDescription: product.shortDescription || "",
    materials: ensureArray(product.materials),
    sizes: ensureArray(product.sizes),
    images: fallbackImages.length ? fallbackImages : primaryVariant?.images || [],
    inStock: product.inStock !== false,
    isFeatured: Boolean(product.isFeatured),
    isNew: Boolean(product.isNew),
    isSale: Boolean(product.isSale),
    rating: product.rating ? Number(product.rating) : 0,
    reviewCount: product.reviewCount ? Number(product.reviewCount) : 0,
    tags: ensureArray(product.tags),
    variants,
  };
};

const normalizeCollection = (collection) => ({
  id: collection.id,
  name: collection.name || "Untitled Collection",
  slug: collection.slug || String(collection.id),
  tagline: collection.tagline || "",
  coverImage: collection.coverImage || "",
  productCount: collection.productCount ? Number(collection.productCount) : 0,
  mood: collection.mood || "",
});

const normalizeCategory = (category) => ({
  id: category.id,
  name: category.name || "Untitled Category",
  slug: category.slug || String(category.id),
  icon: category.icon || "",
  coverImage: category.coverImage || "",
});

export async function loadCatalogFromSanity() {
  if (!isSanityConfigured()) {
    return null;
  }

  const response = await fetch(buildUrl(catalogQuery), {
    cache: import.meta.env.DEV ? 'no-store' : 'default',
  });
  if (!response.ok) {
    throw new Error(`Sanity catalog request failed with ${response.status}`);
  }

  const payload = await response.json();
  const result = payload?.result || {};

  return {
    products: ensureArray(result.products).map(normalizeProduct),
    collections: ensureArray(result.collections).map(normalizeCollection),
    categories: ensureArray(result.categories).map(normalizeCategory),
  };
}
