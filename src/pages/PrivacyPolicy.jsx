import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF7] pt-24 px-4">
      <div className="max-w-4xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-2xl shadow-sm"
        >
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-8">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="text-sm text-gray-500 mb-6">Last updated: February 2024</p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. Introduction</h2>
            <p>
              Urban Jewells ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
            </p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Name and contact information (email, phone number)</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information</li>
              <li>Order history and preferences</li>
              <li>Communications with our customer service team</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders</li>
              <li>Send promotional emails (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Prevent fraud and ensure security</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">4. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information with third-party service providers who assist us in operating our business, such as payment processors and shipping carriers.
            </p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">6. Your Rights</h2>
            <p>Under the Protection of Personal Information Act (POPIA), you have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2">
              Email: <a href="mailto:privacy@urbanjewells.co.za" className="text-[#2D5016]">privacy@urbanjewells.co.za</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
