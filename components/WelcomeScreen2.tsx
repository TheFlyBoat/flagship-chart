import React from 'react';
import { FlagshipChartTextLogo, CompassRoseLogo } from './icons';
import Starfield from './Starfield';
import { ClipboardPaste, UserStar, Telescope } from 'lucide-react';

interface WelcomeScreenProps {
    onStart: () => void;
}

const WelcomeScreen2: React.FC<WelcomeScreenProps> = ({ onStart }) => {
    return (
        <main className="relative grid place-items-center min-h-screen text-center px-4 overflow-hidden bg-transparent text-slate-300 font-sans antialiased">

            {/* Starfield background (keeps animation) */}
            <div className="absolute inset-0 -z-0">
                <Starfield />
            </div>

            {/* Foreground content */}
            <div className="flex flex-col items-center justify-center gap-10 sm:gap-12 z-10 w-full max-w-6xl">

                {/* Compass animation (unchanged) */}
                <CompassRoseLogo className="w-40 h-32 sm:w-60 sm:h-52 mt-24 " />

                {/* Logo + tagline */}
                <div className="space-y-3 sm:space-y-4 flex flex-col items-center text-center">
                    <FlagshipChartTextLogo animate={true} className="text-5xl sm:text-7xl w-full" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                        Find Your Career's True North
                    </h1>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 mt-8 w-full max-w-5xl">

                    <div className="flex flex-col items-center text-center px-2">
                        <div className="bg-slate-800/50 p-4 sm:p-5 rounded-full mb-4 border border-slate-700">
                            <ClipboardPaste className="w-8 h-8 text-sky-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-200 mb-1">
                            Share Your Story
                        </h3>
                        <p className="text-slate-400 text-sm sm:text-base max-w-[220px]">
                            Tell us about your experiences, skills, and interests.
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center px-2">
                        <div className="bg-slate-800/50 p-4 sm:p-5 rounded-full mb-4 border border-slate-700">
                            <UserStar className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-200 mb-1">
                            Discover Your Identity
                        </h3>
                        <p className="text-slate-400 text-sm sm:text-base max-w-[220px]">
                            We'll craft a unique professional identity statement for you.
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center px-2">
                        <div className="bg-slate-800/50 p-4 sm:p-5 rounded-full mb-4 border border-slate-700">
                            <Telescope className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-200 mb-1">
                            Explore Your Chart
                        </h3>
                        <p className="text-slate-400 text-sm sm:text-base max-w-[220px]">
                            Navigate a personalized map of career possibilities.
                        </p>
                    </div>
                </div>

                {/* Start button */}
<button
  onClick={onStart}
  className="mt-4 px-8 sm:px-10 py-3 sm:py-4 
             text-white font-bold text-lg sm:text-xl rounded-full 
             bg-cyan-500 transition-all duration-600 transform hover:scale-110 
             hover:bg-gradient-to-r hover:from-fuchsia-500 hover:via-indigo-500 hover:to-cyan-500 
             focus:outline-none"
>
  Start Your Journey
</button>


            </div>

            {/* Footer */}
<footer className="w-full flex justify-end pr-4 sm:pr-8 mt-10">
  <p className="text-slate-400 text-xs sm:text-sm tracking-widest">
    © 2025 FlyBoat Creative
  </p>
</footer>



        </main>
    );
};

export default WelcomeScreen2;
