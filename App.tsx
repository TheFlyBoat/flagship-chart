import React, { useState, useCallback } from 'react';
import { UserData, IdentityData, CareerPath } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import Step1Form from './components/Step1Form';
import Step2Identity from './components/Step2Identity';
import Step3Explore from './components/Step3Explore';
import InfoMenu from './components/InfoMenu';
import { FlagshipChartTextLogo } from './components/icons';

enum AppStep {
  Welcome,
  InputForm,
  Identity,
  Explore,
}

const APP_JOURNEY_STEPS = Array(8).fill(null);
const journeyStepLabels = [
  "Your Role",
  "Industry",
  "Tasks",
  "Skills",
  "Interests",
  "Education",
  "Review",
  "Chart",
];

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.Welcome);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [identityData, setIdentityData] = useState<IdentityData | null>(null);
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [progressIndex, setProgressIndex] = useState(0);

  const handleStart = useCallback(() => {
    setCurrentStep(AppStep.InputForm);
  }, []);

  const handleFormSubmit = useCallback((data: UserData) => {
    setUserData(data);
    setCurrentStep(AppStep.Identity);
    setProgressIndex(6); // Move to "Review Profile" before loading
  }, []);

  const handleIdentityGenerated = useCallback((identity: IdentityData, paths: CareerPath[]) => {
    setIdentityData(identity);
    setCareerPaths(paths);
    setCurrentStep(AppStep.Explore);
    setProgressIndex(7); // Move to final "Explore Paths" step
  }, []);
  
  const handleReset = useCallback(() => {
    setUserData(null);
    setIdentityData(null);
    setCareerPaths([]);
    setProgressIndex(0);
    setCurrentStep(AppStep.Welcome);
  }, []);
  
  const handleBack = useCallback(() => {
    if (currentStep === AppStep.Explore) {
        setCurrentStep(AppStep.InputForm);
        setProgressIndex(6); // Go back to review step
    } else if (currentStep === AppStep.InputForm) {
        if (progressIndex > 0) {
            setProgressIndex(prev => prev - 1);
        } else {
            setCurrentStep(AppStep.Welcome);
        }
    }
  }, [currentStep, progressIndex]);

  const handleRegenerate = useCallback(() => {
    if (userData) {
      // Go back to the identity step to trigger regeneration
      setCurrentStep(AppStep.Identity);
    }
  }, [userData]);


  const renderStep = () => {
    switch (currentStep) {
      case AppStep.Welcome:
        return <WelcomeScreen onStart={handleStart} />;
      case AppStep.InputForm:
        return <Step1Form 
            onSubmit={handleFormSubmit} 
            onStepChange={setProgressIndex} 
            currentStepIndex={progressIndex}
            initialData={userData} 
            journeyStepLabels={journeyStepLabels}
            totalSteps={APP_JOURNEY_STEPS.length}
        />;
      case AppStep.Identity:
        if (!userData) {
          setCurrentStep(AppStep.InputForm);
          return null;
        }
        return <Step2Identity userData={userData} onComplete={handleIdentityGenerated} />;
      default:
        return <WelcomeScreen onStart={handleStart} />;
    }
  };

  // For the Explore step, render it standalone to take up the full screen
  if (currentStep === AppStep.Explore) {
    if (!identityData || !userData) {
        setCurrentStep(AppStep.InputForm);
        return null;
    }
    return <Step3Explore 
        identityData={identityData} 
        userData={userData} 
        careerPaths={careerPaths} 
        onBack={handleBack}
        onReset={handleReset}
        onRegenerate={handleRegenerate}
    />;
  }

  return (
    <div className="bg-transparent min-h-screen text-slate-300 font-sans antialiased flex flex-col">
      {currentStep !== AppStep.Welcome && (
        <header className="py-4 sm:py-6 px-6 sm:px-8 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="cursor-pointer" onClick={handleReset}>
                <FlagshipChartTextLogo className="text-3xl" />
            </div>
            <InfoMenu />
          </div>
        </header>
      )}
      <main className="flex-grow flex flex-col">
        <div key={currentStep} className="flex-grow flex flex-col">
          {renderStep()}
        </div>
      </main>
      {currentStep === AppStep.Identity && (
        <footer className="flex-shrink-0 flex justify-center items-center h-16">
            <div className="flex flex-col items-center space-y-2">
                <div className="flex space-x-2">
                {APP_JOURNEY_STEPS.map((_, index) => (
                    <div 
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${index === progressIndex ? 'bg-cyan-400' : 'bg-slate-600'}`}
                    />
                ))}
                </div>
            </div>
        </footer>
      )}
    </div>
  );
};

export default App;
