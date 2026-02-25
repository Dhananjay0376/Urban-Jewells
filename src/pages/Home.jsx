import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';
import HeroCanvas from '../components/3d/HeroCanvas';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import TestimonialCard from '../components/TestimonialCard';
import { useLenis, useScrollReveal } from '../lib/hooks';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const welcomeRef = useScrollReveal();
  const featuredRef = useScrollReveal({ delay: 0.2 });
  const categoriesRef = useScrollReveal({ delay: 0.3 });
  const allProductsRef = useScrollReveal({ delay: 0.4 });
  const testimonialsRef = useScrollReveal({ delay: 0.5 });
  const contactRef = useScrollReveal({ delay: 0.6 });

  useLenis();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, testimonialsRes] = await Promise.all([
          fetch('/api/products?featured=true'),
          fetch('/api/categories'),
          fetch('/api/testimonials')
        ]);
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        const testimonialsData = await testimonialsRes.json();
        setProducts(productsData);
        setCategories(categoriesData);
        setTestimonials(testimonialsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const scrollIndicatorRef = useRef(null);

  useEffect(() => {
    const el = scrollIndicatorRef.current;
    if (!el) return;
    
    const animate = () => {
      el.animate(
        [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: 'translateY(10px)', opacity: 0.5 },
          { transform: 'translateY(0)', opacity: 1 }
        ],
        { duration: 1500, iterations: Infinity }
      );
    };
    animate();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A8E6CF] border-t-[#2D5016] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAF7]">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* 3D Canvas Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D5016] via-[#1A3A0F] to-[#0D1F08]">
          <HeroCanvas mousePosition={mousePosition} />
        </div>
        
        {/* Noise Texture Overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6"
          >
            Crafted for the Bold
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-xl md:text-2xl text-white/80 max-w-2xl mb-10"
          >
            Discover Urban Jewells — where modern design meets timeless elegance
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/collections"
              className="px-8 py-4 bg-[#A8E6CF] text-[#2D5016] font-semibold rounded-full hover:bg-[#8DD4B8] transition-colors"
            >
              Shop Now
            </Link>
            <Link
              to="/collections"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-[#2D5016] transition-colors"
            >
              Explore Collections
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60"
        >
          <ChevronDown className="w-8 h-8" />
        </div>
      </section>

      {/* Welcome Banner */}
      <section ref={welcomeRef} className="py-20 px-4 bg-gradient-to-r from-[#A8E6CF]/20 to-[#A8E6CF]/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#1A1A1A] mb-6">
            Welcome to Urban Jewells
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            We craft exquisite jewellery that tells your story. Each piece is thoughtfully designed
            to blend contemporary aesthetics with timeless elegance. From delicate everyday pieces
            to stunning statement jewellery, discover pieces that resonate with your unique style.
          </p>
        </div>
      </section>

      {/* Featured Products */}
      <section ref={featuredRef} className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A]">
              Featured Pieces
            </h2>
            <Link
              to="/collections"
              className="flex items-center text-[#2D5016] font-medium hover:underline"
            >
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.slice(0, 4).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section ref={categoriesRef} className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] text-center mb-12">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* All Products */}
      <section ref={allProductsRef} className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-12">
            All Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsRef} className="py-20 px-4 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] text-center mb-12">
            What Our Customers Say
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Teaser */}
      <section ref={contactRef} className="py-20 px-4 bg-[#2D5016]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
            Get in Touch
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Have questions? We'd love to hear from you. Our team is here to help you find the perfect piece.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-8 py-4 bg-[#A8E6CF] text-[#2D5016] font-semibold rounded-full hover:bg-[#8DD4B8] transition-colors"
          >
            Contact Us <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
