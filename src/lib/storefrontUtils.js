export const CURRENCY_CODE = 'INR';
export const FREE_SHIPPING_THRESHOLD = 2000;
export const STANDARD_SHIPPING_FEE = 99;

export const formatPrice = n => `${CURRENCY_CODE} ${Number(n).toLocaleString('en-IN')}`;

export const formatDiscount = (originalPrice, currentPrice) => Math.round(((originalPrice - currentPrice) / originalPrice) * 100);

export const genRef = () => `UJ-${Date.now().toString(36).toUpperCase()}`;

export const getShippingAmount = subtotal => subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;

export const getShippingMessage = subtotal => subtotal >= FREE_SHIPPING_THRESHOLD
  ? `Free shipping applied on orders above ${formatPrice(FREE_SHIPPING_THRESHOLD)}`
  : `Add ${formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more to unlock free shipping`;

export const getOptimizedImageUrl = (url, { width, height, quality = 80, mode = 'cover' } = {}) => {
  if (!url) return '';
  if (url.includes('cdn.sanity.io/images/')) {
    const next = new URL(url);
    next.searchParams.set('auto', 'format');
    if (width) next.searchParams.set('w', String(width));
    if (height && mode === 'cover') next.searchParams.set('h', String(height));
    next.searchParams.set('q', String(quality));
    next.searchParams.set('fit', mode === 'cover' ? 'crop' : 'max');
    return next.toString();
  }
  if (url.includes('/image/upload/')) {
    const transforms = ['f_auto', `q_${quality === 80 ? 'auto:good' : quality}`];
    if (width) transforms.push(`w_${width}`);
    if (height && mode === 'cover') transforms.push(`h_${height}`);
    transforms.push(mode === 'cover' ? 'c_fill' : 'c_limit');
    if (mode === 'cover') transforms.push('g_auto');
    return url.replace('/image/upload/', `/image/upload/${transforms.join(',')}/`);
  }
  return url;
};

export const withCollectionCounts = (collections, products) => collections.map(collection => ({
  ...collection,
  productCount: collection.productCount || products.filter(product => product.collection === collection.slug).length,
}));
