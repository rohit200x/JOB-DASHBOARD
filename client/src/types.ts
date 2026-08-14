export interface Job {
  id: string;
  title: string;
  location: string;
  department: string;
  url: string;
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

export interface JobStats {
  total: number;
  not_applied: number;
  in_progress: number;
  form_filled: number;
  review_page_reached: number;
  screenshot_captured: number;
  failed: number;
}

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
}
