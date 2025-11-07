export interface Experience {
  role: string;
  industry: string;
  tasks: string;
}

export interface UserData {
  experiences: Experience[];
  skills: string;
  interests: string;
  education?: string[];
}

export interface IdentityData {
  statement: string;
  transferableSkills: string[];
}

export interface RelevanceTag {
  tag: string;
  source: 'experience' | 'skill' | 'interest' | 'education';
}

export interface CareerPath {
  title: string;
  skillMatchPercentage: number;
  marketDemand: string;
  industry: string;
  relevanceTags: RelevanceTag[];
  description?: string;
  requiredSkills?: string[];
  salaryRange?: string;
  certifications?: string[];
  experienceNeeded?: string;
}