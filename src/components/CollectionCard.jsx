import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTiltEffect } from '../lib/hooks';

const CollectionCard = ({ collection, index = 0 }) => {
  const { ref, handleMouseMove, handleMouseLeave } = useTiltEffect(8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative overflow-hidden rounded-2xl cursor-pointer bg-white shadow-md hover:shadow-xl transition-shadow"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Link to={`/collections/${collection.slug}`}>
        {/* Image */}
        <div className="aspect-[3/4] relative overflow-hidden">
          <img
            src={collection.image_url}
            alt={collection.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl font-serif font-semibold text-white mb-2">
            {collection.name}
          </h3>
          <p className="text-white/80 text-sm mb-4 line-clamp-2">
            {collection.description}
          </p>
          <div className="flex items-center text-[#A8E6CF] font-medium group-hover:translate-x-2 transition-transform">
            View Collection <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CollectionCard;
