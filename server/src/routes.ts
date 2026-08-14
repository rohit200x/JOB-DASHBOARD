import { Router, Request, Response } from 'express';
import { getAllJobs, getJobById, updateJobStatus, searchJobs, resetJobStatus, getJobStats } from './database.js';
import { scrapeJobs } from './scraper.js';
import { insertJob } from './database.js';
import { GreenhouseAutomation } from './automation.js';
import type { StatusCallback } from './automation.js';
import { loadCandidateProfile, saveCandidateProfile, validateProfile } from './candidate.js';
import multer from 'multer';
import { join } from 'path';
import { existsSync } from 'fs';

const router = Router();

// SSE clients for real-time updates
const sseClients: Set<Response> = new Set();

function broadcastStatus(data: { jobId: string; status: string; failureReason?: string | null; screenshotPath?: string | null }) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

const statusCallback: StatusCallback = (jobId, status, failureReason = null, screenshotPath = null) => {
  updateJobStatus(jobId, status, failureReason, screenshotPath);
  broadcastStatus({ jobId, status, failureReason, screenshotPath });
};

// SSE endpoint - must be registered before :id routes
router.get('/jobs/status-stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  sseClients.add(res);

  // Send keepalive every 15 seconds
  const keepalive = setInterval(() => {
    try { res.write(': keepalive\n\n'); } catch { clearInterval(keepalive); }
  }, 15000);

  req.on('close', () => {
    sseClients.delete(res);
    clearInterval(keepalive);
  });
});

// POST /api/jobs/apply-all - Apply to all unapplied jobs (must be before :id routes)
router.post('/jobs/apply-all', (req: Request, res: Response) => {
  const jobs = getAllJobs();
  const unapplied = jobs.filter(j => j.status === 'not_applied');

  if (unapplied.length === 0) {
    return res.json({ message: 'No unapplied jobs', count: 0 });
  }

  res.json({ message: 'Apply to All started', count: unapplied.length });

  // Run in background
  (async () => {
    try {
      const automation = new GreenhouseAutomation();
      await automation.applyToAll(jobs, statusCallback);
    } catch (error: any) {
      console.error('Apply to All failed:', error.message);
    }
  })();
});

// GET /api/jobs - List all jobs with optional search/filter
router.get('/jobs', (req: Request, res: Response) => {
  const { search, status, company } = req.query;

  if (search || status || company) {
    const jobs = searchJobs(
      (search as string) || '',
      { status: status as string, company: company as string }
    );
    return res.json(jobs);
  }

  res.json(getAllJobs());
});

// GET /api/jobs/:id - Get single job
router.get('/jobs/:id', (req: Request, res: Response) => {
  const job = getJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// POST /api/jobs/:id/apply - Apply to single job
router.post('/jobs/:id/apply', async (req: Request, res: Response) => {
  const job = getJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  if (job.status !== 'not_applied' && job.status !== 'failed') {
    return res.status(400).json({ error: `Job status is '${job.status}', cannot apply` });
  }

  res.json({ message: 'Application automation started', jobId: job.id });

  // Run automation in background
  (async () => {
    try {
      const automation = new GreenhouseAutomation();
      await automation.applyToJob(job, statusCallback);
    } catch (error: any) {
      console.error(`Apply failed for ${job.id}:`, error.message);
      statusCallback(job.id, 'failed', error.message);
    }
  })();
});

// POST /api/jobs/:id/reset - Reset job status
router.post('/jobs/:id/reset', (req: Request, res: Response) => {
  const job = getJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  resetJobStatus(req.params.id);
  broadcastStatus({ jobId: req.params.id, status: 'not_applied' });
  res.json({ message: 'Job status reset', jobId: req.params.id });
});

// GET /api/jobs/:id/screenshot - Serve screenshot
router.get('/jobs/:id/screenshot', (req: Request, res: Response) => {
  const job = getJobById(req.params.id);
  if (!job || !job.screenshot_path) {
    return res.status(404).json({ error: 'Screenshot not found' });
  }
  const screenshotFile = join(process.cwd(), 'screenshots', job.screenshot_path);
  if (!existsSync(screenshotFile)) {
    return res.status(404).json({ error: 'Screenshot file not found' });
  }
  res.sendFile(screenshotFile);
});

// GET /api/stats - Get job statistics
router.get('/stats', (req: Request, res: Response) => {
  res.json(getJobStats());
});

// POST /api/scrape - Trigger scraping
router.post('/scrape', async (req: Request, res: Response) => {
  try {
    const jobs = await scrapeJobs();
    for (const job of jobs) {
      insertJob(job);
    }
    const storedJobs = getAllJobs();
    res.json({ message: 'Scraping complete', count: storedJobs.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Scraping failed', message: error.message });
  }
});

// GET /api/candidate - Get candidate profile
router.get('/candidate', (req: Request, res: Response) => {
  try {
    const profile = loadCandidateProfile();
    const { resumePath, ...safeProfile } = profile;
    res.json(safeProfile);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load candidate profile', message: error.message });
  }
});

// PUT /api/candidate - Update candidate profile
router.put('/candidate', (req: Request, res: Response) => {
  try {
    const currentProfile = loadCandidateProfile();
    const newProfile = { ...currentProfile, ...req.body };
    const validation = validateProfile(newProfile);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }
    saveCandidateProfile(newProfile);
    res.json({ message: 'Profile updated successfully', profile: newProfile });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update candidate profile', message: error.message });
  }
});

// Configure multer for PDF uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, join(process.cwd(), 'candidate'));
    },
    filename: (req, file, cb) => {
      cb(null, 'resume.pdf'); // Always overwrite the same file
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// POST /api/candidate/resume - Upload resume
router.post('/candidate/resume', upload.single('resume'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ message: 'Resume uploaded successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to upload resume', message: error.message });
  }
});

// GET /api/health - Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
