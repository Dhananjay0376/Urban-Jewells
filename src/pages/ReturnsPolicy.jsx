import React from 'react';
import { motion } from 'framer-motion';

const ReturnsPolicy = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF7] pt-24 px-4">
      <div className="max-w-4xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-2xl shadow-sm"
        >
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-8">
            Returns & Refund Policy
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="text-sm text-gray-500 mb-6">Last updated: February 2024</p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Return Policy</h2>
            <p>
              We want you to be completely satisfied with your purchase. If you're not happy with your order, we accept returns within 14 days of delivery.
            </p>

            <h3 className="text-lg font-medium text-[#1A1A1A] mt-6 mb-2">Return Conditions</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Item must be unworn and in original condition</li>
              <li>All tags and packaging must be intact</li>
              <li>Item must be returned in its original box/pouch</li>
              <li>Proof of purchase is required</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">How to Initiate a Return</h2>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>Contact us via WhatsApp within 14 days of receiving your order</li>
              <li>Provide your order number and reason for return</li>
              <li>We will provide you with a return shipping label</li>
              <li>Pack the item securely and send it back to us</li>
              <li>Once we receive and inspect the item, we will process your refund</li>
            </ol>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Refund Options</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Store Credit:</strong> Receive a full refund as store credit (no shipping deduction)</li>
              <li><strong>Original Payment Method:</strong> Refund to your original payment method (minus shipping costs)</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Non-Returnable Items</h2>
            <p>The following items cannot be returned:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Custom or personalized items</li>
              <li>Earrings (for hygiene reasons)</li>
              <li>Items marked as "Final Sale"</li>
              <li>Gift cards</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Damaged or Defective Items</h2>
            <p>
              If you receive a damaged or defective item, please contact us immediately via WhatsApp with photos of the damage. We will arrange a replacement or full refund at no additional cost to you.
            </p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Exchange Policy</h2>
            <p>
              We're happy to exchange your item for a different size or style, subject to availability. Contact us via WhatsApp to arrange an exchange.
            </p>

            <div className="mt-8 p-6 bg-[#A8E6CF]/20 rounded-xl">
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Questions?</h3>
              <p>
                Contact us on WhatsApp: <a href="https://wa.me/27123456789" className="text-[#2D5016]">+27 12 345 6789</a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReturnsPolicy;
