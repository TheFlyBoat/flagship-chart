import React, { useState } from 'react';

interface TooltipProps {
  text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block ml-2"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-slate-500 border-2 border-slate-500 rounded-full cursor-pointer">
        ?
      </span>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-slate-300 text-sm rounded-lg shadow-lg z-10 border border-slate-700">
          <p className="font-semibold text-slate-100 mb-1">Why we ask this</p>
          <p>{text}</p>
          <p className="text-xs text-slate-400 mt-2">Providing this is optional, but helps us give you much more accurate results.</p>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
