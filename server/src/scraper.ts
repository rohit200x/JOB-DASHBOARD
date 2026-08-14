import { Job } from './types.js';
import { initDatabase, insertJob, getAllJobs } from './database.js';

const BOARD_TOKENS = ['gitlab', 'ashbyhq', 'coda', 'figma', 'notion', 'discord', 'stripe', 'cloudflare', 'watershed', 'verkada'];
const API_BASE = 'https://boards-api.greenhouse.io/v1/boards';
const MAX_JOBS = 15;

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  departments: { name: string }[];
  absolute_url: string;
  updated_at: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

function normalizeJob(ghJob: GreenhouseJob, boardToken: string): Job {
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

async function fetchBoardJobs(boardToken: string): Promise<Job[]> {
  const url = `${API_BASE}/${boardToken}/jobs`;
  console.log(`  Fetching jobs from ${boardToken}...`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.log(`  [WARN] Board ${boardToken}: HTTP ${response.status}`);
      return [];
    }
    const data: GreenhouseResponse = await response.json();
    if (!data.jobs || data.jobs.length === 0) {
      console.log(`  [WARN] Board ${boardToken}: No jobs found`);
      return [];
    }
    // Shuffle jobs to get different ones on each scrape
    const shuffledJobs = data.jobs.sort(() => 0.5 - Math.random());
    const jobs = shuffledJobs.slice(0, 5).map(j => normalizeJob(j, boardToken));
    console.log(`  [OK] Board ${boardToken}: Found ${data.jobs.length} jobs, taking ${jobs.length}`);
    return jobs;
  } catch (error: any) {
    console.log(`  [FAIL] Board ${boardToken}: ${error.message}`);
    return [];
  }
}

export async function scrapeJobs(): Promise<Job[]> {
  console.log('\nStarting Greenhouse job scraping...');
  console.log(`  Checking ${BOARD_TOKENS.length} boards...\n`);

  let allJobs: Job[] = [];
  const shuffledTokens = [...BOARD_TOKENS].sort(() => 0.5 - Math.random());

  for (const token of shuffledTokens) {
    if (allJobs.length >= MAX_JOBS) break;
    const jobs = await fetchBoardJobs(token);
    allJobs = [...allJobs, ...jobs];
  }

  allJobs = deduplicateJobs(allJobs).slice(0, MAX_JOBS);
  console.log(`\nTotal unique jobs collected: ${allJobs.length}`);
  return allJobs;
}

export async function scrapeAndStore(): Promise<{ jobs: Job[]; count: number }> {
  await initDatabase();
  const jobs = await scrapeJobs();

  for (const job of jobs) {
    insertJob(job);
  }

  const storedJobs = getAllJobs();
  console.log(`Stored ${storedJobs.length} jobs in database\n`);
  return { jobs: storedJobs, count: storedJobs.length };
}

// Run as standalone script
if (process.argv[1]?.includes('scraper')) {
  scrapeAndStore()
    .then(result => {
      console.log(`Done! ${result.count} jobs in database.`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Scrape failed:', err);
      process.exit(1);
    });
}
