import { GoogleGenAI, Type } from "@google/genai";
import { UserData, IdentityData, CareerPath, Experience } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const statementSchema = {
  type: Type.OBJECT,
  properties: {
    statement: {
      type: Type.STRING,
      description: "A concise, powerful Personal Statement (2-3 sentences) that summarises the user's professional value, skills, and offerings based on their input. This should be written in the first person and have an engaging and professional tone."
    }
  },
  required: ['statement']
};

const archipelagoPathSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The job title of the suggested career path." },
        skillMatchPercentage: { type: Type.INTEGER, description: "An estimated percentage (0-100) of how well the user's current skills align with this role's requirements." },
        industry: { type: Type.STRING, description: "The industry this role typically belongs to (e.g., Technology, Healthcare, Education)." },
        marketDemand: { type: Type.STRING, description: "The current job market demand in the UK for this role. Use one of the following labels: 'High', 'Growing', 'Medium', 'Stable', 'Low'." },
        relevanceTags: {
            type: Type.ARRAY,
            items: { 
                type: Type.OBJECT,
                properties: {
                    tag: { type: Type.STRING, description: "The keyword from the user's profile." },
                    source: { type: Type.STRING, description: "The category of the tag. Must be one of: 'experience', 'skill', 'interest', or 'education'." }
                },
                required: ['tag', 'source']
            },
            description: "A list of keywords from the user's profile that make this career path a relevant suggestion."
        },
    },
    required: ['title', 'skillMatchPercentage', 'industry', 'marketDemand', 'relevanceTags']
};


const careerProfileSchema = {
    type: Type.OBJECT,
    properties: {
        identity: {
            type: Type.OBJECT,
            properties: {
                statement: {
                    type: Type.STRING,
                    description: "A concise, powerful Career Identity Statement (2-3 sentences) that summarises the user's professional value, skills, and offerings based on their input."
                },
                transferableSkills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of 5-7 key transferable skills identified from the user's experience."
                }
            },
            required: ['statement', 'transferableSkills']
        },
        paths: {
            type: Type.ARRAY,
            items: archipelagoPathSchema
        }
    },
    required: ['identity', 'paths']
};

const careerDetailSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING, description: "A brief, 2-sentence description of the role and why it's a good fit for the user." },
        requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 5-7 top skills required for this role." },
        salaryRange: { type: Type.STRING, description: "A typical UK-based salary range for this role, e.g., '£40,000 - £60,000 per year'." },
        marketDemand: { type: Type.STRING, description: "The current job market demand in the UK for this role. Use one of the following labels: 'High', 'Growing', 'Medium', 'Stable', 'Low'." },
        certifications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 1-3 common or required certifications for this role in the UK. If none are typically required, provide an empty array." },
        experienceNeeded: { type: Type.STRING, description: "The typical years of experience needed for this role, e.g., '0-2 years', '3-5 years', '5+ years'." }
    },
    required: ['title', 'description', 'requiredSkills', 'salaryRange', 'marketDemand', 'certifications', 'experienceNeeded']
};


const tasksSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
    description: "A list of 5 common tasks or responsibilities for the given job roles and industries."
};

const skillsSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
    description: "A list of 15 to 20 common soft and hard skills for the given job roles and industries."
};

const interestsSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
    description: "A list of 15 to 20 professional interests, values, work environment preferences, or related career fields/industries."
};

export const generateProfessionalStatement = async (userData: UserData): Promise<string> => {
    const experiencesString = userData.experiences
      .map(exp => `Role: ${exp.role} in Industry: "${exp.industry}". Key tasks included: ${exp.tasks}.`)
      .join('\n');
  
    const prompt = `
      Act as an expert career coach specialising in CV writing for the UK job market.
      Your task is to craft a short, impactful personal statement based on the user's professional profile.
      Keep the statement to 2-3 powerful sentences, written in the first person. Avoid clichés.
      User's Profile:
      - Professional Experience Summary: ${experiencesString}
      - Stated Skills: ${userData.skills}
      - Interests/Values: ${userData.interests}
      ${userData.education && userData.education.length > 0 ? `- Education: ${userData.education.join(', ')}` : ''}
      Provide the output in the specified JSON format.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: statementSchema,
          temperature: 0.6,
        },
      });
  
      const result: { statement: string } = JSON.parse(response.text);
      return result.statement;
    } catch (error) {
      console.error("Error generating professional statement:", error);
      return "Unable to generate a statement at this time. Please check your inputs and try again.";
    }
};

export const generateCareerProfile = async (userData: UserData): Promise<{ identity: IdentityData, paths: CareerPath[] }> => {
  const experiencesString = userData.experiences
    .map(exp => `Role: ${exp.role} in Industry: "${exp.industry}". Key tasks included: ${exp.tasks}.`)
    .join('\n');

  const prompt = `
    Act as an expert career strategist for the UK job market. Your task is to generate a comprehensive career profile based on the user's input.
    
    The profile must include:
    1.  **A Career Identity Statement:** A short, impactful "elevator pitch" (2-3 sentences) summarising the user's professional value.
    2.  **A list of 5-7 key transferable skills.**
    3.  **A list of 15 to 20 diverse but relevant career paths.**

    When generating career paths, prioritise information for the United Kingdom.

    **CRITICAL INSTRUCTIONS FOR GENERATING CAREER PATHS - FOLLOW THESE RULES EXACTLY:**

    1.  **Analyse User Intent First:** Before generating paths, analyse the user's profile holistically. Determine if the user is looking for a career change.
        - **Look for Divergence:** If the user's 'Interests/Values' and 'Stated Skills' point in a different direction from their 'Experiences', this is a strong signal for a career change.
        - **Prioritise Aspirational Goals:** When a divergence is detected, give significantly MORE WEIGHT to 'Interests' and 'Skills' to generate aspirational paths. Give LESS WEIGHT to 'Experience'. For example, if experience is in 'Accounting' but interests are in 'Graphic Design' and 'Creative Writing', the majority of suggestions should be in creative fields, not finance.
    
    2.  **Generate a Balanced Portfolio of Paths:**
        - **Aspirational Paths (High Priority):** Generate a significant number of paths based on their stated **interests** and values. These paths might be a complete departure from their previous experience.
        - **Skill-Based Pivot Paths:** Generate paths that leverage their specific **skills** in new industries that align with their interests. These are "bridge" careers.
        - **Direct Evolution Paths (Lower Priority if Divergence exists):** Generate a smaller number of paths that are a direct evolution of their **experience**, but only if they don't strongly contradict the user's stated interests.
        - **Education-Based Paths:** If education is provided and relevant, generate some paths based on their field of study.

    3.  **Enforce Strict and Logical Tagging (EXTREMELY IMPORTANT):** The accuracy of the \`relevanceTags\` is paramount for the application's filtering to work.
        - **DO NOT CROSS-CONTAMINATE TAGS.** A career path's \`source\` tag must be the DIRECT and PRIMARY reason for its suggestion.
        - **Rule for 'experience' source:** Only apply this tag if the suggested career is a direct continuation or close relative of a role listed in their 'Experiences'. For example, if the user was an 'Accountant', the path 'Financial Controller' can have an 'experience' tag.
        - **Rule for 'interest' source:** Only apply this tag if the career path DIRECTLY relates to a stated interest. For example, if an interest is 'Environmental Conservation', the path 'Sustainability Consultant' can have an 'interest' tag.
        - **Rule for 'skill' source:** Only apply this tag if a specific skill is the key enabler for the career pivot. For example, if the skill is 'Python' and the interest is 'Biology', the path 'Bioinformatics Scientist' can have a 'skill' tag ('Python') and an 'interest' tag ('Biology').
        - **DO NOT** give a path like 'Accountant' an 'interest' tag just because the user has interests. The tag must be logically connected to the path itself.

    User's Profile:
    - Experiences: ${experiencesString}
    - Stated Skills: ${userData.skills}
    - Interests/Values: ${userData.interests}
    ${userData.education && userData.education.length > 0 ? `- Education: ${userData.education.join(', ')}` : ''}

    For each career path, provide ONLY the data required by the schema: title, skillMatchPercentage, industry, marketDemand (using labels: 'High', 'Growing', 'Medium', 'Stable', 'Low'), and relevanceTags.
    Provide the entire output as a single JSON object that adheres to the provided schema.
  `;

   const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: careerProfileSchema,
      temperature: 0.8,
    },
  });

  const profile: { identity: IdentityData, paths: CareerPath[] } = JSON.parse(response.text);
  
  return profile;
};

export const getCareerPathDetails = async (basePath: CareerPath, userData: UserData): Promise<CareerPath> => {
    const experiencesString = userData.experiences
        .map(exp => `Role: ${exp.role} in Industry: "${exp.industry}".`)
        .join('\n');

    const prompt = `
        Act as an expert career strategist for the UK job market. I need detailed information for the career path: "${basePath.title}" in the "${basePath.industry}" industry.
        
        Analyse this role in the context of the following user profile:
        - Experiences: ${experiencesString}
        - Stated Skills: ${userData.skills}
        - Interests/Values: ${userData.interests}
        ${userData.education && userData.education.length > 0 ? `- Education: ${userData.education.join(', ')}` : ''}

        Provide the following details for the "${basePath.title}" role, ensuring all information is relevant to the UK market:
        - description: A brief, 2-sentence description of the role and why it's a good fit for the user.
        - requiredSkills: A list of 5-7 top skills required for this role.
        - salaryRange: A typical UK-based salary range (e.g., '£40,000 - £60,000 per year').
        - marketDemand: The current job market demand in the UK. Use one of the labels: 'High', 'Growing', 'Medium', 'Stable', 'Low'.
        - certifications: A list of 1-3 common certifications. If none are typical, provide an empty array.
        - experienceNeeded: The typical years of experience required (e.g., '2-4 years').
        
        Return the result as a single JSON object matching the provided schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: careerDetailSchema,
                temperature: 0.5,
            },
        });

        const details = JSON.parse(response.text);
        return { ...basePath, ...details };

    } catch (error) {
        console.error(`Error fetching details for ${basePath.title}:`, error);
        // Return the base path with a placeholder error description
        return {
            ...basePath,
            description: "Sorry, we couldn't fetch the full details for this career right now. Please try again later.",
            requiredSkills: [],
            salaryRange: "N/A",
            certifications: [],
            experienceNeeded: "N/A",
        };
    }
};


export const generateTasksForRole = async (experiences: Experience[], existingSuggestions: string[] = []): Promise<string[]> => {
  const experiencesString = experiences
    .map(exp => `Role: ${exp.role} in Industry: "${exp.industry || 'N/A'}".`)
    .join('\n');
  
  const prompt = `
    Based on the following professional experiences:
    ${experiencesString}

    Generate a concise list of 5 common tasks or responsibilities. Synthesise information from all provided roles to create a comprehensive list.
    Prioritise information relevant to the UK job market.
    Keep each task concise (under 10 words).
    ${existingSuggestions.length > 0 ? `The user has already seen these tasks: ${existingSuggestions.join(', ')}. Please generate a list of NEW and DIFFERENT tasks that are also relevant.` : ''}
    Provide the output as a JSON array of strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: tasksSchema,
        temperature: 0.4,
      },
    });

    const tasks: string[] = JSON.parse(response.text);
    return tasks;
  } catch (error) {
    console.error("Error generating tasks:", error);
    return [
        'General Administration', 'Team Collaboration', 'Project Planning',
        'Client Management', 'Data Analysis', 'Problem Solving'
    ];
  }
};

export const generateSkillsForRole = async (experiences: Experience[], existingSuggestions: string[] = []): Promise<string[]> => {
  const experiencesString = experiences
    .map(exp => `Role: ${exp.role} in Industry: "${exp.industry || 'N/A'}".`)
    .join('\n');

  const prompt = `
    Based on the following professional experiences:
    ${experiencesString}

    Generate a list of 15 to 20 common skills, mixing soft and hard skills. Synthesise from all roles to create a comprehensive list.
    Prioritise information relevant to the UK job market.
    Keep each skill concise (1-2 words).
    ${existingSuggestions.length > 0 ? `The user has already seen these skills: ${existingSuggestions.join(', ')}. Please generate NEW and DIFFERENT skills that are also relevant.` : ''}
    Provide the output as a JSON array of strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: skillsSchema,
        temperature: 0.5,
      },
    });

    const skills: string[] = JSON.parse(response.text);
    return skills;
  } catch (error) {
    console.error("Error generating skills:", error);
    return [
        'Communication', 'Teamwork', 'Problem Solving', 'Leadership', 
        'Data Analysis', 'Project Management', 'Adaptability', 'Creativity',
        'Technical Proficiency', 'Customer Service', 'Time Management', 'Critical Thinking'
    ];
  }
};

export const generateSkillsForEducation = async (level: string, subject: string): Promise<string[]> => {
    const prompt = `
      Based on the education level of "${level}" with a subject area in "${subject}", generate a list of 10 to 12 common skills, mixing soft and hard skills, that a person would likely acquire.
      Prioritise skills valued in the UK job market.
      Keep each skill concise (1-2 words).
      Provide the output as a JSON array of strings.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: skillsSchema, // reuse existing schema
          temperature: 0.4,
        },
      });
      const skills: string[] = JSON.parse(response.text);
      return skills;
    } catch (error) {
      console.error("Error generating skills for education:", error);
      return [ // fallback
          'Research', 'Critical Thinking', 'Analysis', 'Writing',
          'Presentation Skills', 'Time Management', 'Collaboration',
          'Problem Solving', 'Data Interpretation', 'Communication'
      ];
    }
  };

export const generateInterests = async (experiences: Experience[], existingSuggestions: string[] = []): Promise<string[]> => {
  const experiencesString = experiences
    .map(exp => `Role: ${exp.role} in Industry: "${exp.industry || 'N/A'}".`)
    .join('\n');

  const prompt = `
    Based on the following professional experiences:
    ${experiencesString}

    Generate a list of 15 to 20 items. This list should include a diverse mix of: potential career fields, different fields, related industries, professional interests, or work environment preferences.
    Synthesise information from all roles to provide diverse and insightful suggestions.
    Prioritise information relevant to the UK job market.
    Keep each item concise (1-2 words). Examples: 'Sustainable Technology', 'Mentoring others', 'Data-driven decisions', 'FinTech Sector'.
    ${existingSuggestions.length > 0 ? `The user has already seen these items: ${existingSuggestions.join(', ')}. Please generate NEW and DIFFERENT items that are also relevant.` : ''}
    Provide the output as a JSON array of strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: interestsSchema,
        temperature: 0.8,
      },
    });

    const interests: string[] = JSON.parse(response.text);
    return interests;
  } catch (error) {
    console.error("Error generating interests:", error);
    return [
        'Continuous Learning', 'Team Collaboration', 'Innovation', 'Work-life Balance',
        'Customer Satisfaction', 'Problem Solving', 'Leadership', 'Efficiency',
        'Data-Driven Decisions', 'Creative Thinking', 'Mentoring Others', 'Autonomy',
        'Social Impact', 'Fast-Paced Environment', 'Strategic Planning'
    ];
  }
};

export const generateLearningPlan = async (skill: string): Promise<string> => {
    const prompt = `
      Create a concise 1-month learning plan for a beginner looking to gain proficiency in "${skill}".
      The plan should be actionable and easy to follow.
      Structure the response in Markdown format.
      Include the following sections:
      - **Week 1: Foundations**: What are the absolute basics to learn? Suggest 1-2 key resources (e.g., a specific free YouTube playlist, an article, or a documentation page).
      - **Week 2: Core Concepts**: What are the next-level concepts to tackle? Suggest 1-2 resources.
      - **Week 3: Practical Application**: How can I apply this knowledge? Suggest a small, specific project idea.
      - **Week 4: Advanced Topics & Project**: What's a more advanced topic to explore, and how can I build on my project?
      
      Keep the descriptions brief and focused on action.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.5,
        },
      });
      return response.text;
    } catch (error) {
      console.error(`Error generating learning plan for ${skill}:`, error);
      return "Unable to generate a learning plan at this time. Please try again later.";
    }
};
