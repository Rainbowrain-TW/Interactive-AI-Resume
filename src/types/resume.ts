export interface ResumePayload {
  data?: ResumeData;
}

export interface ResumeData {
  basics?: Basics;
  summary?: ContentSection;
  sections?: ResumeSections;
  customSections?: CustomSection[];
}

export interface Basics {
  name?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: {
    url?: string;
    label?: string;
  };
}

export interface ContentSection {
  title?: string;
  columns?: number;
  hidden?: boolean;
  content?: string;
}

export interface ResumeSections {
  profiles?: ItemSection<ProfileItem>;
  experience?: ItemSection<ExperienceItem>;
  education?: ItemSection<EducationItem>;
  skills?: ItemSection<SkillItem>;
  certifications?: ItemSection<CertificationItem>;
  projects?: ItemSection<ProjectItem>;
}

export interface CustomSection extends ContentSection {
  id?: string;
}

export interface ItemSection<T> {
  title?: string;
  columns?: number;
  hidden?: boolean;
  items?: T[];
}

export interface ProfileItem {
  hidden?: boolean;
  network?: string;
  username?: string;
  website?: {
    url?: string;
    label?: string;
  };
}

export interface ExperienceItem {
  hidden?: boolean;
  company?: string;
  position?: string;
  location?: string;
  period?: string;
  website?: {
    url?: string;
    label?: string;
  };
  description?: string;
}

export interface EducationItem {
  hidden?: boolean;
  school?: string;
  degree?: string;
  area?: string;
  period?: string;
  description?: string;
}

export interface SkillItem {
  hidden?: boolean;
  name?: string;
  proficiency?: string;
}

export interface CertificationItem {
  hidden?: boolean;
  title?: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface ProjectItem {
  hidden?: boolean;
  name?: string;
  period?: string;
  website?: {
    url?: string;
    label?: string;
  };
  description?: string;
}
