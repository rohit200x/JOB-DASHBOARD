import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { Job, JobStatus } from './types.js';

const DB_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DB_DIR, 'jobs.db');

let db: SqlJsDatabase;
let isTestMode = false;

export async function initDatabase(): Promise<void> {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT,
      department TEXT,
      url TEXT NOT NULL UNIQUE,
      company TEXT NOT NULL,
      description TEXT,
      source TEXT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      failure_reason TEXT,
      screenshot_path TEXT,
      applied_at TEXT
    )
  `);
  saveDb();
}

function saveDb(): void {
  if (db && !isTestMode) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
}

export function insertJob(job: Job): void {
  try {
    db.run(
      `INSERT INTO jobs (id, title, location, department, url, company, description, source, created_at, status, failure_reason, screenshot_path, applied_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(url) DO NOTHING`,
      [job.id, job.title, job.location, job.department, job.url, job.company, job.description, job.source, job.created_at, job.status, job.failure_reason, job.screenshot_path, job.applied_at]
    );
    saveDb();
  } catch (error) {
    console.error('Error inserting job:', error);
  }
}

function rowToJob(columns: string[], values: any[]): Job {
  const obj: any = {};
  columns.forEach((col, i) => {
    obj[col] = values[i];
  });
  return obj as Job;
}

function queryJobs(sql: string, params: any[] = []): Job[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const jobs: Job[] = [];
  while (stmt.step()) {
    const values = stmt.get();
    const columns = stmt.getColumnNames();
    jobs.push(rowToJob(columns, values));
  }
  stmt.free();
  return jobs;
}

export function getAllJobs(): Job[] {
  return queryJobs('SELECT * FROM jobs ORDER BY created_at DESC');
}

export function getJobById(id: string): Job | undefined {
  const jobs = queryJobs('SELECT * FROM jobs WHERE id = ?', [id]);
  return jobs[0];
}

export function updateJobStatus(id: string, status: JobStatus, failureReason: string | null = null, screenshotPath: string | null = null): void {
  const appliedAt = (status === 'screenshot_captured' || status === 'review_page_reached') ? new Date().toISOString() : null;
  db.run(
    `UPDATE jobs 
     SET status = ?, failure_reason = ?, screenshot_path = COALESCE(?, screenshot_path), applied_at = COALESCE(?, applied_at)
     WHERE id = ?`,
    [status, failureReason, screenshotPath, appliedAt, id]
  );
  saveDb();
}

export function searchJobs(query: string, filters: { status?: string; company?: string } = {}): Job[] {
  let sql = 'SELECT * FROM jobs WHERE (title LIKE ? OR location LIKE ? OR department LIKE ? OR company LIKE ?)';
  const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];

  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.company) {
    sql += ' AND company = ?';
    params.push(filters.company);
  }

  sql += ' ORDER BY created_at DESC';
  return queryJobs(sql, params);
}

export function resetJobStatus(id: string): void {
  db.run(
    `UPDATE jobs SET status = 'not_applied', failure_reason = NULL, screenshot_path = NULL, applied_at = NULL WHERE id = ?`,
    [id]
  );
  saveDb();
}

export function getJobStats(): Record<string, number> {
  const result: Record<string, number> = {};
  const stmt = db.prepare('SELECT status, COUNT(*) as count FROM jobs GROUP BY status');
  while (stmt.step()) {
    const values = stmt.get();
    result[values[0] as string] = values[1] as number;
  }
  stmt.free();
  return result;
}

// For testing - create in-memory database
export async function createTestDatabase(): Promise<void> {
  isTestMode = true;
  const SQL = await initSqlJs();
  db = new SQL.Database();
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT,
      department TEXT,
      url TEXT NOT NULL UNIQUE,
      company TEXT NOT NULL,
      description TEXT,
      source TEXT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      failure_reason TEXT,
      screenshot_path TEXT,
      applied_at TEXT
    )
  `);
}
