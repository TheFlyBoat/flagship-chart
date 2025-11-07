import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { IdentityData, CareerPath, UserData } from '../types';
import CareerArchipelago from './CareerArchipelago';
import CareerDetail from './CareerDetail';
import { RefreshIcon, CompassIcon, GridIcon, XIcon, UserIcon } from './icons';
import { getCareerPathDetails } from '../services/geminiService';
import { LoadingSpinner } from './icons';

export const FILTER_CATEGORIES = {
    'Experience': { color: '#0ea5e9', source: 'experience' }, // sky-500
    'Education': { color: '#8b5cf6', source: 'education' }, // violet-500
    'Skills': { color: '#22c55e', source: 'skill' }, // green-500
    'Interests': { color: '#14b8a6', source: 'interest' }, // teal-500
};

interface Step3ExploreProps {
  identityData: IdentityData;
  careerPaths: CareerPath[];
  userData: UserData;
  onBack: () => void;
  onReset: () => void;
  onRegenerate: () => void;
}

export const getNodeColors = (path: CareerPath): { colors: string[], sources: string[] } => {
    const sourcePriority = ['experience', 'education', 'skill', 'interest'];
    const colors: string[] = [];
    const sources: string[] = [];
    
    for (const source of sourcePriority) {
        if (path.relevanceTags.some(tag => tag.source === source)) {
            const categoryName = Object.keys(FILTER_CATEGORIES).find(
                key => FILTER_CATEGORIES[key as keyof typeof FILTER_CATEGORIES].source === source
            );
            if (categoryName) {
                colors.push(FILTER_CATEGORIES[categoryName as keyof typeof FILTER_CATEGORIES].color);
                sources.push(source);
            }
        }
    }
    
    if (colors.length === 0) {
        return { colors: ['#64748b'], sources: [] }; // Fallback color (slate-500)
    }
    return { colors, sources };
};


const SortButton: React.FC<{
  field: 'match' | 'salary' | 'demand';
  sortBy: 'match' | 'salary' | 'demand';
  sortOrder: 'asc' | 'desc';
  onClick: (field: 'match' | 'salary' | 'demand') => void;
  children: React.ReactNode;
}> = ({ field, sortBy, sortOrder, onClick, children }) => {
  const isActive = sortBy === field;
  return (
    <button
      onClick={() => onClick(field)}
      className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-200 ease-in-out ${isActive ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
    >
      {children} {isActive && (sortOrder === 'asc' ? '▲' : '▼')}
    </button>
  );
};

const CareerGrid: React.FC<{ paths: CareerPath[]; onPathSelect: (path: CareerPath) => void; }> = ({ paths, onPathSelect }) => {
  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-y-auto pt-40 sm:pt-28">
      {paths.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paths.map(path => {
            const { colors } = getNodeColors(path);
            const gradientStyle = colors.length > 1 
                ? { backgroundImage: `linear-gradient(to right, ${colors.join(', ')})` }
                : { backgroundColor: colors[0] };
            const textColor = colors[0] || '#64748b';

            return (
                <div key={path.title} onClick={() => onPathSelect(path)}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 p-6 cursor-pointer hover:shadow-sky-500/10 hover:border-sky-500 hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 animate-in fade-in-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-100 truncate" title={path.title}>{path.title}</h3>
                        <p className="text-sm text-slate-400 font-medium">{path.industry}</p>
                    </div>
                    <div>
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm font-semibold text-slate-300">Skill Match</span>
                            <span className="text-lg font-bold" style={{color: textColor}}>{path.skillMatchPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                            <div className="h-2.5 rounded-full" style={{ width: `${path.skillMatchPercentage}%`, ...gradientStyle }}></div>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4 text-sm mt-auto pt-4 border-t border-slate-700">
                        <div>
                            <p className="font-semibold text-slate-400">Demand</p>
                            <p className="font-bold text-slate-200">{path.marketDemand}</p>
                        </div>
                    </div>
                </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl font-semibold text-slate-300">No career islands match the filters.</p>
          <p className="text-slate-400 mt-2">Try selecting more filter categories to broaden your search.</p>
        </div>
      )}
    </div>
  );
};

const IdentityModal: React.FC<{
    onClose: () => void;
    onEdit: () => void;
    identityData: IdentityData;
    userData: UserData;
}> = ({ onClose, onEdit, identityData, userData }) => {
    return (
        <div
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-lg border border-slate-700 m-4 animate-in fade-in zoom-in-95"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-700 p-3 rounded-full">
                                <UserIcon className="w-6 h-6 text-slate-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Your Professional Identity</h2>
                                <p className="text-slate-400">This is the profile used to generate your career chart.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-full transition-colors -mt-2 -mr-2">
                           <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="mt-6 border-t border-slate-700 pt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Statement */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-200 mb-2">Personal Statement</h3>
                            <p className="text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-lg">{identityData.statement}</p>
                        </div>

                        {/* Key Transferable Skills */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-200 mb-3">Key Transferable Skills</h3>
                            <div className="flex flex-wrap gap-3">
                                {identityData.transferableSkills.map(skill => (
                                    <span key={skill} className="px-3 py-1.5 text-sm font-medium bg-green-500 text-green-900 rounded-full">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        {/* Experiences */}
                        {userData.experiences.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-slate-200 mb-3">Experience</h3>
                                <div className="flex flex-col items-start gap-4">
                                    {userData.experiences.map((exp, index) => (
                                        <div key={index} className="flex flex-wrap items-center gap-3">
                                            <span className="px-3 py-1.5 text-sm font-medium bg-cyan-400 text-cyan-900 rounded-full">
                                                {exp.role}
                                            </span>
                                            {exp.industry && (
                                                <span className="px-3 py-1.5 text-sm font-medium bg-sky-500 text-white rounded-full">
                                                    {exp.industry}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {userData.education && userData.education.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-slate-200 mb-3">Education</h3>
                                <div className="flex flex-col items-start gap-4">
                                    {userData.education.map((edu, index) => {
                                        const parts = edu.split(' in ');
                                        const level = parts[0];
                                        const subject = parts.length > 1 ? parts.slice(1).join(' in ') : null;
                                        return (
                                            <div key={index} className="flex flex-wrap items-center gap-3">
                                                <span className="px-3 py-1.5 text-sm font-medium bg-violet-500 text-white rounded-full">
                                                    {level}
                                                </span>
                                                {subject && (
                                                    <span className="px-3 py-1.5 text-sm font-medium bg-violet-400 text-violet-900 rounded-full">
                                                        {subject}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Interests */}
                        {userData.interests && (
                            <div>
                                <h3 className="text-lg font-bold text-slate-200 mb-3">Interests & Values</h3>
                                <div className="flex flex-wrap gap-3">
                                    {userData.interests.split(', ').filter(Boolean).map(interest => (
                                        <span key={interest} className="px-3 py-1.5 text-sm font-medium bg-teal-500 text-white rounded-full">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 border-t border-slate-700 pt-6 flex justify-end">
                        <button onClick={onEdit} className="px-6 py-2 bg-slate-600 text-white font-bold text-base rounded-full shadow-sm hover:bg-slate-500 transition-colors duration-300 ease-in-out">
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const Step3Explore: React.FC<Step3ExploreProps> = ({ identityData, careerPaths, userData, onBack, onReset, onRegenerate }) => {
  const [detailedPath, setDetailedPath] = useState<CareerPath | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'grid'>('chart');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(Object.keys(FILTER_CATEGORIES))
  );
  const [sortBy, setSortBy] = useState<'match' | 'salary' | 'demand'>('match');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode('grid');
    }
  }, []);
  
  useEffect(() => {
    if (detailedPath || isIdentityModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [detailedPath, isIdentityModalOpen]);
  
  const filteredPaths = useMemo(() => {
    if (activeFilters.size === Object.keys(FILTER_CATEGORIES).length) return careerPaths;
    if (activeFilters.size === 0) return [];

    const activeSources = new Set(
      Array.from(activeFilters).map(f => FILTER_CATEGORIES[f as keyof typeof FILTER_CATEGORIES].source)
    );

    return careerPaths.filter(path => 
        path.relevanceTags.some(tag => activeSources.has(tag.source))
    );
  }, [careerPaths, activeFilters]);
    
  const handleSortChange = (field: 'match' | 'salary' | 'demand') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  const demandOrder: { [key: string]: number } = { 
    'high': 5,
    'growing': 4,
    'medium': 3,
    'stable': 3,
    'low': 2,
  };
  
  const sortedAndFilteredPaths = useMemo(() => {
    return [...filteredPaths].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'match') {
        comparison = a.skillMatchPercentage - b.skillMatchPercentage;
      } else if (sortBy === 'demand') {
        const demandA = a.marketDemand.toLowerCase().trim();
        const demandB = b.marketDemand.toLowerCase().trim();
        comparison = (demandOrder[demandA] || 0) - (demandOrder[demandB] || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredPaths, sortBy, sortOrder]);

  const handlePathSelect = useCallback(async (path: CareerPath) => {
    setIsDetailLoading(true);
    setDetailedPath(path); // Show partial data immediately
    const fullDetails = await getCareerPathDetails(path, userData);
    setDetailedPath(fullDetails);
    setIsDetailLoading(false);
  }, [userData]);
  
  const handleDetailClose = useCallback(() => {
    setDetailedPath(null);
  }, []);

  const handleYouNodeClick = useCallback(() => {
    setIsIdentityModalOpen(true);
  }, []);

  const handleIdentityModalClose = useCallback(() => {
    setIsIdentityModalOpen(false);
  }, []);

  const handleEditProfile = useCallback(() => {
    setIsIdentityModalOpen(false);
    onBack();
  }, [onBack]);
  
  const toggleFilter = useCallback((filter: string) => {
    setActiveFilters(prev => {
        const newFilters = new Set(prev);
        if (newFilters.has(filter)) {
            newFilters.delete(filter);
        } else {
            newFilters.add(filter);
        }
        return newFilters;
    });
  }, []);
  
  const backgroundStyle = {
    backgroundColor: 'transparent',
  };

  return (
    <div className="w-full h-full flex flex-col" style={backgroundStyle}>
        <div className="flex-grow relative flex flex-col">
            <div id="tooltip" className="absolute z-30 p-3 bg-slate-800 text-white rounded-lg text-sm shadow-lg pointer-events-none opacity-0 transition-opacity border border-slate-700" style={{ minWidth: '200px', maxWidth: '300px' }}></div>
            
            <div className="absolute top-4 sm:top-6 left-0 right-0 z-20 flex justify-center px-4">
                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-2 sm:px-3 sm:py-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl sm:rounded-full shadow-lg border border-slate-700">
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setViewMode('chart')}
                            className={`p-2 rounded-full transition-colors duration-300 ease-in-out ${viewMode === 'chart' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                            aria-label="Compass View"
                        >
                            <CompassIcon className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-full transition-colors duration-300 ease-in-out ${viewMode === 'grid' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                            aria-label="Grid View"
                        >
                            <GridIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-slate-700 hidden sm:block" />

                    <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-5">
                        {Object.entries(FILTER_CATEGORIES).map(([name, { color }]) => {
                            const isActive = activeFilters.has(name);
                            return (
                                <button 
                                    key={name}
                                    onClick={() => toggleFilter(name)}
                                    className={`flex items-center gap-2 text-left transition-opacity duration-200 ${!isActive ? 'opacity-40 hover:opacity-100' : 'opacity-100'}`}
                                >
                                    <span className="w-4 h-4 rounded-full border-2 border-slate-900" style={{ backgroundColor: color }}></span>
                                    <span className="font-semibold text-slate-300 text-sm">{name}</span>
                                </button>
                            )
                        })}
                    </div>
                    {viewMode === 'grid' && (
                        <>
                            <div className="w-px h-6 bg-slate-700 hidden sm:block" />
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                <span className="text-sm font-medium text-slate-400">Sort by:</span>
                                <SortButton field="match" sortBy={sortBy} sortOrder={sortOrder} onClick={handleSortChange}>Skill Match</SortButton>
                                <SortButton field="demand" sortBy={sortBy} sortOrder={sortOrder} onClick={handleSortChange}>Market Demand</SortButton>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20">
                <button
                    onClick={onBack}
                    className="px-6 py-2 text-sm sm:px-8 sm:py-3 sm:text-base bg-slate-700 text-slate-200 font-bold rounded-full shadow-md hover:bg-slate-600 transition-colors duration-300 ease-in-out"
                >
                    Back
                </button>
            </div>

            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex items-center gap-4">
                 <button 
                    onClick={onRegenerate}
                    className="p-2 sm:p-3 bg-slate-200 text-slate-800 rounded-full shadow-md hover:bg-slate-50 transition-colors duration-300 ease-in-out flex items-center justify-center"
                    aria-label="Regenerate career paths"
                >
                    <RefreshIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button 
                    onClick={onReset}
                    className="px-6 py-2 text-sm sm:px-8 sm:py-3 sm:text-base bg-slate-700 text-slate-200 font-bold rounded-full shadow-md hover:bg-slate-600 transition-colors duration-300 ease-in-out"
                >
                    Start Over
                </button>
            </div>
            
            <div className="flex-grow">
              {viewMode === 'chart' ? (
                <CareerArchipelago careerPaths={sortedAndFilteredPaths} onNodeClick={handlePathSelect} onYouNodeClick={handleYouNodeClick}/>
              ) : (
                <CareerGrid paths={sortedAndFilteredPaths} onPathSelect={handlePathSelect} />
              )}
            </div>
        </div>

        {detailedPath && (
            <div 
                className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in"
                onClick={handleDetailClose}
            >
                <div 
                    className="w-full h-full max-w-4xl" 
                    onClick={e => e.stopPropagation()}
                >
                    {isDetailLoading && !detailedPath.description ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <LoadingSpinner className="h-16 w-16 text-sky-400" />
                            <h2 className="text-2xl font-medium text-slate-300 mt-8">
                                Charting the details of {detailedPath.title}...
                            </h2>
                        </div>
                    ) : (
                        <div className="w-full h-full overflow-y-auto p-4 sm:p-6 md:p-8" key={detailedPath.title}>
                             <CareerDetail 
                                path={detailedPath} 
                                userSkills={identityData.transferableSkills} 
                                userData={userData}
                                onClose={handleDetailClose} 
                                isLoading={isDetailLoading}
                            />
                        </div>
                    )}
                </div>
            </div>
        )}

        {isIdentityModalOpen && (
            <IdentityModal
                onClose={handleIdentityModalClose}
                onEdit={handleEditProfile}
                identityData={identityData}
                userData={userData}
            />
        )}
    </div>
  );
};

export default Step3Explore;