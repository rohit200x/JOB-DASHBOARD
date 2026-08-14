# Greenhouse Application Dashboard — Complete Documentation

---

## 1. Project Overview

The **Greenhouse Application Dashboard** is a full-stack web application that:

1. **Scrapes** 10–15 real job listings from publicly available Greenhouse career pages using the Greenhouse Boards API.
2. **Displays** them in a responsive, dark-themed dashboard built with React and TypeScript.
3. **Automates** the job application process using headless browser automation (Playwright).
4. **Captures screenshots** as evidence that forms were filled — **without ever actually submitting the application**.
5. **Tracks** the lifecycle of every application from "Not Applied" through to "Screenshot Captured" or "Failed."

---

## 2. Technology Stack

| Layer | Technology | Why chosen |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Fast development, strong typing, excellent DX |
| **Backend** | Node.js + Express + TypeScript | Lightweight, same language as frontend |
| **Database** | SQLite via `sql.js` | Zero configuration, file-based, portable |
| **Browser Automation** | Playwright (Chromium) | Modern, reliable, supports all form types |
| **Real-time Updates** | Server-Sent Events (SSE) | Lightweight one-way server→client streaming |
| **Styling** | Vanilla CSS (dark theme) | Full control, no framework dependency |

---

## 3. How to Run the Application

### Prerequisites
- **Node.js** version 18 or higher
- **npm** version 9 or higher
- Internet connection (for scraping jobs and for Playwright to load pages)

### Quick Start (3 commands)

```bash
# Step 1: Install all dependencies
cd server && npm install && cd ../client && npm install && cd ..

# Step 2: Install Playwright browser + generate dummy resume
cd server && npx playwright install chromium && npm run create-resume && cd ..

# Step 3: Start the application
npm run dev
```

This starts:
- **Backend server** on `http://localhost:3001`
- **Frontend dashboard** on `http://localhost:5173`

Open your browser to **http://localhost:5173** to use the app.

### Running Individually

```bash
# Terminal 1 — Backend
cd server
npm run dev
# Runs on http://localhost:3001

# Terminal 2 — Frontend
cd client
npm run dev
# Runs on http://localhost:5173
```

### Running Tests

```bash
cd server
npm test
# Runs 15 tests across 3 test files (database, scraper, candidate)
```

### Running the Scraper Standalone

```bash
cd server
npm run scrape
```

---

## 4. Architecture

```
┌──────────────────────────────────────────────────┐
│              FRONTEND (React + Vite)             │
│                                                  │
│   Dashboard → StatsBar, SearchBar, JobCards      │
│   Modals   → JobDetail, ScreenshotModal          │
│   Actions  → Apply, Apply All, Reset, Scrape     │
│                                                  │
│          ↕ HTTP REST API + SSE Stream            │
└──────────────────────────────────────────────────┘
                        ↕
┌──────────────────────────────────────────────────┐
│              BACKEND (Express + TypeScript)       │
│                                                  │
│   Routes   → /api/jobs, /api/scrape, /api/stats  │
│   Scraper  → Greenhouse Boards API (10 boards)   │
│   Automtn  → Playwright headless Chromium         │
│                                                  │
│   ┌────────────┐  ┌───────────┐  ┌────────────┐ │
│   │  SQLite DB  │  │ Candidate │  │Screenshots │ │
│   │ data/jobs.db│  │profile.json│ │  *.png     │ │
│   └────────────┘  └───────────┘  └────────────┘ │
└──────────────────────────────────────────────────┘
```

### Project Structure

```
greenhouse-application-dashboard/
├── package.json              # Root scripts (npm run dev, etc.)
├── README.md                 # Full documentation
├── .gitignore
│
├── server/                   # BACKEND
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts          # Server entry point
│   │   ├── routes.ts         # All API routes + SSE
│   │   ├── database.ts       # SQLite layer (sql.js)
│   │   ├── scraper.ts        # Greenhouse API scraper
│   │   ├── automation.ts     # Playwright automation
│   │   ├── candidate.ts      # Profile loader
│   │   └── types.ts          # TypeScript interfaces
│   ├── candidate/
│   │   ├── profile.json      # Dummy candidate data
│   │   └── resume.pdf        # Dummy resume PDF
│   ├── scripts/
│   │   └── create-resume.ts  # Resume PDF generator
│   ├── data/
│   │   └── jobs.db           # SQLite database (auto-created)
│   ├── screenshots/          # Automation screenshots
│   └── tests/
│       ├── database.test.ts
│       ├── scraper.test.ts
│       └── candidate.test.ts
│
└── client/                   # FRONTEND
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── App.css
        ├── index.css          # Design system (CSS variables)
        ├── types.ts
        ├── api.ts             # API client + SSE
        └── components/
            ├── Dashboard.tsx/css
            ├── Header.tsx/css
            ├── StatsBar.tsx/css
            ├── SearchBar.tsx/css
            ├── JobCard.tsx/css
            ├── JobDetail.tsx/css
            ├── StatusBadge.tsx/css
            ├── ApplyAllButton.tsx/css
            ├── ScreenshotModal.tsx/css
            └── Notification.tsx/css
```

---

## 5. Features — Detailed Breakdown

### 5.1 Job Scraping

**How it works:**
- Uses the **Greenhouse Boards API** (`https://boards-api.greenhouse.io/v1/boards/{company}/jobs`)
- Queries **10 company boards**: GitLab, AshbyHQ, Coda, Figma, Notion, Discord, Stripe, Cloudflare, Watershed, Verkada
- Takes up to 5 jobs per board, capped at **15 total**
- Each board has a 10-second timeout — if a board doesn't respond, it's skipped gracefully
- Jobs are **deduplicated by URL** before storing

**Data extracted per job:**
- Job ID (composite: `{company}-{greenhouse_id}`)
- Title
- Location
- Department
- Application URL
- Company name
- Created/updated date

**Triggered via:**
- Dashboard "Scrape Jobs" button
- API: `POST /api/scrape`
- CLI: `cd server && npm run scrape`

---

### 5.2 Dashboard UI

**Components:**

| Component | What it does |
|---|---|
| **Header** | App title and branding |
| **StatsBar** | Shows counts for each status: Total, Not Applied, In Progress, Form Filled, Review Reached, Completed, Failed |
| **SearchBar** | Text search (filters by title, location, department, company) + status dropdown filter + Scrape button |
| **JobCard** | Shows job title, company, location, department, status badge, error message (if failed), screenshot thumbnail (if captured), and action buttons (Apply, Reset, Details) |
| **JobDetail** | Full modal view of a job with all information, screenshot preview, and action buttons |
| **ScreenshotModal** | Full-resolution zoomable screenshot viewer |
| **StatusBadge** | Color-coded pill showing current job status |
| **ApplyAllButton** | Requires double-click confirmation, shows count of unapplied jobs |
| **Notification** | Toast notifications for success/error/info events |

**Real-time updates:**
- Uses **Server-Sent Events (SSE)** endpoint at `/api/jobs/status-stream`
- When automation changes a job's status, the server broadcasts the update
- Dashboard instantly reflects changes without page refresh
- Falls back to polling every 5 seconds if SSE fails

---

### 5.3 Browser Automation (Playwright)

**How it works step by step:**

1. **Launch** headless Chromium browser
2. **Navigate** to the Greenhouse job URL
3. **CAPTCHA check** — scan for reCAPTCHA, hCaptcha, Cloudflare challenge iframes
4. **Click "Apply" button** — tries multiple selectors (`a:has-text("Apply")`, `button:has-text("Apply")`, etc.)
5. **Fill form fields** — dynamically matches form labels to candidate data using 35+ pattern mappings
6. **Upload resume** — finds `input[type="file"]` and uploads the PDF
7. **Handle multi-step forms** — clicks Next/Continue buttons (up to 5 steps)
8. **Detect review page** — looks for "Review Application" or "Submit" text
9. **STOP** — does NOT click Submit
10. **Capture screenshot** — full-page PNG screenshot as evidence
11. **Update status** — sets job to `screenshot_captured` or `failed`

**Field matching logic:**
The automation uses a mapping table with 35+ patterns to match form field labels to candidate data:

| Form Label Contains | Fills With |
|---|---|
| first name, fname | Jane |
| last name, lname | Doe |
| email, e-mail | jane.doe.test@example.com |
| phone, mobile, telephone | 555-0123 |
| linkedin | https://linkedin.com/in/janedoe |
| website, portfolio, github | https://janedoe.dev |
| company, current employer | Tech Corp |
| title, job title | Software Engineer |
| school, university | State University |
| degree | Bachelor's |
| major, field of study | Computer Science |
| cover letter | Pre-written cover letter |
| salary, compensation | 90000 |
| gender, race, veteran, disability | "Decline to self-identify" |

**Timeouts:**
- Per job: 120 seconds maximum
- Page load: 30 seconds
- Individual element: 5 seconds

---

### 5.4 Apply-to-All

- Processes all jobs with status `not_applied` **sequentially** (one at a time)
- If one job fails, it continues to the next
- 2-second pause between jobs to avoid rate limiting
- Real-time progress via SSE — each job's status updates live on the dashboard
- Requires double-click confirmation to prevent accidental triggers

---

### 5.5 Job Status Lifecycle

```
not_applied  →  in_progress  →  form_filled  →  review_page_reached  →  screenshot_captured
                    ↓                                                         ↓
                  failed  ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←  reset
```

| Status | Meaning |
|---|---|
| `not_applied` | Job scraped, no automation attempted yet |
| `in_progress` | Automation is currently running |
| `form_filled` | Form fields were filled successfully |
| `review_page_reached` | Reached the final review/submit page |
| `screenshot_captured` | Screenshot taken, automation complete (SUCCESS) |
| `failed` | Something went wrong (CAPTCHA, timeout, no form found, etc.) |

---

### 5.6 Screenshot Storage

- Saved to `server/screenshots/screenshot_{jobId}.png`
- Full-page screenshots at 1280×900 viewport
- Served via API at `GET /api/jobs/:id/screenshot`
- Viewable in dashboard via thumbnail on job cards and full-screen modal
- Associated with the job record in the database

---

### 5.7 CAPTCHA & Error Handling

**CAPTCHA Detection:**
- Scans for `iframe[src*="recaptcha"]`, `.g-recaptcha`, `iframe[src*="hcaptcha"]`, `.h-captcha`, `#challenge-form`, `.cf-browser-verification`
- Checks twice: once on the job page, once after clicking Apply
- If detected → aborts gracefully with status `failed` and reason "CAPTCHA detected"
- **Never attempts to bypass CAPTCHA**

**Other error handling:**
- Network timeouts → graceful failure
- Missing Apply button → checks if already on form, otherwise fails
- Job page unavailable → fails with descriptive error
- Any unhandled exception → caught, screenshot captured, status set to failed

---

## 6. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check (returns `{ status: "ok" }`) |
| `GET` | `/api/jobs` | List all jobs. Optional query params: `?search=`, `?status=`, `?company=` |
| `GET` | `/api/jobs/:id` | Get single job by ID |
| `POST` | `/api/jobs/:id/apply` | Start automation for one job |
| `POST` | `/api/jobs/apply-all` | Start automation for all unapplied jobs |
| `POST` | `/api/jobs/:id/reset` | Reset job status to `not_applied` |
| `GET` | `/api/jobs/:id/screenshot` | Get screenshot image (PNG) |
| `GET` | `/api/jobs/status-stream` | SSE stream for real-time status updates |
| `GET` | `/api/stats` | Job statistics grouped by status |
| `POST` | `/api/scrape` | Trigger job scraping from Greenhouse |
| `GET` | `/api/candidate` | Get candidate profile (sans resume path) |

---

## 7. Database Schema

**Table: `jobs`**

| Column | Type | Description |
|---|---|---|
| `id` | TEXT PRIMARY KEY | Composite ID: `{company}-{greenhouse_id}` |
| `title` | TEXT NOT NULL | Job title |
| `location` | TEXT | Job location |
| `department` | TEXT | Department name |
| `url` | TEXT NOT NULL UNIQUE | Greenhouse application URL |
| `company` | TEXT NOT NULL | Company name |
| `created_at` | TEXT NOT NULL | ISO timestamp |
| `status` | TEXT NOT NULL | Current status |
| `failure_reason` | TEXT | Error message if failed |
| `screenshot_path` | TEXT | Screenshot filename |
| `applied_at` | TEXT | ISO timestamp when applied |

---

## 8. Candidate Profile

Stored in `server/candidate/profile.json`:

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe.test@example.com",
  "phone": "555-0123",
  "currentCompany": "Tech Corp",
  "currentTitle": "Software Engineer",
  "linkedinUrl": "https://linkedin.com/in/janedoe",
  "websiteUrl": "https://janedoe.dev",
  "location": "San Francisco, CA",
  "howDidYouHear": "Job Board",
  "yearsOfExperience": "3",
  "salaryExpectation": "90000",
  "startDate": "2025-02-01",
  "workAuthorization": "Yes",
  "gender": "Decline to self-identify",
  "race": "Decline to self-identify",
  "veteranStatus": "I am not a protected veteran",
  "disabilityStatus": "I do not wish to answer",
  "education": {
    "school": "State University",
    "degree": "Bachelor's",
    "fieldOfStudy": "Computer Science",
    "gpa": "3.7"
  },
  "resumePath": "candidate/resume.pdf",
  "coverLetter": "I am writing to express my interest..."
}
```

---

## 9. Safety Mechanisms (CRITICAL)

> ⚠️ **The application NEVER submits a job application.**

### How safety is enforced:

1. **Button text checking** — Before clicking any button, the automation checks if it contains "Submit". If yes, it **refuses to click** and stops.

2. **Review page detection** — The system identifies the final review page by looking for text like "Review Application", "Submit Application", "Confirm and Submit" and stops there.

3. **No Next button bypass** — The `clickNextButton()` function explicitly checks: if the button text includes "submit", it logs `SAFETY STOP` and returns false.

4. **Screenshot before stop** — Evidence is captured at the final stage proving the form was filled correctly.

5. **Dummy data only** — All form fills use clearly fake test data (`jane.doe.test@example.com`, phone `555-0123`).

6. **No CAPTCHA bypass** — The system never tries to solve or bypass CAPTCHAs. It detects and aborts.

7. **No programmatic submission** — There is no `form.submit()` or JavaScript submission trigger anywhere in the code.

---

## 10. Testing

### Test Files

| File | Tests | What it covers |
|---|---|---|
| `database.test.ts` | 7 | Insert, deduplicate, get by ID, update status, search, reset, stats |
| `scraper.test.ts` | 4 | Job normalization, missing location handling, missing department, URL deduplication |
| `candidate.test.ts` | 4 | Valid profile, missing required fields, invalid email, education fields |

### Running Tests

```bash
cd server
npm test
# Output: 3 files, 15 tests, all passing
```

---

## 11. Known Limitations

1. **CAPTCHA/Bot Protection** — Many Greenhouse pages (e.g., GitLab) show CAPTCHAs. The automation detects and gracefully fails on these.
2. **Custom form fields** — Unusual or company-specific form questions may not be auto-filled.
3. **Rate limiting** — Rapid automation may trigger rate limits on some sites.
4. **Multi-step forms** — Handles up to 5 steps. Very long forms may not be fully traversed.
5. **Rich text editors** — Cannot fill WYSIWYG editors or matrix-type questions.

---

## 12. Potential Interview Questions & Answers

### Q: How does the scraping work?
**A:** I use the public Greenhouse Boards API (`boards-api.greenhouse.io/v1/boards/{company}/jobs`). It returns JSON with job listings. I query 10 company boards, take up to 5 jobs each, deduplicate by URL, and cap at 15 total. Each request has a 10-second timeout.

### Q: Why did you choose sql.js over better-sqlite3?
**A:** `better-sqlite3` requires C++ compilation via `node-gyp`, which needs Visual Studio Build Tools on Windows. `sql.js` is a pure JavaScript SQLite compiled via WebAssembly — zero native dependencies, works out of the box.

### Q: How do you ensure applications are never submitted?
**A:** Multiple safety layers: (1) the `clickNextButton()` function checks button text for "submit" and refuses to click, (2) `isReviewPage()` detects the final page and stops, (3) there's no `form.submit()` call anywhere, (4) all data is clearly fake test data.

### Q: How does real-time status work?
**A:** Server-Sent Events (SSE). The server maintains a set of connected clients. When automation updates a job status, it broadcasts via SSE. The React dashboard listens and updates state instantly. There's also a 5-second polling fallback.

### Q: How does the field mapping work?
**A:** I have a mapping table with 35+ patterns (e.g., "first_name", "fname", "first name" all map to `profile.firstName`). For each input/textarea/select on the form, I extract the label text, `name`, `id`, `placeholder`, and `aria-label`, then match against the patterns. There's also fallback matching by input type (email inputs → email, tel inputs → phone).

### Q: What happens when automation fails?
**A:** Every error is caught. The system tries to capture a screenshot of the failure state, then sets the job status to `failed` with a descriptive `failure_reason`. The user can see the error on the dashboard and click "Reset" to try again.

### Q: How do you handle CAPTCHA?
**A:** Before and after clicking the Apply button, I scan the page for CAPTCHA indicators (reCAPTCHA iframes, hCaptcha elements, Cloudflare challenge forms). If detected, I capture a screenshot, set the status to failed with "CAPTCHA detected", and abort. I never attempt to bypass CAPTCHAs.

### Q: What's the tech stack and why?
**A:** React+TypeScript frontend for type safety and component architecture. Express+TypeScript backend for consistency. SQLite for zero-config persistence. Playwright for reliable browser automation with modern web support. SSE for lightweight real-time updates without WebSocket complexity.

### Q: How is the database structured?
**A:** Single `jobs` table with columns: id, title, location, department, url (unique), company, created_at, status, failure_reason, screenshot_path, applied_at. The URL uniqueness prevents duplicate job entries.

### Q: What would you improve with more time?
**A:** (1) Add a queue system (Bull/BullMQ) for better job processing, (2) Add WebSocket for bidirectional communication, (3) Add more robust form field detection using ML, (4) Add user authentication, (5) Add retry logic with exponential backoff, (6) Add a proxy rotation system to reduce CAPTCHA triggering.

---

## 13. Commands Quick Reference

```bash
# Setup
cd server && npm install                    # Install server deps
cd client && npm install                    # Install client deps
cd server && npx playwright install chromium # Install browser
cd server && npm run create-resume          # Generate dummy resume

# Development
npm run dev                                 # Start both (from root)

# Individual
cd server && npm run dev                    # Start backend only
cd client && npm run dev                    # Start frontend only

# Testing
cd server && npm test                       # Run all tests

# Scraping
cd server && npm run scrape                 # Scrape from CLI

# Build
cd client && npm run build                  # Production build
```
