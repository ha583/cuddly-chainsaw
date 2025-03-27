
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#121212]">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
};

export default LoadingSpinner;
