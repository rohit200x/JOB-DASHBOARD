import { describe, it, expect } from 'vitest';
import { Job } from '../src/types.js';

function normalizeJob(ghJob: any, boardToken: string): Job {
  return {
    id: `${boardToken}-${ghJob.id}`,
    title: ghJob.title,
    location: ghJob.location?.name || 'Not specified',
    department: ghJob.departments?.[0]?.name || 'General',
    url: ghJob.absolute_url,
    company: boardToken.charAt(0).toUpperCase() + boardToken.slice(1),
    description: `${ghJob.title} position at ${boardToken.charAt(0).toUpperCase() + boardToken.slice(1)}. Apply to join the team and help build the future.`,
    source: `Greenhouse (${boardToken})`,
    created_at: ghJob.updated_at || new Date().toISOString(),
    status: 'not_applied',
    failure_reason: null,
    screenshot_path: null,
    applied_at: null,
  };
}

function deduplicateJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    if (seen.has(job.url)) return false;
    seen.add(job.url);
    return true;
  });
}

describe('Job Scraper', () => {
  it('should normalize a Greenhouse job', () => {
    const ghJob = {
      id: 12345,
      title: 'Software Engineer',
      location: { name: 'San Francisco, CA' },
      departments: [{ name: 'Engineering' }],
      absolute_url: 'https://boards.greenhouse.io/test/jobs/12345',
      updated_at: '2024-01-01T00:00:00Z',
    };
    const job = normalizeJob(ghJob, 'testcompany');
    expect(job.id).toBe('testcompany-12345');
    expect(job.title).toBe('Software Engineer');
    expect(job.location).toBe('San Francisco, CA');
    expect(job.department).toBe('Engineering');
    expect(job.company).toBe('Testcompany');
    expect(job.status).toBe('not_applied');
  });

  it('should handle missing location', () => {
    const ghJob = { id: 1, title: 'Test', location: null, departments: [], absolute_url: 'https://example.com/1' };
    const job = normalizeJob(ghJob, 'test');
    expect(job.location).toBe('Not specified');
  });

  it('should handle missing department', () => {
    const ghJob = { id: 1, title: 'Test', location: { name: 'NYC' }, departments: [], absolute_url: 'https://example.com/1' };
    const job = normalizeJob(ghJob, 'test');
    expect(job.department).toBe('General');
  });

  it('should deduplicate jobs by URL', () => {
    const jobs: Job[] = [
      { id: '1', title: 'A', location: '', department: '', url: 'https://example.com/1', company: 'X', description: '', source: '', created_at: '', status: 'not_applied', failure_reason: null, screenshot_path: null, applied_at: null },
      { id: '2', title: 'B', location: '', department: '', url: 'https://example.com/1', company: 'Y', description: '', source: '', created_at: '', status: 'not_applied', failure_reason: null, screenshot_path: null, applied_at: null },
      { id: '3', title: 'C', location: '', department: '', url: 'https://example.com/2', company: 'Z', description: '', source: '', created_at: '', status: 'not_applied', failure_reason: null, screenshot_path: null, applied_at: null },
    ];
    const deduped = deduplicateJobs(jobs);
    expect(deduped).toHaveLength(2);
    expect(deduped[0].id).toBe('1');
    expect(deduped[1].id).toBe('3');
  });
});
