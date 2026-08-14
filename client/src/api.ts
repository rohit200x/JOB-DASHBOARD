import axios from 'axios';
import { Job, JobStats, CandidateProfile } from './types';

const API_BASE = 'http://localhost:3001/api';

export const api = {
  getJobs: async (search?: string, status?: string): Promise<Job[]> => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status && status !== 'all') params.set('status', status);
    const res = await axios.get(`${API_BASE}/jobs?${params}`);
    return res.data;
  },
  
  getJob: async (id: string): Promise<Job> => {
    const res = await axios.get(`${API_BASE}/jobs/${id}`);
    return res.data;
  },
  
  applyToJob: async (id: string): Promise<void> => {
    await axios.post(`${API_BASE}/jobs/${id}/apply`);
  },
  
  applyToAll: async (): Promise<{ message: string; count: number }> => {
    const res = await axios.post(`${API_BASE}/jobs/apply-all`);
    return res.data;
  },
  
  resetJob: async (id: string): Promise<void> => {
    await axios.post(`${API_BASE}/jobs/${id}/reset`);
  },
  
  getStats: async (): Promise<JobStats> => {
    const res = await axios.get(`${API_BASE}/stats`);
    return res.data;
  },
  
  triggerScrape: async (): Promise<{ message: string; count: number }> => {
    const res = await axios.post(`${API_BASE}/scrape`);
    return res.data;
  },
  
  getCandidate: async (): Promise<CandidateProfile> => {
    const res = await axios.get(`${API_BASE}/candidate`);
    return res.data;
  },

  updateCandidate: async (profile: Partial<CandidateProfile>): Promise<{ message: string; profile: CandidateProfile }> => {
    const res = await axios.put(`${API_BASE}/candidate`, profile);
    return res.data;
  },

  uploadResume: async (file: File): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('resume', file);
    const res = await axios.post(`${API_BASE}/candidate/resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  
  getScreenshotUrl: (jobId: string): string => {
    return `${API_BASE}/jobs/${jobId}/screenshot`;
  },
  
  getStatusStream: (): EventSource => {
    return new EventSource(`${API_BASE}/jobs/status-stream`);
  },
};
