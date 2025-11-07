import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserData, Experience } from '../types';
import { LoadingSpinner, PlusIcon, RefreshIcon, ArrowUpIcon, CompassRoseLogo } from './icons';
import { generateTasksForRole, generateSkillsForRole, generateInterests, generateProfessionalStatement } from '../services/geminiService';

interface Step1FormProps {
  onSubmit: (data: UserData) => void;
  onStepChange: (update: number | ((prev: number) => number)) => void;
  currentStepIndex: number;
  initialData?: UserData | null;
  journeyStepLabels: string[];
  totalSteps: number;
}

const formSteps = [
  { name: 'role' as const, question: 'Current or previous role:' },
  { name: 'industry' as const, question: 'What industry or organisation was that in?' },
  { name: 'tasks' as const, question: "Select all the tasks you performed in this role." },
  { name: 'skills' as const, question: 'Select at least 3 skills that apply to you.' },
  { name: 'interests' as const, question: 'Career, industry or field that interests you.' },
  { name: 'education' as const, question: 'What is your highest level of education?' },
  { name: 'review' as const, question: 'Review your profile.' },
];

const exampleRoles = [
  'Product Manager',
  'UX Designer',
  'Data Scientist',
  'Marketing Specialist',
  'Software Engineer',
];

const exampleSubjects = [
  'Computer Science',
  'Advertising',
  'Mathematics',
  'Graphic Design',
  'Business',
];

const educationLevels = [
    "High School diploma", "GCSE", "Associate's degree", "Bachelor's degree", 
    "Master's degree", "Doctorate", "Professional certificate", "Technical certificate"
];

const Step1Form: React.FC<Step1FormProps> = ({ onSubmit, onStepChange, currentStepIndex, initialData, journeyStepLabels, totalSteps }) => {
  const [experiences, setExperiences] = useState<Experience[]>(
    initialData?.experiences && initialData.experiences.length > 0
      ? initialData.experiences
      : [{ role: '', industry: '', tasks: '' }]
  );
  const [skills, setSkills] = useState(initialData?.skills || '');
  const [interests, setInterests] = useState(initialData?.interests || '');
  const [education, setEducation] = useState<string[]>(initialData?.education || []);
  const [professionalStatement, setProfessionalStatement] = useState('');
  const [animationDirection, setAnimationDirection] = useState<'next' | 'back'>('next');

  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [generatedSkills, setGeneratedSkills] = useState<string[]>([]);
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [generatedInterests, setGeneratedInterests] = useState<string[]>([]);
  const [isGeneratingInterests, setIsGeneratingInterests] = useState(false);
  const [isGeneratingStatement, setIsGeneratingStatement] = useState(false);
  
  const [customTaskInput, setCustomTaskInput] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customInterestInput, setCustomInterestInput] = useState('');
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState(exampleRoles[0]);
  const [animatedSubjectPlaceholder, setAnimatedSubjectPlaceholder] = useState(exampleSubjects[0]);
  const [showTasksSummary, setShowTasksSummary] = useState(false);
  const [showSkillsSummary, setShowSkillsSummary] = useState(false);
  const [showInterestsSummary, setShowInterestsSummary] = useState(false);

  // State for sub-forms (replacing modals)
  const [mode, setMode] = useState<'form' | 'addExperience'>('form');
  const [subFormStep, setSubFormStep] = useState(0);

  // State for adding a new experience
  const [newExperience, setNewExperience] = useState<Experience>({ role: '', industry: '', tasks: '' });
  const [generatedSubFormTasks, setGeneratedSubFormTasks] = useState<string[]>([]);
  const [isGeneratingSubFormTasks, setIsGeneratingSubFormTasks] = useState(false);
  const [customSubFormTaskInput, setCustomSubFormTaskInput] = useState('');
  
  // State for education step
  const [educationLevel, setEducationLevel] = useState('');
  const [educationCustomLevel, setEducationCustomLevel] = useState('');
  const [educationSubject, setEducationSubject] = useState('');

  useEffect(() => {
    const roleIntervalId = setInterval(() => {
      setAnimatedPlaceholder(prev => {
          const currentIndex = exampleRoles.indexOf(prev);
          return exampleRoles[(currentIndex + 1) % exampleRoles.length];
      });
    }, 1500);

    const subjectIntervalId = setInterval(() => {
      setAnimatedSubjectPlaceholder(prev => {
          const currentIndex = exampleSubjects.indexOf(prev);
          return exampleSubjects[(currentIndex + 1) % exampleSubjects.length];
      });
    }, 1500);

    return () => {
      clearInterval(roleIntervalId);
      clearInterval(subjectIntervalId);
    };
  }, []);

  useEffect(() => {
    if (initialData?.education && initialData.education.length > 0) {
        const firstEducation = initialData.education[0];
        const parts = firstEducation.split(' in ');
        const level = parts[0];
        const subject = parts.length > 1 ? parts.slice(1).join(' in ') : '';

        if (educationLevels.includes(level)) {
            setEducationLevel(level);
        } else if (level) {
            setEducationLevel('custom');
            setEducationCustomLevel(level);
        }
        setEducationSubject(subject);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const fetchStepData = async () => {
      const relevantExperiences = experiences.filter(exp => exp.role);
      if (relevantExperiences.length === 0 || mode !== 'form') return;

      if (currentStepIndex === 2 && generatedTasks.length === 0) {
          setIsGeneratingTasks(true);
          const tasks = await generateTasksForRole(relevantExperiences);
          setGeneratedTasks(tasks);
          setIsGeneratingTasks(false);
      }
      if (currentStepIndex === 3 && generatedSkills.length === 0) {
          setIsGeneratingSkills(true);
          const skillsData = await generateSkillsForRole(relevantExperiences);
          setGeneratedSkills(skillsData);
          setIsGeneratingSkills(false);
      }
      if (currentStepIndex === 4 && generatedInterests.length === 0) {
          setIsGeneratingInterests(true);
          const interestsData = await generateInterests(relevantExperiences);
          setGeneratedInterests(interestsData);
          setIsGeneratingInterests(false);
      }
  };

  const isReviewStep = currentStepIndex === 6;
  const stringifiedExperiences = useMemo(() => JSON.stringify(experiences), [experiences]);
  const stringifiedEducation = useMemo(() => JSON.stringify(education), [education]);
  
  useEffect(() => {
    const regenerate = async () => {
      const userDataForStatement: UserData = {
        experiences: experiences.filter(exp => exp.role),
        skills,
        interests,
        education,
      };
      
      const hasData = userDataForStatement.experiences.length > 0 || userDataForStatement.skills || userDataForStatement.interests || (userDataForStatement.education && userDataForStatement.education.length > 0);
      
      if (isReviewStep && hasData) {
        setIsGeneratingStatement(true);
        const statement = await generateProfessionalStatement(userDataForStatement);
        setProfessionalStatement(statement);
        setIsGeneratingStatement(false);
      }
    };
  
    regenerate();
  }, [isReviewStep, stringifiedExperiences, skills, interests, stringifiedEducation]);
  
  const fetchSubFormData = useCallback(async () => {
    if (mode === 'addExperience' && subFormStep === 2 && newExperience.role && generatedSubFormTasks.length === 0) {
      setIsGeneratingSubFormTasks(true);
      const tasks = await generateTasksForRole([newExperience]);
      setGeneratedSubFormTasks(tasks);
      setIsGeneratingSubFormTasks(false);
    }
  }, [mode, subFormStep, newExperience, generatedSubFormTasks]);

  useEffect(() => {
    if (mode === 'form') {
      fetchStepData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, mode, experiences]);

  useEffect(() => {
    if (mode !== 'form') {
      fetchSubFormData();
    }
  }, [mode, subFormStep, fetchSubFormData]);


  const handleRegenerateStatement = async () => {
    setIsGeneratingStatement(true);
    const statement = await generateProfessionalStatement({ experiences, skills, interests, education });
    setProfessionalStatement(statement);
    setIsGeneratingStatement(false);
  };

  const handleRegenerate = async () => {
    const relevantExperiences = experiences.filter(exp => exp.role);
    if (relevantExperiences.length === 0) return;
  
    if (currentStepIndex === 2) {
        setIsGeneratingTasks(true);
        const tasks = await generateTasksForRole(relevantExperiences, generatedTasks);
        setGeneratedTasks(prev => [...new Set([...prev, ...tasks])]);
        setIsGeneratingTasks(false);
    }
    if (currentStepIndex === 3) {
        setIsGeneratingSkills(true);
        const skillsData = await generateSkillsForRole(relevantExperiences, generatedSkills);
        setGeneratedSkills(prev => [...new Set([...prev, ...skillsData])]);
        setIsGeneratingSkills(false);
    }
    if (currentStepIndex === 4) {
        setIsGeneratingInterests(true);
        const interestsData = await generateInterests(relevantExperiences, generatedInterests);
        setGeneratedInterests(prev => [...new Set([...prev, ...interestsData])]);
        setIsGeneratingInterests(false);
    }
    if (currentStepIndex === 6) {
      await handleRegenerateStatement();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newExperiences = [...experiences];
    newExperiences[0] = { ...newExperiences[0], [name]: value };
    setExperiences(newExperiences);
  };
  
  const handleTaskSelect = (task: string) => {
    const newExperiences = [...experiences];
    const currentTasks = newExperiences[0].tasks ? newExperiences[0].tasks.split(', ').filter(Boolean) : [];
    const taskExists = currentTasks.includes(task);
    const newTasks = taskExists ? currentTasks.filter(t => t !== task) : [...currentTasks, task];
    newExperiences[0] = {...newExperiences[0], tasks: newTasks.join(', ')};
    setExperiences(newExperiences);
  };

  const handleSkillSelect = (skill: string) => {
    const currentSkills = skills ? skills.split(', ').filter(Boolean) : [];
    const newSkills = currentSkills.includes(skill) ? currentSkills.filter(s => s !== skill) : [...currentSkills, skill];
    setSkills(newSkills.join(', '));
  };
  
  const handleInterestSelect = (interest: string) => {
      const currentInterests = interests ? interests.split(', ').filter(Boolean) : [];
      const newInterests = currentInterests.includes(interest) ? currentInterests.filter(i => i !== interest) : [...currentInterests, interest];
      setInterests(newInterests.join(', '));
  };
  
  const handleRemoveExperience = (indexToRemove: number) => {
    setExperiences(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveEducation = (indexToRemove: number) => {
    setEducation(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const currentSkills = skills.split(', ').filter(Boolean);
    setSkills(currentSkills.filter(s => s !== skillToRemove).join(', '));
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    const currentInterests = interests.split(', ').filter(Boolean);
    setInterests(currentInterests.filter(i => i !== interestToRemove).join(', '));
  };

  const handleCustomKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    inputValue: string,
    onAdd: (value: string) => void,
    onClearInput: () => void
  ) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const trimmedValue = inputValue.trim();
        if (trimmedValue) {
            onAdd(trimmedValue);
            onClearInput();
        }
    }
  };
  
  const handleBack = () => {
    setAnimationDirection('back');
    if (mode === 'form') {
        if (currentStepIndex > 0) {
            onStepChange(prev => prev - 1)
        }
    } else {
        if (subFormStep > 0) {
            setSubFormStep(s => s - 1);
        } else {
            setMode('form');
        }
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setAnimationDirection('next');
    if (mode === 'addExperience') {
      if (subFormStep < 2) {
        setSubFormStep(s => s + 1);
      } else {
        if (newExperience.role) {
          setExperiences(prev => [...prev.filter(e => e.role), newExperience]);
           // Clear existing suggestions to force regeneration based on all experiences
          setGeneratedTasks([]);
          setGeneratedSkills([]);
          setGeneratedInterests([]);
        }
        setAnimationDirection('back'); // Transitioning back to form
        setMode('form');
      }
    } else {
      if (currentStepIndex === 5) { // The new education step
          const finalLevel = educationLevel === 'custom' ? educationCustomLevel.trim() : educationLevel;
          if (finalLevel) {
              const educationString = educationSubject.trim() ? `${finalLevel} in ${educationSubject.trim()}` : finalLevel;
              setEducation(prev => [...prev, educationString]);
              // Clear form for next time
              setEducationLevel('');
              setEducationCustomLevel('');
              setEducationSubject('');
          }
      }

      if (currentStepIndex < formSteps.length - 1) {
        onStepChange(prev => prev + 1);
      } else {
        const finalData: UserData = {
          experiences: experiences.filter(exp => exp.role),
          skills,
          interests,
          education,
        };
        onSubmit(finalData);
      }
    }
  };

  const isFormValid = () => {
    if (mode === 'addExperience') {
        return newExperience.role.trim() !== '';
    }
    
    const currentStepName = formSteps[currentStepIndex].name;
    const firstExperience = experiences[0] || { role: '', industry: '', tasks: ''};
    if (currentStepName === 'role') return firstExperience.role.trim() !== '';
    if (currentStepName === 'industry') return true;
    if (currentStepName === 'tasks') return true;
    if (currentStepName === 'skills') return skills.split(', ').filter(Boolean).length >= 3;
    if (currentStepName === 'interests') return interests.trim() !== '';
    if (currentStepName === 'education') {
        return true;
    }
    if (currentStepName === 'review') return true;
    return false;
  };

  const renderStepContent = () => {
    const currentStep = formSteps[currentStepIndex];
    const firstExperience = experiences[0] || { role: '', industry: '', tasks: ''};

    switch (currentStepIndex) {
      case 0: // Role
        return (
          <>
            <label htmlFor={currentStep.name} className="text-3xl font-semibold text-slate-400">
              {currentStep.question}
            </label>
            <input
              id={currentStep.name}
              name={currentStep.name}
              value={firstExperience[currentStep.name as keyof Omit<Experience, 'tasks'>]}
              onChange={handleChange}
              placeholder={animatedPlaceholder}
              className="w-full mt-6 bg-transparent text-4xl sm:text-6xl font-bold text-slate-100 placeholder-slate-600 placeholder:font-normal focus:outline-none focus:ring-0 border-0 transition-colors"
              required
              autoFocus
            />
          </>
        );
      case 1: // Industry
        return (
          <>
            <div className="text-4xl sm:text-6xl font-bold text-slate-500">{firstExperience.role}</div>
            <input
              id={currentStep.name}
              name={currentStep.name}
              value={firstExperience[currentStep.name as keyof Omit<Experience, 'tasks'>]}
              onChange={handleChange}
              placeholder="Organisation or Industry"
              className="w-full mt-2 bg-transparent text-4xl sm:text-6xl font-bold text-slate-100 placeholder-slate-600 placeholder:font-normal focus:outline-none focus:ring-0 border-0 transition-colors"
              autoFocus
            />
          </>
        );
      case 2: // Tasks
        const currentTasksArray = firstExperience.tasks.split(', ').filter(Boolean);
        const displayedTasks = [...new Set([...generatedTasks, ...currentTasksArray])];
        const getArticle = (word: string): string => {
            if (!word) return 'a';
            const firstLetter = word.trim()[0].toLowerCase();
            return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a';
        };
        return (
            <div className="w-full">
                <div className="mb-12">
                    <div className="text-4xl sm:text-6xl font-bold text-slate-500">{firstExperience.role}</div>
                    {firstExperience.industry && <div className="text-2xl sm:text-4xl font-semibold text-slate-500 mt-2">{firstExperience.industry}</div>}
                </div>
                <label className="text-2xl sm:text-3xl font-semibold text-slate-400">
                  Select all the tasks you performed as {getArticle(firstExperience.role)} <span className="font-bold text-slate-300">{firstExperience.role}</span>. (optional)
                </label>
                <div className="mt-8 min-h-[150px] flex justify-start">
                    {isGeneratingTasks ? (
                        <div className="flex items-center"><LoadingSpinner className="h-10 w-10 text-sky-400" /><span className="ml-4 text-slate-400">Generating...</span></div>
                    ) : (
                        <div className="flex flex-wrap justify-start items-center gap-4 max-w-2xl">
                            {displayedTasks.map((task) => (
                                <button key={task} type="button" onClick={() => handleTaskSelect(task)}
                                    className={`px-4 py-2 text-base font-medium rounded-full border-2 transition-colors duration-200 ease-in-out ${firstExperience.tasks.includes(task) ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-sky-500 hover:text-sky-300'}`}>
                                    {task}
                                </button>
                            ))}
                            <input
                                type="text"
                                placeholder="Task +"
                                value={customTaskInput}
                                onChange={(e) => setCustomTaskInput(e.target.value)}
                                onKeyDown={(e) => handleCustomKeyDown(e, customTaskInput, handleTaskSelect, () => setCustomTaskInput(''))}
                                className="px-4 py-2 text-base font-medium rounded-full border-2 bg-slate-800 text-slate-300 border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-sky-500 w-40 transition-colors duration-200 ease-in-out hover:border-sky-500"
                            />
                        </div>
                    )}
                </div>
                {!isGeneratingTasks && generatedTasks.length > 0 && (
                    <div className="mt-4 w-full max-w-2xl flex justify-start">
                        <button
                            type="button"
                            onClick={handleRegenerate}
                            disabled={isGeneratingTasks}
                            className="p-2 bg-slate-800 text-slate-300 rounded-lg shadow-sm border border-slate-600 hover:bg-slate-700 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Regenerate tasks"
                        >
                            <RefreshIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        );
      case 3: // Skills
        const currentSkillsArray = skills.split(', ').filter(Boolean);
        const displayedSkills = [...new Set([...generatedSkills, ...currentSkillsArray])];
        const selectedTasks = firstExperience.tasks.split(', ').filter(Boolean);
        return (
            <div className="w-full">
                 <div className="mb-12">
                    <div className="text-4xl sm:text-6xl font-bold text-slate-500">{firstExperience.role}</div>
                    {firstExperience.industry && <div className="text-2xl sm:text-4xl font-semibold text-slate-500 mt-2">{firstExperience.industry}</div>}
                     {selectedTasks.length > 0 && (
                        <div className="relative mt-4 inline-block">
                            <button type="button" onClick={() => setShowTasksSummary(prev => !prev)} className="flex items-center gap-2 px-4 py-2 bg-sky-900/50 text-sky-300 rounded-full text-sm font-medium hover:bg-sky-800/50 transition-colors duration-200 ease-in-out">
                                {selectedTasks.length} {selectedTasks.length === 1 ? 'task' : 'tasks'}
                                <ArrowUpIcon className={`w-4 h-4 transition-transform duration-200 ${showTasksSummary ? '' : 'rotate-180'}`} />
                            </button>
                            {showTasksSummary && (
                                <div className="absolute z-10 mt-2 w-72 bg-slate-800 rounded-lg shadow-xl p-4 border border-slate-700 text-left animate-in fade-in zoom-in-95">
                                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                                        {selectedTasks.map(task => (
                                            <li key={task} className="text-sm text-slate-400 flex items-start">
                                                <span className="text-sky-500 mr-2 mt-1">&#8226;</span>
                                                <span>{task}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <label className="text-2xl sm:text-3xl font-semibold text-slate-400">{currentStep.question}</label>
                <div className="mt-8 min-h-[200px] flex justify-start">
                    {isGeneratingSkills ? (
                        <div className="flex items-center"><LoadingSpinner className="h-10 w-10 text-sky-400" /><span className="ml-4 text-slate-400">Generating...</span></div>
                    ) : (
                        <div className="flex flex-wrap justify-start items-center gap-3 max-w-3xl">
                            {displayedSkills.map((skill) => (
                                <button key={skill} type="button" onClick={() => handleSkillSelect(skill)}
                                    className={`px-4 py-2 text-base font-medium rounded-full border-2 transition-colors duration-200 ease-in-out ${skills.includes(skill) ? 'bg-green-500 text-white border-green-500' : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-green-500 hover:text-green-300'}`}>
                                    {skill}
                                </button>
                            ))}
                            <input
                                type="text"
                                placeholder="Skill +"
                                value={customSkillInput}
                                onChange={(e) => setCustomSkillInput(e.target.value)}
                                onKeyDown={(e) => handleCustomKeyDown(e, customSkillInput, handleSkillSelect, () => setCustomSkillInput(''))}
                                className="px-4 py-2 text-base font-medium rounded-full border-2 bg-slate-800 text-slate-300 border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-green-500 w-40 transition-colors duration-200 ease-in-out hover:border-green-500"
                            />
                        </div>
                    )}
                </div>
                 {!isGeneratingSkills && generatedSkills.length > 0 && (
                    <div className="mt-4 w-full max-w-3xl flex justify-start">
                        <button
                            type="button"
                            onClick={handleRegenerate}
                            disabled={isGeneratingSkills}
                            className="p-2 bg-slate-800 text-slate-300 rounded-lg shadow-sm border border-slate-600 hover:bg-slate-700 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Regenerate skills"
                        >
                            <RefreshIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        );
      case 4: // Interests
        const currentInterestsArray = interests.split(', ').filter(Boolean);
        const displayedInterests = [...new Set([...generatedInterests, ...currentInterestsArray])];
        const selectedTasksForDisplay = firstExperience.tasks.split(', ').filter(Boolean);
        const selectedSkills = skills.split(', ').filter(Boolean);
        return (
            <div className="w-full">
                <div className="mb-12">
                    <div className="text-4xl sm:text-6xl font-bold text-slate-500">{firstExperience.role}</div>
                    {firstExperience.industry && <div className="text-2xl sm:text-4xl font-semibold text-slate-500 mt-2">{firstExperience.industry}</div>}
                    <div className="flex items-center gap-3 mt-4">
                        {selectedTasksForDisplay.length > 0 && (
                            <div className="relative inline-block">
                                <span className="flex items-center gap-2 px-4 py-2 bg-sky-900/50 text-sky-300 rounded-full text-sm font-medium">
                                    {selectedTasksForDisplay.length} {selectedTasksForDisplay.length === 1 ? 'task' : 'tasks'}
                                </span>
                            </div>
                        )}
                        {selectedSkills.length > 0 && (
                            <div className="relative inline-block">
                                <button type="button" onClick={() => setShowSkillsSummary(prev => !prev)} className="flex items-center gap-2 px-4 py-2 bg-green-900/50 text-green-300 rounded-full text-sm font-medium hover:bg-green-800/50 transition-colors duration-200 ease-in-out">
                                    {selectedSkills.length} {selectedSkills.length === 1 ? 'skill' : 'skills'}
                                    <ArrowUpIcon className={`w-4 h-4 transition-transform duration-200 ${showSkillsSummary ? '' : 'rotate-180'}`} />
                                </button>
                                {showSkillsSummary && (
                                    <div className="absolute z-10 mt-2 w-72 bg-slate-800 rounded-lg shadow-xl p-4 border border-slate-700 text-left animate-in fade-in zoom-in-95">
                                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                                            {selectedSkills.map(skill => (
                                                <li key={skill} className="text-sm text-slate-400 flex items-start">
                                                    <span className="text-green-500 mr-2 mt-1">&#8226;</span>
                                                    <span>{skill}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <label className="text-2xl sm:text-3xl font-semibold text-slate-400">{currentStep.question}</label>
                <div className="mt-8 min-h-[200px] flex justify-start">
                    {isGeneratingInterests ? (
                        <div className="flex items-center"><LoadingSpinner className="h-10 w-10 text-sky-400" /><span className="ml-4 text-slate-400">Generating...</span></div>
                    ) : (
                        <div className="flex flex-wrap justify-start items-center gap-3 max-w-3xl">
                            {displayedInterests.map((interest) => (
                                <button key={interest} type="button" onClick={() => handleInterestSelect(interest)}
                                    className={`px-4 py-2 text-base font-medium rounded-full border-2 transition-colors duration-200 ease-in-out ${interests.includes(interest) ? 'bg-teal-500 text-white border-teal-500' : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-teal-500 hover:text-teal-300'}`}>
                                    {interest}
                                </button>
                            ))}
                            <input
                                type="text"
                                placeholder="Interest +"
                                value={customInterestInput}
                                onChange={(e) => setCustomInterestInput(e.target.value)}
                                onKeyDown={(e) => handleCustomKeyDown(e, customInterestInput, handleInterestSelect, () => setCustomInterestInput(''))}
                                className="px-4 py-2 text-base font-medium rounded-full border-2 bg-slate-800 text-slate-300 border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-teal-500 w-40 transition-colors duration-200 ease-in-out hover:border-teal-500"
                            />
                        </div>
                    )}
                </div>
                {!isGeneratingInterests && generatedInterests.length > 0 && (
                    <div className="mt-4 w-full max-w-3xl flex justify-start">
                        <button
                            type="button"
                            onClick={handleRegenerate}
                            disabled={isGeneratingInterests}
                            className="p-2 bg-slate-800 text-slate-300 rounded-lg shadow-sm border border-slate-600 hover:bg-slate-700 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Regenerate interests"
                        >
                            <RefreshIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        );
      case 5: // Education
        const selectedInterests = interests.split(', ').filter(Boolean);
        const selectedSkillsForDisplay = skills.split(', ').filter(Boolean);
        const selectedTasksForDisplay_edu = firstExperience.tasks.split(', ').filter(Boolean);

        return (
            <div className="w-full">
                <div className="mb-12">
                    <div className="text-4xl sm:text-6xl font-bold text-slate-500">{firstExperience.role}</div>
                    {firstExperience.industry && <div className="text-2xl sm:text-4xl font-semibold text-slate-500 mt-2">{firstExperience.industry}</div>}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        {selectedTasksForDisplay_edu.length > 0 && (
                            <div className="relative inline-block">
                                <span className="flex items-center gap-2 px-4 py-2 bg-sky-900/50 text-sky-300 rounded-full text-sm font-medium">
                                    {selectedTasksForDisplay_edu.length} {selectedTasksForDisplay_edu.length === 1 ? 'task' : 'tasks'}
                                </span>
                            </div>
                        )}
                        {selectedSkillsForDisplay.length > 0 && (
                             <div className="relative inline-block">
                                <button type="button" onClick={() => setShowSkillsSummary(prev => !prev)} className="flex items-center gap-2 px-4 py-2 bg-green-900/50 text-green-300 rounded-full text-sm font-medium hover:bg-green-800/50 transition-colors duration-200 ease-in-out">
                                    {selectedSkillsForDisplay.length} {selectedSkillsForDisplay.length === 1 ? 'skill' : 'skills'}
                                     <ArrowUpIcon className={`w-4 h-4 transition-transform duration-200 ${showSkillsSummary ? '' : 'rotate-180'}`} />
                                </button>
                                {showSkillsSummary && (
                                    <div className="absolute z-10 mt-2 w-72 bg-slate-800 rounded-lg shadow-xl p-4 border border-slate-700 text-left animate-in fade-in zoom-in-95">
                                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                                            {selectedSkillsForDisplay.map(skill => (
                                                <li key={skill} className="text-sm text-slate-400 flex items-start">
                                                    <span className="text-green-500 mr-2 mt-1">&#8226;</span>
                                                    <span>{skill}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                        {selectedInterests.length > 0 && (
                             <div className="relative inline-block">
                                <button type="button" onClick={() => setShowInterestsSummary(prev => !prev)} className="flex items-center gap-2 px-4 py-2 bg-teal-900/50 text-teal-300 rounded-full text-sm font-medium hover:bg-teal-800/50 transition-colors duration-200 ease-in-out">
                                    {selectedInterests.length} {selectedInterests.length === 1 ? 'interest' : 'interests'}
                                    <ArrowUpIcon className={`w-4 h-4 transition-transform duration-200 ${showInterestsSummary ? '' : 'rotate-180'}`} />
                                </button>
                                {showInterestsSummary && (
                                    <div className="absolute z-10 mt-2 w-72 bg-slate-800 rounded-lg shadow-xl p-4 border border-slate-700 text-left animate-in fade-in zoom-in-95">
                                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                                            {selectedInterests.map(interest => (
                                                <li key={interest} className="text-sm text-slate-400 flex items-start">
                                                    <span className="text-teal-500 mr-2 mt-1">&#8226;</span>
                                                    <span>{interest}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <label className="text-2xl sm:text-3xl font-semibold text-slate-400">{currentStep.question}</label>
                
                <div className="mt-8 flex flex-wrap justify-start items-center gap-4 max-w-3xl">
                    {educationLevels.map(lvl => (
                        <button key={lvl} type="button" onClick={() => { setEducationLevel(lvl); if (educationLevel !== 'custom') setEducationCustomLevel(''); }}
                            className={`px-5 py-3 text-lg font-medium rounded-full border-2 transition-colors duration-200 ease-in-out ${educationLevel === lvl ? 'bg-violet-500 text-white border-violet-500' : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-violet-500 hover:text-violet-300'}`}>
                            {lvl}
                        </button>
                    ))}
                    <div className="relative">
                        <input type="text" placeholder="Level +" value={educationCustomLevel}
                            onFocus={() => setEducationLevel('custom')}
                            onChange={(e) => { setEducationCustomLevel(e.target.value); setEducationLevel('custom'); }}
                            className={`px-5 py-3 text-lg font-medium rounded-full border-2 bg-slate-800 text-slate-300 border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-violet-500 w-48 transition-colors duration-200 ease-in-out hover:border-violet-500 ${educationLevel === 'custom' ? 'border-violet-500 ring-2 ring-violet-400/50' : ''}`} />
                    </div>
                </div>
                
                <div className="mt-12">
                  <label htmlFor="subject" className="text-2xl sm:text-3xl font-semibold text-slate-400">What was your subject area? (optional)</label>
                  <input id="subject" name="subject" value={educationSubject}
                      onChange={(e) => setEducationSubject(e.target.value)}
                      placeholder={animatedSubjectPlaceholder}
                      className="w-full mt-2 bg-transparent text-4xl sm:text-6xl font-bold text-slate-100 placeholder-slate-600 placeholder:font-normal focus:outline-none focus:ring-0 border-0 transition-colors"
                  />
                </div>
            </div>
        );
      case 6: // Review
        return (
            <div className="w-full max-w-6xl text-left">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">Career Identity</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 mt-8">
                    {/* Left Column: Summary */}
                    <div className="space-y-10">
                        {/* Experiences */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-100 mb-4">Experiences</h3>
                            <div className="flex flex-wrap items-start gap-6">
                                {experiences.filter(exp => exp.role).map((exp, index) => (
                                    <div key={index} className="flex flex-col items-start gap-2">
                                        <span className="relative group inline-flex items-center px-4 py-2 text-lg sm:px-6 sm:py-3 sm:text-2xl font-medium bg-cyan-400 text-cyan-900 rounded-full shadow-md">
                                            {exp.role}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExperience(index)}
                                                className="ml-2 -mr-2 sm:ml-3 sm:-mr-3 w-6 h-6 sm:w-7 sm:h-7 bg-cyan-500 text-white rounded-full flex items-center justify-center hover:bg-cyan-600 transition-colors duration-200 ease-in-out text-xl font-bold"
                                                aria-label={`Remove ${exp.role} experience`}
                                            >
                                                &times;
                                            </button>
                                        </span>
                                        {exp.industry && (
                                            <span className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 text-base sm:text-xl font-medium bg-sky-500 text-white rounded-full shadow-sm">
                                                {exp.industry}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setAnimationDirection('next');
                                        setNewExperience({ role: '', industry: '', tasks: '' });
                                        setGeneratedSubFormTasks([]);
                                        setSubFormStep(0);
                                        setMode('addExperience');
                                    }} 
                                    className="self-center px-4 py-2 text-lg sm:px-6 sm:py-3 sm:text-2xl bg-slate-700 text-slate-200 font-medium rounded-full shadow-sm border border-slate-600 hover:bg-slate-600 transition-colors duration-200 ease-in-out flex items-center gap-2"
                                >
                                    Experience +
                                </button>
                            </div>
                        </div>

                        {/* Education */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-100 mb-4">Education</h3>
                            <div className="flex flex-wrap items-start gap-6">
                                {education.map((edu, index) => {
                                    const parts = edu.split(' in ');
                                    const level = parts[0];
                                    const subject = parts.length > 1 ? parts.slice(1).join(' in ') : null;

                                    return (
                                        <div key={index} className="flex flex-col items-start gap-2">
                                            <span className="relative group inline-flex items-center px-4 py-2 text-lg sm:px-6 sm:py-3 sm:text-2xl font-medium bg-violet-500 text-white rounded-full shadow-md">
                                                {level}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEducation(index)}
                                                    className="ml-2 -mr-2 sm:ml-3 sm:-mr-3 w-6 h-6 sm:w-7 sm:h-7 bg-violet-600 text-white rounded-full flex items-center justify-center hover:bg-violet-700 transition-colors duration-200 ease-in-out text-xl font-bold"
                                                    aria-label={`Remove ${edu}`}
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                            {subject && (
                                                <span className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 text-base sm:text-xl font-medium bg-violet-400 text-violet-900 rounded-full shadow-sm">
                                                    {subject}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEducationLevel('');
                                        setEducationCustomLevel('');
                                        setEducationSubject('');
                                        setAnimationDirection('back');
                                        onStepChange(5);
                                    }}
                                    className="self-center px-4 py-2 text-lg sm:px-6 sm:py-3 sm:text-2xl bg-slate-700 text-slate-200 font-medium rounded-full shadow-sm border border-slate-600 hover:bg-slate-600 transition-colors duration-200 ease-in-out flex items-center gap-2"
                                >
                                    Education +
                                </button>
                            </div>
                        </div>


                        {/* Skills */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-100 mb-4">Skills</h3>
                            <div className="flex flex-wrap items-center gap-4">
                                {skills.split(', ').filter(Boolean).map(skill => (
                                    <span key={skill} className="relative group inline-flex items-center px-4 py-2 text-lg sm:px-6 sm:py-3 sm:text-2xl font-medium bg-green-500 text-green-900 rounded-full shadow-md">
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skill)}
                                            className="ml-2 -mr-2 sm:ml-3 sm:-mr-3 w-6 h-6 sm:w-7 sm:h-7 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors duration-200 ease-in-out text-xl font-bold"
                                            aria-label={`Remove ${skill} skill`}
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => onStepChange(3)}
                                    className="px-4 py-2 text-lg sm:px-6 sm:py-3 sm:text-2xl bg-slate-700 text-slate-200 font-medium rounded-full shadow-sm border border-slate-600 hover:bg-slate-600 transition-colors duration-200 ease-in-out flex items-center gap-2"
                                >
                                    Skills +
                                </button>
                            </div>
                        </div>

                        {/* Interests */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-100 mb-4">Interests</h3>
                            <div className="flex flex-wrap items-center gap-4">
                                {interests.split(', ').filter(Boolean).map(interest => (
                                    <span key={interest} className="relative group inline-flex items-center px-4 py-2 text-lg sm:px-6 sm:py-3 sm:text-2xl font-medium bg-teal-500 text-white rounded-full shadow-md">
                                        {interest}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveInterest(interest)}
                                            className="ml-2 -mr-2 sm:ml-3 sm:-mr-3 w-6 h-6 sm:w-7 sm:h-7 bg-teal-600 text-white rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors duration-200 ease-in-out text-xl font-bold"
                                            aria-label={`Remove ${interest} interest`}
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => onStepChange(4)}
                                    className="px-4 py-2 text-lg sm:px-6 sm:py-3 sm:text-2xl bg-slate-700 text-slate-200 font-medium rounded-full shadow-sm border border-slate-600 hover:bg-slate-600 transition-colors duration-200 ease-in-out flex items-center gap-2"
                                >
                                    Interests +
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Column: Statement */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-700 self-start">
                        <h3 className="text-xl font-bold text-slate-100 mb-4">Personal Statement</h3>
                        <div className="min-h-[90px]">
                            {isGeneratingStatement ? (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <LoadingSpinner className="h-8 w-8 text-sky-400" />
                                </div>
                            ) : (
                                <p className="text-slate-300 text-lg leading-relaxed">
                                    {professionalStatement}
                                </p>
                            )}
                        </div>
                        <div className="mt-4">
                            <button
                                type="button" onClick={handleRegenerateStatement} disabled={isGeneratingStatement}
                                className="p-2 text-slate-400 rounded-full hover:bg-slate-700 hover:text-slate-100 transition-colors duration-200 ease-in-out disabled:text-slate-600 disabled:cursor-not-allowed"
                                aria-label="Re-generate statement"
                            >
                                <RefreshIcon className={`w-5 h-5 ${isGeneratingStatement ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  const renderSubFormContent = () => {
    if (mode === 'addExperience') {
        switch (subFormStep) {
            case 0: // Role
                return (
                    <div className="min-h-full flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-24">
                        <div className="w-full max-w-4xl text-left">
                            <label htmlFor="role" className="text-3xl font-semibold text-slate-400">What was the role?</label>
                            <input id="role" name="role" value={newExperience.role}
                                onChange={(e) => setNewExperience(prev => ({ ...prev, role: e.target.value }))}
                                placeholder={animatedPlaceholder}
                                className="w-full mt-6 bg-transparent text-4xl sm:text-6xl font-bold text-slate-100 placeholder-slate-600 placeholder:font-normal focus:outline-none focus:ring-0 border-0 transition-colors"
                                required autoFocus />
                        </div>
                    </div>
                );
            case 1: // Industry
                return (
                    <div className="min-h-full flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-24">
                        <div className="w-full max-w-4xl text-left">
                             <div className="text-4xl sm:text-6xl font-bold text-slate-100">{newExperience.role}</div>
                            <label htmlFor="industry" className="text-3xl font-semibold text-slate-400">What industry was that in? (optional)</label>
                            <input id="industry" name="industry" value={newExperience.industry}
                                onChange={(e) => setNewExperience(prev => ({ ...prev, industry: e.target.value }))}
                                placeholder="Organisation or Industry"
                                className="w-full mt-6 bg-transparent text-4xl sm:text-6xl font-bold text-slate-100 placeholder-slate-600 placeholder:font-normal focus:outline-none focus:ring-0 border-0 transition-colors"
                                autoFocus />
                        </div>
                    </div>
                );
            case 2: // Tasks
                 const currentTasksArray = newExperience.tasks.split(', ').filter(Boolean);
                 const displayedTasks = [...new Set([...generatedSubFormTasks, ...currentTasksArray])];
                 const handleSubFormTaskSelect = (task: string) => {
                    const currentTasks = newExperience.tasks ? newExperience.tasks.split(', ').filter(Boolean) : [];
                    const newTasks = currentTasks.includes(task) ? currentTasks.filter(t => t !== task) : [...currentTasks, task];
                    setNewExperience(prev => ({...prev, tasks: newTasks.join(', ')}));
                 };
                return (
                    <div className="min-h-full flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-24">
                        <div className="w-full max-w-4xl text-left">
                            <label className="text-3xl font-semibold text-slate-400">Select tasks you performed in this role:</label>
                            <div className="mt-8 min-h-[150px] flex justify-start">
                                {isGeneratingSubFormTasks ? (
                                    <div className="flex items-center"><LoadingSpinner className="h-10 w-10 text-sky-400" /><span className="ml-4 text-slate-400">Generating...</span></div>
                                ) : (
                                    <div className="flex flex-wrap justify-start items-center gap-4 max-w-2xl">
                                        {displayedTasks.map(task => (
                                            <button key={task} type="button" onClick={() => handleSubFormTaskSelect(task)}
                                                className={`px-4 py-2 text-base font-medium rounded-full border-2 transition-colors duration-200 ease-in-out ${newExperience.tasks.includes(task) ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-sky-500 hover:text-sky-300'}`}>
                                                {task}
                                            </button>
                                        ))}
                                        <input type="text" placeholder="Task +" value={customSubFormTaskInput}
                                            onChange={(e) => setCustomSubFormTaskInput(e.target.value)}
                                            onKeyDown={(e) => handleCustomKeyDown(e, customSubFormTaskInput, handleSubFormTaskSelect, () => setCustomSubFormTaskInput(''))}
                                            className="px-4 py-2 text-base font-medium rounded-full border-2 bg-slate-800 text-slate-300 border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-sky-500 w-40 transition-colors duration-200 ease-in-out hover:border-sky-500" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
        }
    }
    return null;
  };

  const formId = "step-form";

  const renderFooter = () => {
    let currentIdx = currentStepIndex;
    let total = journeyStepLabels.length - 1; // Exclude explore paths
    let isLast = currentStepIndex === formSteps.length - 1;
    let nextButtonText = isLast ? 'Chart' : 'Next';

    if (mode === 'addExperience') {
        currentIdx = subFormStep;
        total = 3;
        isLast = subFormStep === 2;
        nextButtonText = isLast ? 'Save' : 'Next';
    }
    
    const showBackButton = mode !== 'form' || currentStepIndex > 0;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/50 backdrop-blur-sm border-t border-slate-700 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                <div className="flex-1 flex justify-start">
                    {showBackButton && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-2 sm:px-8 sm:py-3 bg-slate-700 text-slate-200 font-bold text-sm sm:text-base rounded-full shadow-sm hover:bg-slate-600 transition-colors duration-300 ease-in-out"
                        >
                            Back
                        </button>
                    )}
                </div>

                <div className="flex flex-col items-center space-y-1">
                    <div className="flex space-x-2">
                        {Array(total).fill(null).map((_, index) => (
                        <div 
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${index === currentIdx ? 'bg-sky-400' : 'bg-slate-600'}`}
                        />
                        ))}
                    </div>
                </div>
                
                <div className="flex-1 flex justify-end">
                    <button
                        type="submy it"
                        form={formId}
                        disabled={!isFormValid()}
                        className={`px-6 py-2 sm:px-8 sm:py-3 text-white font-bold text-sm sm:text-base rounded-full shadow-md shadow-sky-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transform hover:scale-105 transition-all duration-300 ease-in-out disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100 ${
                            isLast
                                ? "bg-[linear-gradient(120deg,theme(colors.fuchsia.500),theme(colors.indigo.500),theme(colors.sky.400),theme(colors.cyan.400))] hover:opacity-90 focus:ring-cyan-300"
                                : "bg-sky-500 hover:bg-sky-600 focus:ring-sky-400"
                        }`}
                    >
                        {nextButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
  };
  
  const animationKey = mode === 'form' ? `form-${currentStepIndex}` : `${mode}-${subFormStep}`;
  const animationClass = animationDirection === 'next' ? 'animate-slideInFromRight' : 'animate-slideInFromLeft';


  return (
    <div className="flex-grow flex flex-col">
      <main className="flex-grow overflow-y-auto pb-32">
        <form id={formId} onSubmit={handleNext}>
            <div key={animationKey} className={animationClass}>
            {mode === 'form' ? (
                <>
                    {currentStepIndex < formSteps.length -1 ? (
                        <div className="flex flex-col justify-start pt-[20vh] px-4 sm:px-8 md:px-16 lg:px-24">
                            <div className="w-full max-w-4xl text-left">
                                {renderStepContent()}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col px-4 sm:px-8 md:px-16 lg:px-24 justify-start pt-8">
                            {renderStepContent()}
                        </div>
                    )}
                </>
            ) : (
                <div className="min-h-full flex flex-col justify-center">
                    {renderSubFormContent()}
                </div>
            )}
            </div>
        </form>
      </main>
      
      {renderFooter()}
    </div>
  );
};

export default Step1Form;
