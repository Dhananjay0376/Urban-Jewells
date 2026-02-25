import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useLenis, useScrollReveal } from '../lib/hooks';

const Contact = () => {
  useLenis();
  const formRef = useScrollReveal();
  const faqRef = useScrollReveal({ delay: 0.2 });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: 'How do I place an order?',
      answer: 'Simply add items to your cart, proceed to checkout, fill in your details, and submit your order. We will contact you via WhatsApp to confirm payment and delivery details.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept bank transfers (EFT), card payments via PayFast, and cash on delivery for certain areas. Payment details will be shared via WhatsApp after you place your order.'
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping within South Africa takes 3-5 business days. Express shipping (1-2 days) is available at an additional cost. International shipping times vary by destination.'
    },
    {
      question: 'Do you offer free shipping?',
      answer: 'Yes! We offer free standard shipping on all orders over R500 within South Africa.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We accept returns within 14 days of delivery, provided the item is unworn and in its original packaging. Please contact us via WhatsApp to initiate a return.'
    },
    {
      question: 'Are your products made from real materials?',
      answer: 'Yes! All our jewellery is crafted from high-quality materials including sterling silver, gold-plated metals, genuine gemstones, and freshwater pearls. Material details are listed on each product page.'
    },
    {
      question: 'How do I care for my jewellery?',
      answer: 'Store your jewellery in a cool, dry place away from direct sunlight. Avoid contact with water, perfume, and chemicals. Clean gently with a soft cloth after each wear.'
    },
    {
      question: 'Can I track my order?',
      answer: 'Yes! Once your order is shipped, we will send you a tracking number via WhatsApp so you can monitor your delivery.'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="bg-[#FAFAF7] min-h-screen pt-24">
      {/* Hero */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#2D5016] to-[#1A3A0F]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-4"
          >
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/80"
          >
            We'd love to hear from you
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div ref={formRef} className="bg-white p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-6">Send us a Message</h2>

            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#A8E6CF] rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-[#2D5016]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">Message Sent!</h3>
                <p className="text-gray-600">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8E6CF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8E6CF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8E6CF]"
                  >
                    <option>General Inquiry</option>
                    <option>Order Support</option>
                    <option>Product Question</option>
                    <option>Returns & Refunds</option>
                    <option>Partnership Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8E6CF]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#2D5016] text-white font-semibold rounded-lg hover:bg-[#1A3A0F] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <h2 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-6">Contact Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#A8E6CF]/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#2D5016]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1A1A]">Email</p>
                    <a href="mailto:info@urbanjewells.co.za" className="text-gray-600 hover:text-[#2D5016]">
                      info@urbanjewells.co.za
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#A8E6CF]/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-[#2D5016]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1A1A]">WhatsApp</p>
                    <a href="https://wa.me/27123456789" className="text-gray-600 hover:text-[#2D5016]">
                      +27 12 345 6789
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#A8E6CF]/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#2D5016]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1A1A]">Location</p>
                    <p className="text-gray-600">Johannesburg, South Africa</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#A8E6CF]/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#2D5016]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1A1A]">Operating Hours</p>
                    <p className="text-gray-600">Mon - Fri: 9am - 5pm SAST</p>
                    <p className="text-gray-600">Sat: 9am - 1pm SAST</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <motion.div ref={faqRef} id="faq" className="mt-16">
          <h2 className="text-2xl font-serif font-bold text-[#1A1A1A] text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-medium text-[#1A1A1A]">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-6 pb-6 text-gray-600"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
