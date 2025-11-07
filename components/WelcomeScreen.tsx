import React from 'react';
import { FlagshipChartTextLogo, CompassRoseLogo } from './icons';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-grow text-center p-4">
      <CompassRoseLogo className="w-24 h-24 sm:w-32 sm:h-32" />
      <FlagshipChartTextLogo animate={true} className="text-5xl sm:text-7xl mb-16 sm:mb-20 w-full" />
      <button
        onClick={onStart}
        className="px-8 py-3 sm:px-12 sm:py-4 bg-sky-500 text-white font-bold text-lg sm:text-xl rounded-full shadow-lg shadow-sky-500/30 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-400 transform hover:scale-105 transition-transform duration-300 ease-in-out"
      >
        Start
      </button>
    </div>
  );
};

export default WelcomeScreen;