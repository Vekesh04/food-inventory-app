import React from 'react';

const RestaurantLogo: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 rounded-2xl shadow-lg">
      <div className="relative">
        {/* Spice/Flame Icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          {/* Main flame/spice shape */}
          <path
            d="M16 2C16 2 12 6 12 12C12 16 14 18 16 18C18 18 20 16 20 12C20 6 16 2 16 2Z"
            fill="currentColor"
            opacity="0.9"
          />
          {/* Secondary flame */}
          <path
            d="M16 8C16 8 14 10 14 13C14 15 15 16 16 16C17 16 18 15 18 13C18 10 16 8 16 8Z"
            fill="currentColor"
            opacity="0.7"
          />
          {/* Spice dots */}
          <circle cx="10" cy="20" r="2" fill="currentColor" opacity="0.8" />
          <circle cx="22" cy="20" r="2" fill="currentColor" opacity="0.8" />
          <circle cx="16" cy="24" r="2" fill="currentColor" opacity="0.8" />
          <circle cx="13" cy="28" r="1.5" fill="currentColor" opacity="0.6" />
          <circle cx="19" cy="28" r="1.5" fill="currentColor" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
};

export default RestaurantLogo;