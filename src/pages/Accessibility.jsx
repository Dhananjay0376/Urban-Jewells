import React from 'react';
import { motion } from 'framer-motion';

const Accessibility = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF7] pt-24 px-4">
      <div className="max-w-4xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-2xl shadow-sm"
        >
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-8">
            Accessibility Statement
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="text-sm text-gray-500 mb-6">Last updated: February 2024</p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Our Commitment</h2>
            <p>
              Urban Jewells is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
            </p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Conformance Status</h2>
            <p>
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA. These guidelines explain how to make web content more accessible for people with disabilities.
            </p>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Accessibility Features</h2>
            <p>Our website includes the following accessibility features:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Semantic HTML structure for screen reader compatibility</li>
              <li>Alt text for images</li>
              <li>Keyboard navigation support</li>
              <li>Sufficient color contrast ratios</li>
              <li>Resizable text without loss of functionality</li>
              <li>Clear and consistent navigation</li>
              <li>Form labels and error messages</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Known Issues</h2>
            <p>
              We are actively working to address the following known accessibility issues:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Some 3D canvas elements may not be fully accessible</li>
              <li>Video content may not have captions</li>
              <li>Some interactive elements may require mouse interaction</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Assistive Technology</h2>
            <p>
              Our website is designed to be compatible with the following assistive technologies:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Screen readers (JAWS, NVDA, VoiceOver)</li>
              <li>Screen magnification software</li>
              <li>Speech recognition software</li>
              <li>Keyboard-only navigation</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1A1A1A] mt-8 mb-4">Feedback</h2>
            <p>
              We welcome your feedback on the accessibility of our website. Please let us know if you encounter any barriers:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Email: <a href="mailto:accessibility@urbanjewells.co.za" className="text-[#2D5016]">accessibility@urbanjewells.co.za</a></li>
              <li>WhatsApp: <a href="https://wa.me/27123456789" className="text-[#2D5016]">+27 12 345 6789</a></li>
            </ul>
            <p className="mt-4">
              We try to respond to accessibility feedback within 2 business days.
            </p>

            <div className="mt-8 p-6 bg-[#A8E6CF]/20 rounded-xl">
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Third-Party Content</h3>
              <p>
                While we strive to ensure accessibility throughout our website, some third-party content may not be fully accessible. We are not responsible for the accessibility of third-party sites or content.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Accessibility;
