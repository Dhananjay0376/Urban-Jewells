export function routeToHash(page, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  const queryString = query.toString();
  switch (page) {
    case 'home': return '#/';
    case 'all-pieces': return `#/all-pieces${queryString ? `?${queryString}` : ''}`;
    case 'categories': return '#/categories';
    case 'collections': return '#/collections';
    case 'collection-detail': return `#/collections/${encodeURIComponent(params.slug || '')}`;
    case 'category': return `#/categories/${encodeURIComponent(params.slug || '')}`;
    case 'product': return `#/product/${encodeURIComponent(params.slug || '')}`;
    case 'cart': return '#/cart';
    case 'about': return '#/about';
    case 'contact': return '#/contact';
    case 'wishlist': return '#/wishlist';
    case 'admin': return '#/admin';
    case 'privacy-policy': return '#/privacy-policy';
    case 'shipping': return '#/shipping';
    case 'returns': return '#/returns';
    case 'terms': return '#/terms';
    default: return '#/';
  }
}

export function routeFromHash(hash) {
  const cleaned = (hash || '#/').replace(/^#/, '').replace(/^\/+/, '');
  const [pathPart, queryPart = ''] = cleaned.split('?');
  const parts = pathPart ? pathPart.split('/').filter(Boolean) : [];
  const query = new URLSearchParams(queryPart);
  const safeDecode = value => {
    try { return decodeURIComponent(value || ''); } catch { return value || ''; }
  };

  if (parts.length === 0) return { page: 'home', params: {} };

  if (parts[0] === 'all-pieces') return {
    page: 'all-pieces',
    params: {
      category: query.get('category') || undefined,
      sort: query.get('sort') || undefined,
      collection: query.get('collection') || undefined,
      price: query.get('price') || undefined,
      stock: query.get('stock') || undefined,
      new: query.get('new') || undefined,
      sale: query.get('sale') || undefined,
    },
  };
  if (parts[0] === 'categories' && parts[1]) return { page: 'category', params: { slug: safeDecode(parts[1]) } };
  if (parts[0] === 'categories') return { page: 'categories', params: {} };
  if (parts[0] === 'collections' && parts[1]) return { page: 'collection-detail', params: { slug: safeDecode(parts[1]) } };
  if (parts[0] === 'collections') return { page: 'collections', params: {} };
  if (parts[0] === 'product' && parts[1]) return { page: 'product', params: { slug: safeDecode(parts[1]) } };
  if (parts[0] === 'cart') return { page: 'cart', params: {} };
  if (parts[0] === 'about') return { page: 'about', params: {} };
  if (parts[0] === 'contact') return { page: 'contact', params: {} };
  if (parts[0] === 'wishlist') return { page: 'wishlist', params: {} };
  if (parts[0] === 'admin') return { page: 'admin', params: {} };
  if (parts[0] === 'privacy-policy') return { page: 'privacy-policy', params: {} };
  if (parts[0] === 'shipping') return { page: 'shipping', params: {} };
  if (parts[0] === 'returns') return { page: 'returns', params: {} };
  if (parts[0] === 'terms') return { page: 'terms', params: {} };

  return { page: 'home', params: {} };
}
