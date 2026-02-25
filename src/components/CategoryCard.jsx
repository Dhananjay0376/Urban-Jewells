import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTiltEffect } from '../lib/hooks';

const CategoryCard = ({ category, index = 0 }) => {
  const { ref, handleMouseMove, handleMouseLeave } = useTiltEffect(10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative overflow-hidden rounded-2xl cursor-pointer"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Link to={`/category/${category.slug}`}>
        {/* Background Image */}
        <div className="aspect-[4/5] relative">
          <img
            src={category.image_url}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2D5016]/80 via-[#2D5016]/30 to-transparent" />
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <h3 className="text-2xl font-serif font-semibold text-white mb-2">
              {category.name}
            </h3>
            <p className="text-white/80 text-sm mb-4 line-clamp-2">
              {category.description}
            </p>
            <div className="flex items-center text-[#A8E6CF] font-medium group-hover:translate-x-2 transition-transform">
              Shop Now <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
