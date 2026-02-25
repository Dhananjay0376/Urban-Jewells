import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import SideCart from './components/SideCart';
import { useAuthStore } from './lib/store';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Collections = lazy(() => import('./pages/Collections'));
const CollectionDetail = lazy(() => import('./pages/CollectionDetail'));
const Category = lazy(() => import('./pages/Category'));
const Product = lazy(() => import('./pages/Product'));
const Cart = lazy(() => import('./pages/Cart'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Members = lazy(() => import('./pages/Members'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));
const ReturnsPolicy = lazy(() => import('./pages/ReturnsPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-[#A8E6CF] border-t-[#2D5016] rounded-full animate-spin" />
  </div>
);

// Page Transition Wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

// Back to Top Button
const BackToTop = () => {
  const [show, setShow] = React.useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  if (!show) return null;
  
  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 w-12 h-12 bg-[#2D5016] text-white rounded-full shadow-lg hover:bg-[#1A3A0F] transition-colors z-40 flex items-center justify-center"
      aria-label="Back to top"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
};

// Auth Check Component
const AuthCheck = () => {
  const { checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  return null;
};

// Main Layout
const Layout = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-[#FAFAF7]">
    <Header />
    <main className="flex-1">
      <Suspense fallback={<LoadingSpinner />}>
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </Suspense>
    </main>
    <Footer />
    <SideCart />
    <BackToTop />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthCheck />
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/collections" element={<PageTransition><Collections /></PageTransition>} />
          <Route path="/collections/:collectionSlug" element={<PageTransition><CollectionDetail /></PageTransition>} />
          <Route path="/product/:productSlug" element={<PageTransition><Product /></PageTransition>} />
          <Route path="/category/:categorySlug" element={<PageTransition><Category /></PageTransition>} />
          <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
          <Route path="/thank-you" element={<PageTransition><ThankYou /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
          <Route path="/members" element={<PageTransition><Members /></PageTransition>} />
          <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
          <Route path="/shipping-policy" element={<PageTransition><ShippingPolicy /></PageTransition>} />
          <Route path="/returns-policy" element={<PageTransition><ReturnsPolicy /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
          <Route path="/accessibility" element={<PageTransition><Accessibility /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
