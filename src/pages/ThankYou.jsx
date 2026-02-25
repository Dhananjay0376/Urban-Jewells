import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, MessageCircle, ShoppingBag } from 'lucide-react';

const ThankYou = () => {
  const whatsappMessage = encodeURIComponent(
    "Hi! I just placed an order on Urban Jewells and I'm ready to confirm payment."
  );
  const whatsappLink = `https://wa.me/27123456789?text=${whatsappMessage}`; // Replace with actual number

  return (
    <div className="min-h-screen bg-[#FAFAF7] pt-24 px-4">
      <div className="max-w-2xl mx-auto text-center py-20">
        {/* Animated Checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="w-24 h-24 mx-auto mb-8 bg-[#A8E6CF] rounded-full flex items-center justify-center"
        >
          <Check className="w-12 h-12 text-[#2D5016]" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-serif font-bold text-[#1A1A1A] mb-6"
        >
          Order Received! 🎉
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-gray-600 mb-8"
        >
          We've received your order details and will contact you on WhatsApp shortly
          to confirm payment and delivery.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] text-white font-semibold rounded-lg hover:bg-[#128C7E] transition-colors"
          >
            <MessageCircle className="w-5 h-5" /> Chat with us on WhatsApp
          </a>
          <Link
            to="/collections"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#2D5016] text-[#2D5016] font-semibold rounded-lg hover:bg-[#2D5016] hover:text-white transition-colors"
          >
            <ShoppingBag className="w-5 h-5" /> Continue Shopping
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 p-6 bg-white rounded-xl shadow-sm"
        >
          <h3 className="font-semibold text-[#1A1A1A] mb-2">What happens next?</h3>
          <ol className="text-left text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-[#A8E6CF] rounded-full flex items-center justify-center text-sm font-medium text-[#2D5016] flex-shrink-0">1</span>
              We'll review your order and contact you via WhatsApp within 24 hours.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-[#A8E6CF] rounded-full flex items-center justify-center text-sm font-medium text-[#2D5016] flex-shrink-0">2</span>
              Confirm payment details and delivery address.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-[#A8E6CF] rounded-full flex items-center justify-center text-sm font-medium text-[#2D5016] flex-shrink-0">3</span>
              Your beautiful jewellery will be on its way!
            </li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
};

export default ThankYou;
