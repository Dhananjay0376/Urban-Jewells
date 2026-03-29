import { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { applyDocumentMeta, buildMetaForRoute } from '../lib/seoMeta';

export function RouteMetaManager({ page, params, getOptimizedImageUrl }) {
  const { products, collections, categories } = useApp();
  const meta = useMemo(
    () => buildMetaForRoute({ page, params, products, collections, categories }),
    [page, params, products, collections, categories]
  );

  useEffect(() => {
    applyDocumentMeta(meta, getOptimizedImageUrl);
  }, [getOptimizedImageUrl, meta]);

  return null;
}
