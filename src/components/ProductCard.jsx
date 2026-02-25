import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { useTiltEffect } from '../lib/hooks';
import { useCartStore, useWishlistStore } from '../lib/store';

const ProductCard = ({ product, index = 0 }) => {
  const { ref, handleMouseMove, handleMouseLeave } = useTiltEffect(8);
  const { addItem } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();
  const [isHovered, setIsHovered] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        handleMouseLeave();
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay Actions */}
        <div
          className={`absolute inset-0 bg-black/20 flex items-center justify-center gap-3 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
            }}
            className="p-3 bg-white rounded-full shadow-lg hover:bg-[#A8E6CF] transition-colors"
            aria-label="Add to cart"
          >
            <ShoppingBag className="w-5 h-5 text-[#2D5016]" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleItem(product);
            }}
            className={`p-3 rounded-full shadow-lg transition-colors ${
              isWishlisted ? 'bg-red-500 text-white' : 'bg-white hover:bg-red-50'
            }`}
            aria-label="Add to wishlist"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Featured Badge */}
        {product.featured && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-[#C9A84C] text-white text-xs font-semibold rounded-full">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <Link to={`/product/${product.slug}`}>
        <div className="p-4">
          <h3 className="font-medium text-[#1A1A1A] mb-1 group-hover:text-[#2D5016] transition-colors">
            {product.name}
          </h3>
          <p className="text-[#2D5016] font-semibold text-lg">
            R{parseFloat(product.price).toLocaleString()}
          </p>
          {product.categories && (
            <p className="text-sm text-gray-500 mt-1">{product.categories.name}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
