export interface ResumeWebsite {
  url?: string;
  label?: string;
}

export interface ResumeBasics {
  name?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: ResumeWebsite;
}

export interface ResumeSummary {
  title?: string;
  hidden?: boolean;
  content?: string;
}

export interface ResumeProfile {
  hidden?: boolean;
  network?: string;
  username?: string;
  website?: ResumeWebsite;
}

export interface ResumeExperience {
  hidden?: boolean;
  company?: string;
  position?: string;
  location?: string;
  period?: string;
  website?: ResumeWebsite;
  description?: string;
}

export interface ResumeEducation {
  hidden?: boolean;
  school?: string;
  degree?: string;
  area?: string;
  period?: string;
  description?: string;
  website?: ResumeWebsite;
}

export interface ResumeSkill {
  hidden?: boolean;
  name?: string;
  proficiency?: string;
}

export interface ResumeCertification {
  hidden?: boolean;
  title?: string;
  issuer?: string;
  date?: string;
  description?: string;
  website?: ResumeWebsite;
}

export interface ResumeProject {
  hidden?: boolean;
  name?: string;
  period?: string;
  description?: string;
  website?: ResumeWebsite;
}

export interface ResumeSection<T> {
  title?: string;
  hidden?: boolean;
  items?: T[];
}

export interface ResumeCustomSection {
  title?: string;
  hidden?: boolean;
  content?: string;
}

export interface ResumeDataContent {
  basics?: ResumeBasics;
  summary?: ResumeSummary;
  sections?: {
    profiles?: ResumeSection<ResumeProfile>;
    experience?: ResumeSection<ResumeExperience>;
    education?: ResumeSection<ResumeEducation>;
    skills?: ResumeSection<ResumeSkill>;
    certifications?: ResumeSection<ResumeCertification>;
    projects?: ResumeSection<ResumeProject>;
  };
  customSections?: ResumeCustomSection[];
}

export interface ResumeData {
  data?: ResumeDataContent;
}
