import React from 'react';

const Logo = ({ className = '', size = 'default' }) => {
  const sizes = {
    small: 'text-xl',
    default: 'text-2xl',
    large: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        className={`${size === 'large' ? 'w-12 h-12' : size === 'small' ? 'w-6 h-6' : 'w-8 h-8'}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A8E6CF" />
            <stop offset="100%" stopColor="#2D5016" />
          </linearGradient>
          <linearGradient id="gemShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* Gemstone shape */}
        <path
n          d="M20 2L35 15L20 38L5 15L20 2Z"
          fill="url(#gemGradient)"
          opacity="0.9"
        />
        {/* Inner facets */}
        <path
          d="M20 2L35 15L20 22L5 15L20 2Z"
          fill="url(#gemShine)"
          opacity="0.6"
        />
        <path
          d="M20 22L35 15L20 38L5 15L20 22Z"
          fill="#2D5016"
          opacity="0.4"
        />
        {/* Highlight */}
        <path
          d="M20 2L28 10L20 18L12 10L20 2Z"
          fill="white"
          opacity="0.3"
        />
      </svg>
      <span
        className={`font-serif font-bold tracking-tight ${sizes[size]}`}
        style={{
          background: 'linear-gradient(135deg, #2D5016 0%, #A8E6CF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        Urban Jewells
      </span>
    </div>
  );
};

export default Logo;
