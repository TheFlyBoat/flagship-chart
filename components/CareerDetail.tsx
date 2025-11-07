import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CareerPath, UserData } from '../types';
import { ClipboardIcon, CheckIcon, LoadingSpinner } from './icons';
import { generateLearningPlan } from '../services/geminiService';

interface CareerDetailProps {
  path: CareerPath;
  userSkills: string[];
  userData: UserData;
  onClose: () => void;
  isLoading: boolean;
}

const FILTER_CATEGORIES = {
    'Experience': { color: '#0ea5e9', source: 'experience' }, // sky-500
    'Education': { color: '#8b5cf6', source: 'education' }, // violet-500
    'Skills': { color: '#22c55e', source: 'skill' }, // green-500
    'Interests': { color: '#14b8a6', source: 'interest' }, // teal-500
};

const getNodeColors = (path: CareerPath): string[] => {
    const sourcePriority = ['experience', 'education', 'skill', 'interest'];
    const colors: string[] = [];
    
    for (const source of sourcePriority) {
        if (path.relevanceTags.some(tag => tag.source === source)) {
            const categoryName = Object.keys(FILTER_CATEGORIES).find(
                key => FILTER_CATEGORIES[key as keyof typeof FILTER_CATEGORIES].source === source
            );
            if (categoryName) {
                colors.push(FILTER_CATEGORIES[categoryName as keyof typeof FILTER_CATEGORIES].color);
            }
        }
    }
    
    if (colors.length === 0) {
        return ['#64748b']; // Fallback color (slate-500)
    }
    return colors;
};

const RadarChart: React.FC<{ userSkills: string[], requiredSkills: string[] }> = ({ userSkills, requiredSkills }) => {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!ref.current || requiredSkills.length === 0) return;

        const allSkills = Array.from(new Set(requiredSkills));
        const total = allSkills.length;
        const radius = 80;
        const angleSlice = Math.PI * 2 / total;

        const rScale = d3.scaleLinear().range([0, radius]).domain([0, 1]);

        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();
        
        const g = svg.append("g").attr("transform", `translate(100, 100)`);

        // Circular grid
        g.selectAll(".grid-circle")
          .data(d3.range(1, 2).reverse())
          .enter()
          .append("circle")
          .attr("class", "grid-circle")
          .attr("r", d => radius / 1 * d)
          .style("fill", "#1e293b")
          .style("stroke", "#334155")
          .style("fill-opacity", 0.8);
        
        // Axis labels
        const axis = g.selectAll(".axis")
            .data(allSkills)
            .enter().append("g")
            .attr("class", "axis");

        axis.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (d, i) => rScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y2", (d, i) => rScale(1.1) * Math.sin(angleSlice * i - Math.PI / 2))
            .attr("class", "line")
            .style("stroke", "#334155")
            .style("stroke-width", "1px");

        axis.append("text")
            .attr("class", "legend")
            .style("font-size", "11px")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("x", (d, i) => rScale(1.25) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => rScale(1.25) * Math.sin(angleSlice * i - Math.PI / 2))
            .text(d => d)
            .attr("fill", "#94a3b8");

        const radarLine = d3.lineRadial<number>()
            .curve(d3.curveLinearClosed)
            .radius(d => rScale(d))
            .angle((d, i) => i * angleSlice);

        const requiredData = allSkills.map(skill => requiredSkills.includes(skill) ? 1 : 0);
        g.append("path")
          .datum(requiredData)
          .attr("d", radarLine)
          .style("fill", "#0ea5e9")
          .style("fill-opacity", 0.3)
          .style("stroke", "#0ea5e9")
          .style("stroke-width", 2);

        const userData = allSkills.map(skill => userSkills.includes(skill) ? 1 : 0);
        g.append("path")
          .datum(userData)
          .attr("d", radarLine)
          .style("fill", "#22c55e")
          .style("fill-opacity", 0.5)
          .style("stroke", "#22c55e")
          .style("stroke-width", 2);
        
        g.selectAll(".radar-dot-user")
          .data(userData)
          .enter().append("circle")
          .attr("class", "radar-dot-user")
          .attr("r", 4)
          .attr("cx", (d, i) => rScale(d) * Math.cos(angleSlice * i - Math.PI / 2))
          .attr("cy", (d, i) => rScale(d) * Math.sin(angleSlice * i - Math.PI / 2))
          .style("fill", "#22c55e");

    }, [userSkills, requiredSkills]);

    return <svg ref={ref} width="200" height="200"></svg>;
};


const CareerDetail: React.FC<CareerDetailProps> = ({ path, userSkills, userData, onClose, isLoading }) => {
  const [learningPlan, setLearningPlan] = useState<{ skill: string; content: string; isLoading: boolean } | null>(null);

  const skillGaps = path.requiredSkills ? path.requiredSkills.filter(skill => !userSkills.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase())) : [];
  
  const generateGeminiPrompt = useCallback(() => {
    if (!path || !userData) return '';

    const profileJson = JSON.stringify({
        experiences: userData.experiences.map(exp => ({
            title: exp.role,
            organisation: exp.industry,
            tasks: exp.tasks.split(',').map(t => t.trim()).filter(Boolean),
        })).filter(exp => exp.title),
        education: userData.education || [],
        skills: userSkills.map(skill => ({
            name: skill,
        })),
        interests: userData.interests.split(',').map(i => ({
            interest: i.trim(),
            motivations: [],
        })).filter(i => i.interest),
    }, null, 2);

    const recommendedCareer = `${path.title} - ${path.description}`;

    const prompt = `You are a career coach and an expert at helping people achieve their career goals. Below is a JSON representation of my professional profile, exported from a companion app called Flagship Chart. ${profileJson} And here is a career that I was recommended to look into based on my profile: ${recommendedCareer}. I would like to discuss this further with you. Start with a note about Flagship Chart and how we are continuing the journey I started there. Next, write a short paragraph description of the role. Finally, provide a numbered list of further discussion topics to choose from. The list should be phrased as “here are some things you can ask me”, and topics should satisfy the following criteria: -Written in the first person (i.e., containing “I” and “my”), as if I am asking them to you -Consist of three questions -Contain a mixture of inquiries about the role itself (e.g., typical day-to-day) and inquiries that seek to understand the role in relation to my profile Topics should NOT contain the following -Open-ended reflections (e.g., “What interests me about this role?”) -Solicitations of opinions (e.g., “Do you think I am a good fit for this role?””) Invite me to type the number of the topic (use the word “type”) that interests me in order to continue the conversation in that direction; also inform me that I am free to provide my own topic if I would like. Whenever applicable, subsequent responses should end with a similar numbered list of further discussion topics to choose from (and invitation to dictate my own topic if desired). Your tone should be neutral and matter-of-factly. Do not label the components of the output as I have described them here; integrate everything into a cohesive result. And always keep it concise and skimmable!`;

    return prompt;
  }, [path, userData, userSkills]);
  
  const handleLearnHow = async (skill: string) => {
    if (learningPlan && learningPlan.skill === skill && !learningPlan.isLoading) {
      setLearningPlan(null);
      return;
    }

    setLearningPlan({ skill, content: '', isLoading: true });
    try {
      const planContent = await generateLearningPlan(skill);
      setLearningPlan({ skill, content: planContent, isLoading: false });
    } catch (error) {
      console.error("Failed to generate learning plan:", error);
      setLearningPlan({ skill, content: "Sorry, we couldn't generate a learning plan right now. Please try again later.", isLoading: false });
    }
  };
  
  const handleAskGemini = () => {
    const prompt = generateGeminiPrompt();
    const url = `https://gemini.google.com/gem/career-guide?prompt=${encodeURIComponent(prompt)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFindJobs = () => {
    const query = encodeURIComponent(`${path.title} jobs UK`);
    const url = `https://www.google.com/search?q=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  if (!path) return null;

  const colors = getNodeColors(path);
  const gradientStyle = colors.length > 1 
      ? { backgroundImage: `linear-gradient(to right, ${colors.join(', ')})` }
      : { backgroundColor: colors[0] };

  return (
    <div className="w-full max-w-3xl mx-auto text-left bg-slate-800/50 backdrop-blur-sm p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-700 animate-in fade-in zoom-in-95">
       <div className="flex justify-between items-start mb-8">
            <div>
                 <h3 className="text-3xl font-extrabold text-slate-100 tracking-tight sm:text-4xl">{path.title}</h3>
                 <span className="mt-2 inline-block text-sm font-medium bg-sky-900/70 text-sky-300 px-2 py-0.5 rounded">{path.industry}</span>
            </div>
            <button onClick={onClose} className="text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors duration-200 ease-in-out flex items-center gap-1 shrink-0 ml-4">
              <span className="text-lg">&larr;</span> Back<span className="hidden sm:inline"> to Chart</span>
            </button>
       </div>
      
      <div className="space-y-8">
        <div>
          <h4 className="text-lg font-bold text-slate-200">Role Description</h4>
          <p className="mt-1 text-slate-400">{path.description || 'Fetching details...'}</p>
        </div>

        { (isLoading || path.salaryRange) &&
        <div className="border-t border-slate-700 pt-8">
            <h4 className="text-lg font-bold text-slate-200 mb-4">Role Details</h4>
            { isLoading && !path.salaryRange ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="bg-slate-700/50 h-12 rounded-md animate-pulse"></div>
                    <div className="bg-slate-700/50 h-12 rounded-md animate-pulse"></div>
                    <div className="bg-slate-700/50 h-12 rounded-md animate-pulse"></div>
                    <div className="bg-slate-700/50 h-12 rounded-md animate-pulse"></div>
                 </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Salary Range (UK)</h5>
                        <p className="mt-1 text-lg font-bold text-slate-100">{path.salaryRange}</p>
                    </div>
                    <div>
                        <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Market Demand (UK)</h5>
                        <p className="mt-1 text-lg font-bold text-slate-100">{path.marketDemand}</p>
                    </div>
                    <div>
                        <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Typical Experience</h5>
                        <p className="mt-1 text-lg font-bold text-slate-100">{path.experienceNeeded}</p>
                    </div>
                    <div>
                        <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Certifications & Education</h5>
                        <div className="mt-1 text-slate-400">
                            {path.certifications && path.certifications.length > 0 ? (
                                <ul className="space-y-1">
                                    {path.certifications.map(cert => 
                                        <li key={cert} className="flex items-start">
                                            <svg className="w-4 h-4 mr-2 mt-1 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            <span>{cert}</span>
                                        </li>
                                    )}
                                </ul>
                            ) : (
                                <p>None typically required.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
        }
        
        <div className="border-t border-slate-700 pt-8">
          <h4 id="skill-alignment-label" className="text-lg font-bold text-slate-200">Your Skill Alignment</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mt-4">
             <div className="md:col-span-1 flex flex-col items-center">
                {path.requiredSkills && path.requiredSkills.length > 0 ? (
                    <RadarChart userSkills={userSkills} requiredSkills={path.requiredSkills} />
                ) : <div className="w-[200px] h-[200px] flex items-center justify-center text-slate-500">Loading chart...</div>}
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs text-slate-400">Your Skills</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                        <span className="text-xs text-slate-400">Required</span>
                    </div>
                </div>
             </div>
             <div className="md:col-span-2">
                <div className="w-full bg-slate-700 rounded-full h-5 overflow-hidden" role="progressbar" aria-valuenow={path.skillMatchPercentage} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-5 rounded-full transition-all duration-700 ease-in-out" style={{ width: `${path.skillMatchPercentage}%`, ...gradientStyle }}></div>
                </div>
                <p className="text-right text-sm font-medium text-slate-300 mt-1">{path.skillMatchPercentage}% Match</p>
                {skillGaps.length > 0 && (
                  <div className="mt-4">
                    <h6 className="text-md font-bold text-slate-200">Growth Areas</h6>
                    <p className="text-sm text-slate-400 mb-3">Focus on these to become a stronger candidate.</p>
                    <ul className="space-y-2">
                      {skillGaps.map(skill => (
                        <li key={skill} className="flex items-center justify-between bg-rose-900/50 p-3 rounded-lg">
                          <span className="font-medium text-rose-300">{skill}</span>
                          <button onClick={() => handleLearnHow(skill)} disabled={learningPlan?.isLoading && learningPlan.skill === skill} className="px-3 py-1 text-xs font-bold text-white bg-rose-500 rounded-full hover:bg-rose-600 transition-colors duration-200 ease-in-out disabled:bg-rose-800">
                            {learningPlan?.isLoading && learningPlan.skill === skill ? '...' : 'Learn How'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
             </div>
          </div>
        </div>

        {learningPlan && (
            <div className="border-t border-slate-700 pt-8 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h5 className="text-lg font-bold text-slate-200">1-Month Learning Plan: {learningPlan.skill}</h5>
                    <button onClick={() => setLearningPlan(null)} className="text-2xl font-bold text-slate-500 hover:text-slate-300">&times;</button>
                </div>
                {learningPlan.isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <LoadingSpinner className="h-8 w-8 text-sky-400" />
                    </div>
                ) : (
                    <div className="prose prose-sm prose-invert max-w-none bg-slate-900/70 p-4 rounded-lg" style={{ whiteSpace: 'pre-wrap', fontFamily: 'sans-serif', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        {learningPlan.content}
                    </div>
                )}
            </div>
        )}

        <div className="border-t border-slate-700 pt-8">
          <h4 className="text-xl font-bold text-slate-200">Take the Next Step</h4>
          <div className="mt-4 space-y-4">
              <button onClick={handleFindJobs} className="w-full px-4 py-2 bg-sky-500 text-white font-semibold rounded-md hover:bg-sky-600 transition-colors duration-300 ease-in-out">
                  Find "{path.title}" Jobs in the UK
              </button>
              <div className="bg-slate-900/70 p-4 rounded-md border border-slate-700">
                  <div className="flex items-center justify-between">
                      <div>
                          <h5 className="font-bold text-slate-200">Continue with Gemini</h5>
                          <p className="text-sm text-slate-400 mt-1">Jump to Gemini's Career Guide to explore this role further, draft CVs, and prepare for interviews.</p>
                      </div>
                      <button onClick={handleAskGemini} className="ml-4 px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors duration-300 ease-in-out whitespace-nowrap">
                          Ask Gemini
                      </button>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerDetail;
