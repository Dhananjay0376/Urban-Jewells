import React from 'react';
import { motion } from 'framer-motion';

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF7] pt-24 px-4">
      <div className="max-w-4xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-2xl shadow-sm"
        >
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-8">
            Terms & Conditions
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="text-sm text-gray-500 mb-6">Last updated: February 2024</p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing and using the Urban Jewells website, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our website.
            </p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">2. Products and Pricing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All prices are displayed in South African Rand (ZAR) and include VAT</li>
              <li>Prices are subject to change without notice</li>
              <li>We reserve the right to correct any pricing errors</li>
              <li>Product images are for illustration purposes; actual products may vary slightly</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">3. Orders and Payment</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Orders are confirmed after WhatsApp verification and payment</li>
              <li>We reserve the right to refuse or cancel any order</li>
              <li>Payment must be received before orders are processed</li>
              <li>We accept EFT, card payments via PayFast, and cash on delivery (selected areas)</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">4. Delivery</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Delivery times are estimates and not guaranteed</li>
              <li>Risk passes to you upon delivery</li>
              <li>You must inspect goods upon delivery and report any damage immediately</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">5. Intellectual Property</h2>
            <p>
              All content on this website, including text, images, logos, and designs, is the property of Urban Jewells and is protected by copyright and other intellectual property laws.
            </p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Urban Jewells shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or products.
            </p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">7. Governing Law</h2>
            <p>
              These terms are governed by the laws of the Republic of South Africa. Any disputes shall be resolved in the courts of South Africa.
            </p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">8. Changes to Terms</h2>
            <p>
              We reserve the right to update these terms at any time. Continued use of the website constitutes acceptance of any changes.
            </p>

            <div className="mt-8 p-6 bg-[#A8E6CF]/20 rounded-xl">
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Contact Us</h3>
              <p>
                For questions about these terms, email us at: <a href="mailto:legal@urbanjewells.co.za" className="text-[#2D5016]">legal@urbanjewells.co.za</a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
