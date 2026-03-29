export const CART_STORAGE_KEY = 'urban-jewells-cart-v1';
export const WISHLIST_STORAGE_KEY = 'urban-jewells-wishlist-v1';

export const getDefaultVariant = product => Array.isArray(product?.variants) && product.variants.length ? product.variants[0] : null;

export const getDisplayImages = (product, variant = null) => {
  const variantImages = Array.isArray(variant?.images) ? variant.images.filter(Boolean) : [];
  if (variantImages.length) return variantImages;
  return Array.isArray(product?.images) ? product.images.filter(Boolean) : [];
};

export const getDisplayPrice = (product, variant = null) => typeof variant?.price === 'number' ? variant.price : product?.price;

export const getDisplayOriginalPrice = (product, variant = null) => typeof variant?.originalPrice === 'number' ? variant.originalPrice : product?.originalPrice;

export const getDisplayStock = (product, variant = null) => typeof variant?.inStock === 'boolean' ? variant.inStock : product?.inStock !== false;

export const getWishlistKey = (product, variant = null) => {
  const activeVariant = variant || getDefaultVariant(product);
  return `${product.id}-${activeVariant?.id || 'base'}`;
};

export const materializeProductSelection = (product, variant = null) => {
  const activeVariant = variant || getDefaultVariant(product);
  return {
    ...product,
    selectedVariantId: activeVariant?.id || null,
    selectedColorName: activeVariant?.colorName || null,
    selectedColorHex: activeVariant?.colorHex || null,
    images: getDisplayImages(product, activeVariant),
    price: getDisplayPrice(product, activeVariant),
    originalPrice: getDisplayOriginalPrice(product, activeVariant),
    inStock: getDisplayStock(product, activeVariant),
  };
};

export const readStoredArray = key => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeStoredArray = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
