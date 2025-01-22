export interface CVExperience {
    company: string;
    position: string;
    period: string;
    responsibilities: string[];
  }
  
  export interface ParsedCV {
    firstName: string;
    objective: string;
    skills: {
      [category: string]: string;
    };
    experience: {
      company: string;
      position: string;
      period: string;
      responsibilities: string[];
    }[];
    education: {
      institution: string;
      qualification: string;
      completionDate: string;
    }[];
    formattingNotes: string[];
    originalNames?: string[];
    piiRemoved?: string[];
    recruiterDetails?: string;
    sectionTitles?: {
      summary?: string;
      skills?: string;
      experience?: string;
      education?: string;
      recruiterDetails?: string;
    };
  }
  
  export interface CVProcessingError {
    message: string;
    code: string;
  }
  
  export interface ProcessedCVResponse {
    success: boolean;
    data?: ParsedCV;
    error?: CVProcessingError;
  }