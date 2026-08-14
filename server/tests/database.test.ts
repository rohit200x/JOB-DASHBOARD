import { describe, it, expect, beforeEach } from 'vitest';
import { Job } from '../src/types.js';
import { createTestDatabase, insertJob, getAllJobs, getJobById, updateJobStatus, searchJobs, resetJobStatus, getJobStats } from '../src/database.js';

const mockJob: Job = {
  id: 'test-123',
  title: 'Software Engineer',
  location: 'San Francisco, CA',
  department: 'Engineering',
  url: 'https://boards.greenhouse.io/test/jobs/123',
  company: 'TestCo',
  description: 'Test Description',
  source: 'Greenhouse (test)',
  created_at: new Date().toISOString(),
  status: 'not_applied',
  failure_reason: null,
  screenshot_path: null,
  applied_at: null,
};

describe('Database', () => {
  beforeEach(async () => {
    await createTestDatabase();
  });

  it('should insert and retrieve a job', () => {
    insertJob(mockJob);
    const jobs = getAllJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe('Software Engineer');
  });

  it('should prevent duplicate URLs', () => {
    insertJob(mockJob);
    insertJob({ ...mockJob, id: 'test-456' });
    const jobs = getAllJobs();
    expect(jobs).toHaveLength(1);
  });

  it('should get job by id', () => {
    insertJob(mockJob);
    const job = getJobById('test-123');
    expect(job).toBeDefined();
    expect(job!.title).toBe('Software Engineer');
  });

  it('should update job status', () => {
    insertJob(mockJob);
    updateJobStatus('test-123', 'in_progress');
    const job = getJobById('test-123');
    expect(job!.status).toBe('in_progress');
  });

  it('should search jobs by title', () => {
    insertJob(mockJob);
    insertJob({ ...mockJob, id: 'test-456', title: 'Product Manager', url: 'https://boards.greenhouse.io/test/jobs/456' });
    const results = searchJobs('Software');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Software Engineer');
  });

  it('should reset job status', () => {
    insertJob(mockJob);
    updateJobStatus('test-123', 'failed', 'test error');
    resetJobStatus('test-123');
    const job = getJobById('test-123');
    expect(job!.status).toBe('not_applied');
    expect(job!.failure_reason).toBeNull();
  });

  it('should return job stats', () => {
    insertJob(mockJob);
    insertJob({ ...mockJob, id: 'test-456', url: 'https://example.com/2', status: 'failed', failure_reason: 'test' });
    const stats = getJobStats();
    expect(stats['not_applied']).toBe(1);
    expect(stats['failed']).toBe(1);
  });
});
