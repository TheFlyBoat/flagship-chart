import React from 'react';
import { FlagshipChartTextLogo, CompassRoseLogo } from './icons';
import Starfield from './Starfield';
import { ClipboardPaste, UserStar, Telescope } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen2: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="relative flex flex-col items-center justify-center text-center p-4" style={{ zIndex: 0 }}>
      <Starfield />
      <div className="relative z-10 flex flex-col items-center justify-center flex-grow text-center">
        <CompassRoseLogo className="w-24 h-24 sm:w-32 sm:h-32" />
        <div className="flex flex-col items-center mb-16 sm:mb-20">
          <div className="flex items-center gap-4">
              <FlagshipChartTextLogo animate={true} className="text-5xl sm:text-7xl w-full" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-100 tracking-tight mt-4">Find Your Career's True North.</h1>
        </div>

        <div className="mb-16 sm:mb-20 flex flex-col sm:flex-row justify-center gap-8 sm:gap-12 max-w-4xl w-full">
          <div className="flex flex-col items-center text-center">
              <div className="bg-slate-800/50 p-4 rounded-full mb-4 border border-slate-700">
                  <ClipboardPaste className="w-8 h-8 text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">1. Share Your Story</h3>
              <p className="text-slate-400 text-sm max-w-[200px]">Tell us about your experiences, skills, and interests.</p>
          </div>
          <div className="flex flex-col items-center text-center">
              <div className="bg-slate-800/50 p-4 rounded-full mb-4 border border-slate-700">
                  <UserStar className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">2. Discover Your Identity</h3>
              <p className="text-slate-400 text-sm max-w-[200px]">We'll craft a unique professional identity statement for you.</p>
          </div>
          <div className="flex flex-col items-center text-center">
              <div className="bg-slate-800/50 p-4 rounded-full mb-4 border border-slate-700">
                  <Telescope className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">3. Explore Your Chart</h3>
              <p className="text-slate-400 text-sm max-w-[200px]">Navigate a personalized map of career possibilities.</p>
          </div>
        </div>
        <button
          onClick={onStart}
          className="px-8 py-3 sm:px-12 sm:py-4 bg-sky-500 text-white font-bold text-lg sm:text-xl rounded-full shadow-lg shadow-sky-500/30 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-400 transform hover:scale-105 transition-transform duration-300 ease-in-out"
        >
          Start Your Journey
        </button>
      </div>
      <div className="absolute bottom-0 right-0 p-8">
        <p className="text-slate-400 text-sm tracking-widest">© 2025 FlyBoat Creative</p>
      </div>
    </div>
  );
};

export default WelcomeScreen2;
