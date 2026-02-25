import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Minus, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductCanvas from '../components/3d/ProductCanvas';
import { useLenis, useScrollReveal, useTiltEffect } from '../lib/hooks';
import { useCartStore, useWishlistStore } from '../lib/store';

const Product = () => {
  const { productSlug } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState('description');
  const { ref: imageRef, handleMouseMove, handleMouseLeave } = useTiltEffect(5);
  useLenis();
  const relatedRef = useScrollReveal({ delay: 0.3 });

  const { addItem } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();

  const sizes = ['Small', 'Medium', 'Large', 'Adjustable'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productRes = await fetch(`/api/products?slug=${productSlug}`);
        const productData = await productRes.json();
        setProduct(productData);

        if (productData.category_id) {
          const relatedRes = await fetch(`/api/products`);
          const relatedData = await relatedRes.json();
          setRelatedProducts(
            relatedData.filter(p => p.id !== productData.id).slice(0, 4)
          );
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productSlug]);

  const handleAddToCart = () => {
    addItem(product, quantity, selectedSize);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A8E6CF] border-t-[#2D5016] rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-4">Product not found</h1>
          <Link to="/collections" className="text-[#2D5016] hover:underline">Back to Collections</Link>
        </div>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="bg-[#FAFAF7] min-h-screen pt-24">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#2D5016]">Home</Link>
          <span>/</span>
          {product.categories && (
            <>
              <Link to={`/category/${product.categories.slug}`} className="hover:text-[#2D5016]">
                {product.categories.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[#1A1A1A]">{product.name}</span>
        </nav>
      </div>

      {/* Product Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left - 3D Product Viewer */}
          <div
            ref={imageRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative aspect-square bg-gradient-to-br from-[#2D5016]/10 to-[#A8E6CF]/10 rounded-2xl overflow-hidden"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* 3D Canvas Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <ProductCanvas image={product.image_url} />
            </div>
          </div>

          {/* Right - Product Info */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-4"
            >
              {product.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-semibold text-[#2D5016] mb-6"
            >
              R{parseFloat(product.price).toLocaleString()}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 mb-8"
            >
              {product.description}
            </motion.p>

            {/* Size Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Size</label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      selectedSize === size
                        ? 'border-[#2D5016] bg-[#2D5016] text-white'
                        : 'border-gray-300 hover:border-[#2D5016]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded-lg hover:border-[#2D5016] transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-gray-300 rounded-lg hover:border-[#2D5016] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#A8E6CF] text-[#2D5016] font-semibold rounded-lg hover:bg-[#8DD4B8] transition-colors"
              >
                <ShoppingBag className="w-5 h-5" /> Add to Cart
              </button>
              <button
                onClick={() => toggleItem(product)}
                className={`p-4 border rounded-lg transition-colors ${
                  isWishlisted
                    ? 'border-red-500 bg-red-50 text-red-500'
                    : 'border-gray-300 hover:border-red-500 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Accordion */}
            <div className="border-t border-gray-200">
              {[
                { id: 'description', title: 'Full Description', content: product.description },
                { id: 'materials', title: 'Materials & Care', content: product.materials || 'Made from high-quality materials. To maintain its beauty, store in a cool, dry place and avoid contact with water, perfume, and chemicals.' },
                { id: 'shipping', title: 'Shipping Info', content: 'We offer free shipping on orders over R500. Standard delivery takes 3-5 business days within South Africa. International shipping available at additional cost.' }
              ].map((item) => (
                <div key={item.id} className="border-b border-gray-200">
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)}
                    className="w-full flex items-center justify-between py-4 text-left"
                  >
                    <span className="font-medium text-[#1A1A1A]">{item.title}</span>
                    {activeAccordion === item.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {activeAccordion === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="pb-4 text-gray-600"
                    >
                      {item.content}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section ref={relatedRef} className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Product;
