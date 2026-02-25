import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF7] pt-24 px-4">
      <div className="max-w-2xl mx-auto text-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <div className="text-[200px] font-serif font-bold text-[#A8E6CF]/30 leading-none">
            404
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-4"
        >
          Page Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 mb-8"
        >
          Oops! The page you're looking for seems to have wandered off. Let's get you back on track.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2D5016] text-white font-semibold rounded-lg hover:bg-[#1A3A0F] transition-colors"
          >
            <Home className="w-5 h-5" /> Back to Home
          </Link>
          <Link
            to="/collections"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#2D5016] text-[#2D5016] font-semibold rounded-lg hover:bg-[#2D5016] hover:text-white transition-colors"
          >
            <Search className="w-5 h-5" /> Browse Collections
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
