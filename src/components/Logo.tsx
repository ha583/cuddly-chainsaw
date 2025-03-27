
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center animate-fade-in">
        <div className="absolute w-6 h-6 bg-white rounded-md transform rotate-45 opacity-20"></div>
        <span className="relative font-bold text-white text-xl">T</span>
      </div>
      <span className="font-display font-semibold text-xl animate-slide-up">TuesdaY Ai</span>
    </div>
  );
};

export default Logo;
