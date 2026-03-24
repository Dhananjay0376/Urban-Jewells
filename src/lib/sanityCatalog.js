const SANITY_PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const SANITY_DATASET = import.meta.env.VITE_SANITY_DATASET;
const SANITY_API_VERSION = import.meta.env.VITE_SANITY_API_VERSION || "2025-02-19";
const SANITY_USE_CDN = import.meta.env.VITE_SANITY_USE_CDN !== "false";

export const isSanityConfigured = () => Boolean(SANITY_PROJECT_ID && SANITY_DATASET);

const buildUrl = (query) => {
  const base = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`;
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
    tags
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

const normalizeProduct = (product) => ({
  id: product.id,
  name: product.name || "Untitled Product",
  slug: product.slug || String(product.id),
  price: Number(product.price || 0),
  originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
  category: product.category || "",
  collection: product.collection || "",
  shortDescription: product.shortDescription || "",
  materials: ensureArray(product.materials),
  sizes: ensureArray(product.sizes),
  images: ensureArray(product.images),
  inStock: product.inStock !== false,
  isFeatured: Boolean(product.isFeatured),
  isNew: Boolean(product.isNew),
  isSale: Boolean(product.isSale),
  rating: product.rating ? Number(product.rating) : 0,
  reviewCount: product.reviewCount ? Number(product.reviewCount) : 0,
  tags: ensureArray(product.tags),
});

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

  const response = await fetch(buildUrl(catalogQuery));
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
