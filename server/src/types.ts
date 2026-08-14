export interface Job {
  id: string;
  title: string;
  location: string;
  department: string;
  url: string;  // Direct Greenhouse application URL
  company: string;
  description: string;
  source: string;
  created_at: string;
  status: JobStatus;
  failure_reason: string | null;
  screenshot_path: string | null;
  applied_at: string | null;
}

export type JobStatus = 
  | 'not_applied'
  | 'in_progress'
  | 'form_filled'
  | 'review_page_reached'
  | 'screenshot_captured'
  | 'failed';

export interface CandidateProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentCompany: string;
  currentTitle: string;
  linkedinUrl: string;
  websiteUrl: string;
  location: string;
  howDidYouHear: string;
  yearsOfExperience: string;
  salaryExpectation: string;
  startDate: string;
  workAuthorization: string;
  gender: string;
  race: string;
  veteranStatus: string;
  disabilityStatus: string;
  education: {
    school: string;
    degree: string;
    fieldOfStudy: string;
    gpa: string;
    startDate: string;
    endDate: string;
  };
  resumePath: string;
  coverLetter: string;
}

export interface AutomationResult {
  jobId: string;
  status: JobStatus;
  screenshotPath: string | null;
  failureReason: string | null;
}

export interface ScrapeResult {
  jobs: Job[];
  source: string;
  scrapedAt: string;
}
