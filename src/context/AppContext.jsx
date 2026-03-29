import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CART_STORAGE_KEY, WISHLIST_STORAGE_KEY, getWishlistKey, materializeProductSelection, readStoredArray, writeStoredArray } from '../lib/storefrontState';
import { getShippingAmount, withCollectionCounts } from '../lib/storefrontUtils';
import { isSanityConfigured, loadCatalogFromSanity } from '../lib/sanityCatalog';

const Ctx = createContext(null);

export const useApp = () => useContext(Ctx);

export function AppProvider({ children, emptyProducts, emptyCollections, emptyCategories }) {
  const [cart, setCart] = useState(() => readStoredArray(CART_STORAGE_KEY));
  const [wishlist, setWishlist] = useState(() => readStoredArray(WISHLIST_STORAGE_KEY));
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const cmsEnabled = isSanityConfigured();
  const [catalog, setCatalog] = useState(() => ({
    products: emptyProducts,
    collections: emptyCollections,
    categories: emptyCategories,
    loading: cmsEnabled,
    source: cmsEnabled ? 'loading' : 'unconfigured',
    error: cmsEnabled ? null : 'Sanity catalog is not configured',
  }));

  const refreshCatalog = useCallback(async () => {
    const remoteCatalog = await loadCatalogFromSanity();
    if (!remoteCatalog) return;

    const products = remoteCatalog.products;
    const collections = remoteCatalog.collections;
    const categories = remoteCatalog.categories;

    setCatalog({
      products,
      collections: withCollectionCounts(collections, products),
      categories,
      loading: false,
      source: 'sanity',
      error: null,
    });
  }, []);

  useEffect(() => {
    if (!cmsEnabled) return undefined;

    let cancelled = false;
    const safeRefresh = async () => {
      try {
        await refreshCatalog();
      } catch (error) {
        console.error('Failed to load catalog from Sanity:', error);
        if (cancelled) return;
        setCatalog(prev => ({ ...prev, loading: false, source: 'error', error: error.message || 'Failed to load catalog' }));
      }
    };

    safeRefresh();

    const onFocus = () => {
      safeRefresh();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [cmsEnabled, refreshCatalog]);

  useEffect(() => {
    writeStoredArray(CART_STORAGE_KEY, cart);
  }, [cart]);

  useEffect(() => {
    writeStoredArray(WISHLIST_STORAGE_KEY, wishlist);
  }, [wishlist]);

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const addToCart = useCallback((product, size = null, qty = 1, variant = null) => {
    const selectedProduct = materializeProductSelection(product, variant);
    const key = `${selectedProduct.id}-${selectedProduct.selectedVariantId || 'base'}-${size || 'nosize'}`;
    setCart(prev => {
      const existing = prev.find(item => item.cartKey === key);
      if (existing) {
        return prev.map(item => item.cartKey === key ? { ...item, quantity: Math.min(item.quantity + qty, 10) } : item);
      }
      return [...prev, { ...selectedProduct, size, quantity: qty, cartKey: key }];
    });
    setCartOpen(true);
    toast(`${selectedProduct.name}${selectedProduct.selectedColorName ? ` (${selectedProduct.selectedColorName})` : ''} added OK`);
  }, [toast]);

  const removeFromCart = useCallback(key => setCart(prev => prev.filter(item => item.cartKey !== key)), []);

  const updateQty = useCallback((key, qty) => {
    if (qty < 1) {
      removeFromCart(key);
      return;
    }
    setCart(prev => prev.map(item => item.cartKey === key ? { ...item, quantity: Math.min(qty, 10) } : item));
  }, [removeFromCart]);

  const toggleWishlist = useCallback((product, variant = null) => {
    const selectedProduct = materializeProductSelection(product, variant);
    const wishKey = getWishlistKey(product, variant);
    const has = wishlist.some(item => item.wishKey === wishKey);
    if (has) {
      setWishlist(prev => prev.filter(item => item.wishKey !== wishKey));
      toast('Removed from wishlist');
    } else {
      setWishlist(prev => [...prev, { ...selectedProduct, wishKey }]);
      toast('Added to wishlist <3');
    }
  }, [wishlist, toast]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartShipping = getShippingAmount(cartTotal);
  const cartGrandTotal = cartTotal + cartShipping;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Ctx.Provider value={{
      cart,
      setCart,
      cartOpen,
      setCartOpen,
      addToCart,
      removeFromCart,
      updateQty,
      cartTotal,
      cartShipping,
      cartGrandTotal,
      cartCount,
      wishlist,
      toggleWishlist,
      toasts,
      setToasts,
      toast,
      searchOpen,
      setSearchOpen,
      products: catalog.products,
      collections: catalog.collections,
      categories: catalog.categories,
      catalogLoading: catalog.loading,
      catalogSource: catalog.source,
      catalogError: catalog.error,
      cmsEnabled,
    }}>
      {children}
    </Ctx.Provider>
  );
}
