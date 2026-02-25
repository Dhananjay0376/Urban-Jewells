import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const TestimonialCard = ({ testimonial, index = 0 }) => {
  const initials = testimonial.customer_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex-shrink-0 w-80 bg-white rounded-xl p-6 shadow-sm"
    >
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < testimonial.rating ? 'text-[#C9A84C] fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Quote */}
      <p className="text-[#1A1A1A] text-sm leading-relaxed mb-4">
        "{testimonial.quote}"
      </p>

      {/* Customer */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A8E6CF] to-[#2D5016] flex items-center justify-center text-white font-semibold text-sm">
          {initials}
        </div>
        <span className="font-medium text-[#1A1A1A]">{testimonial.customer_name}</span>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;
