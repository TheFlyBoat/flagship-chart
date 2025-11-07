import React, { useState, useEffect } from 'react';
import { UserData, IdentityData, CareerPath } from '../types';
import { generateCareerProfile } from '../services/geminiService';
import { CompassRoseLogo } from './icons';

interface Step2IdentityProps {
  userData: UserData;
  onComplete: (identity: IdentityData, paths: CareerPath[]) => void;
}

const loadingMessages = [
  "Analysing data...",
  "Parsing tasks...",
  "Validating skills...",
  "Stamping loyalty card...",
  "Skilling, skull, skills...",
  "Analysing interests...",
  "Asking ChatGPT what to do...",
  "Working in your profile...",
  "Validating career paths...",
  "Eliminating verbose...",
  "Googling verbose meaning...",
  "Refining chart...",
];

const Step2Identity: React.FC<Step2IdentityProps> = ({ userData, onComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  useEffect(() => {
    let isCancelled = false;

    const generateProfile = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const { identity, paths } = await generateCareerProfile(userData);
        if (!isCancelled) {
          onComplete(identity, paths);
        }
      } catch (e) {
        console.error("Failed to generate career profile:", e);
        if (!isCancelled) {
          setError("Sorry, something went wrong while charting your course. Please try again.");
          setIsLoading(false);
        }
      }
    };

    generateProfile();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      {isLoading && (
        <>
          <CompassRoseLogo className="h-24 w-24" />
          <h2 key={currentMessageIndex} className="text-xl font-medium text-slate-400 mt-8 animate-in fade-in duration-500">
            {loadingMessages[currentMessageIndex]}
          </h2>
        </>
      )}
      {error && (
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold text-red-500">An Error Occurred</h2>
          <p className="text-slate-400 mt-4 bg-red-900/50 border border-red-500/50 p-4 rounded-md">{error}</p>
        </div>
      )}
    </div>
  );
};

export default Step2Identity;
