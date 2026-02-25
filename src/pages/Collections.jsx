import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CollectionCard from '../components/CollectionCard';
import ParticlesCanvas from '../components/3d/ParticlesCanvas';
import { useLenis, useScrollReveal } from '../lib/hooks';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  useLenis();
  const gridRef = useScrollReveal({ delay: 0.3 });

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await fetch('/api/collections');
        const data = await res.json();
        setCollections(data);
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A8E6CF] border-t-[#2D5016] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAF7] min-h-screen pt-20">
      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D5016] via-[#1A3A0F] to-[#0D1F08]">
          <ParticlesCanvas />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-serif font-bold text-white mb-6"
          >
            Our Collections
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-white/80"
          >
            Discover curated collections designed for every style and occasion
          </motion.p>
        </div>
      </section>

      {/* Collections Grid */}
      <section ref={gridRef} className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection, index) => (
              <CollectionCard key={collection.id} collection={collection} index={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Collections;
