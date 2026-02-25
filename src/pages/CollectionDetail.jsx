import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { useLenis, useScrollReveal } from '../lib/hooks';

const CollectionDetail = () => {
  const { collectionSlug } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useLenis();
  const productsRef = useScrollReveal({ delay: 0.3 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collectionRes, productsRes] = await Promise.all([
          fetch(`/api/collections?slug=${collectionSlug}`),
          fetch(`/api/products?collection=${collectionSlug}`)
        ]);
        const collectionData = await collectionRes.json();
        const productsData = await productsRes.json();
        setCollection(collectionData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching collection:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [collectionSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A8E6CF] border-t-[#2D5016] rounded-full animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-4">Collection not found</h1>
          <Link to="/collections" className="text-[#2D5016] hover:underline">Back to Collections</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAF7] min-h-screen pt-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#2D5016]">Home</Link>
          <span>/</span>
          <Link to="/collections" className="hover:text-[#2D5016]">Collections</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">{collection.name}</span>
        </nav>
      </div>

      {/* Hero Banner */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={collection.image_url}
          alt={collection.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2D5016]/80 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-serif font-bold text-white mb-4"
            >
              {collection.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-white/80 max-w-xl"
            >
              {collection.description}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section ref={productsRef} className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <p className="text-gray-600">{products.length} products</p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No products in this collection yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CollectionDetail;
