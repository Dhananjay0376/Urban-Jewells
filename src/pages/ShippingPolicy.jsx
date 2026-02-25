import React from 'react';
import { motion } from 'framer-motion';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF7] pt-24 px-4">
      <div className="max-w-4xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-2xl shadow-sm"
        >
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-8">
            Shipping Policy
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="text-sm text-gray-500 mb-6">Last updated: February 2024</p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Order Confirmation Process</h2>
            <p>
              At Urban Jewells, we use a manual WhatsApp confirmation process for all orders. After you place an order on our website:
            </p>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>You will receive an order confirmation email</li>
              <li>Our team will contact you via WhatsApp within 24 hours</li>
              <li>We will confirm your order details and payment method</li>
              <li>Once payment is confirmed, your order will be processed</li>
            </ol>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Shipping Options</h2>
            
            <h3 className="text-lg font-medium text-[#1A1A1A] mt-6 mb-2">Standard Shipping</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Delivery time: 3-5 business days</li>
              <li>Free for orders over R500</li>
              <li>R80 for orders under R500</li>
            </ul>

            <h3 className="text-lg font-medium text-[#1A1A1A] mt-6 mb-2">Express Shipping</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Delivery time: 1-2 business days</li>
              <li>R150 flat rate</li>
              <li>Available in major cities only</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Delivery Areas</h2>
            <p>We currently ship to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>South Africa (all provinces)</li>
              <li>Namibia</li>
              <li>Botswana</li>
              <li>Zimbabwe</li>
              <li>Mozambique</li>
            </ul>
            <p className="mt-4">
              International shipping to other countries is available on request. Please contact us for a quote.
            </p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Order Tracking</h2>
            <p>
              Once your order is shipped, you will receive a tracking number via WhatsApp and email. You can use this to track your package through our courier partner's website.
            </p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Delivery Issues</h2>
            <p>
              If you experience any issues with your delivery, please contact us immediately via WhatsApp. We will work with our courier partners to resolve any problems.
            </p>

            <div className="mt-8 p-6 bg-[#A8E6CF]/20 rounded-xl">
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Need Help?</h3>
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

export default ShippingPolicy;
