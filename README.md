# Greenhouse Application Dashboard

> **Automated Job Application Dashboard** — Scrapes job listings from Greenhouse-powered careers pages, displays them in a polished dashboard, and automates the application process using browser automation.

> ⚠️ **SAFETY GUARANTEE**: No job applications are ever actually submitted. The automation always stops at the review/confirmation stage and captures a screenshot as evidence. The final "Submit Application" button is **never** clicked.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Candidate Configuration](#candidate-configuration)
- [Resume Configuration](#resume-configuration)
- [Database / Storage Setup](#database--storage-setup)
- [Starting the Application](#starting-the-application)
- [Running the Scraper](#running-the-scraper)
- [Running Individual Automation](#running-individual-automation)
- [Running Apply-to-All](#running-apply-to-all)
- [Screenshot Storage](#screenshot-storage)
- [Testing](#testing)
- [Known Limitations](#known-limitations)
- [Safety Behavior](#safety-behavior)

---

## Project Overview

This application is a full-stack system that:

1. **Scrapes** ~10–15 job listings from publicly accessible Greenhouse careers pages using the Greenhouse Boards API.
2. **Displays** them in a responsive, polished dark-themed dashboard.
3. **Automates** the application process using headless browser automation (Playwright).
4. **Captures screenshots** of the final review page as evidence that forms were filled correctly — **without ever submitting**.
5. **Tracks status** of each application through its lifecycle (Not Applied → In Progress → Form Filled → Review Page Reached → Screenshot Captured / Failed).

### Key Features

- Dynamic job scraping from the Greenhouse API
- Real-time status updates via Server-Sent Events (SSE)
- Search and filter jobs by title, location, department, or status
- Individual Apply and Apply-to-All automation
- Multi-step form handling
- Resume upload
- CAPTCHA/security challenge detection with graceful failure
- Screenshot evidence stored and viewable in dashboard
- Retry-friendly: reset failed jobs and re-run automation

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)                │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │Dashboard │  │Job Cards │  │Screenshot View │ │
│  │StatsBar  │  │Search    │  │Job Detail Modal│ │
│  └────┬─────┘  └────┬─────┘  └───────┬────────┘ │
│       │              │                │          │
│       └──────────────┴────────────────┘          │
│                      │ HTTP/SSE                  │
└──────────────────────┼───────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────┐
│                  Backend (Express)                │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ Routes   │  │ Scraper  │  │  Automation    │ │
│  │ (API)    │  │ (GH API) │  │  (Playwright)  │ │
│  └────┬─────┘  └────┬─────┘  └───────┬────────┘ │
│       │              │                │          │
│       └──────────────┴────────────────┘          │
│                      │                           │
│  ┌───────────────────┼───────────────────────┐   │
│  │              SQLite Database              │   │
│  │         (server/data/jobs.db)             │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌────────────────┐  ┌─────────────────────┐     │
│  │ Candidate Data │  │ Screenshots         │     │
│  │ (profile.json) │  │ (server/screenshots)│     │
│  └────────────────┘  └─────────────────────┘     │
└──────────────────────────────────────────────────┘
```

### Project Structure

```
├── package.json              # Root package.json with convenience scripts
├── README.md
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts          # Express server entry point (port 3001)
│   │   ├── routes.ts         # API routes + SSE endpoint
│   │   ├── database.ts       # SQLite database layer
│   │   ├── scraper.ts        # Greenhouse API scraper
│   │   ├── automation.ts     # Playwright browser automation
│   │   ├── candidate.ts      # Candidate profile management
│   │   └── types.ts          # TypeScript type definitions
│   ├── scripts/
│   │   └── create-resume.ts  # Generate dummy resume PDF
│   ├── candidate/
│   │   ├── profile.json      # Dummy candidate data
│   │   └── resume.pdf        # Dummy resume (generated)
│   ├── data/
│   │   └── jobs.db           # SQLite database (auto-created)
│   ├── screenshots/          # Automation screenshots
│   └── tests/
│       ├── database.test.ts
│       ├── scraper.test.ts
│       └── candidate.test.ts
├── client/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── App.css
│       ├── index.css         # Design system
│       ├── types.ts
│       ├── api.ts            # API client
│       └── components/
│           ├── Dashboard.tsx/css
│           ├── Header.tsx/css
│           ├── StatsBar.tsx/css
│           ├── SearchBar.tsx/css
│           ├── JobCard.tsx/css
│           ├── JobDetail.tsx/css
│           ├── StatusBadge.tsx/css
│           ├── ApplyAllButton.tsx/css
│           ├── ScreenshotModal.tsx/css
│           └── Notification.tsx/css
```

---

## Technology Stack

| Layer             | Technology                    |
|-------------------|-------------------------------|
| Frontend          | React 18, TypeScript, Vite    |
| Backend           | Node.js, Express, TypeScript  |
| Database          | SQLite (via better-sqlite3)   |
| Browser Automation| Playwright (Chromium)         |
| Real-time Updates | Server-Sent Events (SSE)      |
| Styling           | Vanilla CSS (dark theme)      |

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- A working internet connection (for scraping Greenhouse jobs and for Playwright browser automation)

---

## Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd greenhouse-application-dashboard

# 2. Install all dependencies (server + client)
npm run install:all

# 3. Install Playwright Chromium browser
cd server
npx playwright install chromium
cd ..

# 4. Generate the dummy resume PDF
cd server
npm run create-resume
cd ..
```

### Quick Setup (single command)

```bash
npm run setup
```

This will install all dependencies, generate the resume, and install the Playwright browser.

---

## Environment Variables

No environment variables are required for basic operation. The defaults are:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3001`  | Backend server port |

The frontend dev server runs on port `5173` by default (Vite).

---

## Candidate Configuration

Candidate data is stored in `server/candidate/profile.json`. This file contains dummy data used to fill job application forms:

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
  ...
}
```

You can modify this file to use different candidate information. All fields map automatically to Greenhouse application form fields.

---

## Resume Configuration

The resume PDF is located at `server/candidate/resume.pdf`. It is generated by running:

```bash
cd server
npm run create-resume
```

To use your own resume, replace `server/candidate/resume.pdf` with your file and ensure `profile.json` has the correct `resumePath`.

---

## Database / Storage Setup

**No manual setup required.** The SQLite database is automatically created at `server/data/jobs.db` when the server starts.

To reset the database, simply delete the file:
```bash
rm server/data/jobs.db
```

---

## Starting the Application

### Start both server and client together:

```bash
# From root directory
npm install        # Install root dependencies (concurrently)
npm run dev        # Starts both server and client
```

### Start individually:

```bash
# Terminal 1: Start the backend
cd server
npm run dev
# Server runs at http://localhost:3001

# Terminal 2: Start the frontend
cd client
npm run dev
# Dashboard at http://localhost:5173
```

Then open **http://localhost:5173** in your browser.

---

## Running the Scraper

### From the dashboard:
Click the **"🔄 Scrape Jobs"** button in the toolbar.

### From the command line:
```bash
cd server
npm run scrape
```

### Via API:
```bash
curl -X POST http://localhost:3001/api/scrape
```

The scraper fetches jobs from multiple Greenhouse boards (GitLab, Figma, Stripe, Cloudflare, etc.) and stores approximately 10-15 jobs in the database.

---

## Running Individual Automation

### From the dashboard:
Click the **"▶ Apply"** button on any job card.

### Via API:
```bash
curl -X POST http://localhost:3001/api/jobs/<job-id>/apply
```

The automation will:
1. Open a headless Chromium browser
2. Navigate to the Greenhouse job application page
3. Click the "Apply" button
4. Fill in all form fields with candidate data
5. Upload the resume PDF
6. Navigate through multi-step forms
7. **Stop at the review page** (never submits)
8. Capture a full-page screenshot
9. Update the job status

---

## Running Apply-to-All

### From the dashboard:
Click the **"🚀 Apply to All"** button. It requires confirmation (click twice).

### Via API:
```bash
curl -X POST http://localhost:3001/api/jobs/apply-all
```

Apply-to-All processes all unapplied jobs sequentially. If one job fails, it continues with the next. Real-time progress is shown via SSE updates.

---

## Screenshot Storage

Screenshots are saved to `server/screenshots/` with the naming convention:

```
screenshot_<job_id>.png
```

They are:
- Automatically associated with the correct job in the database
- Served via the API at `GET /api/jobs/:id/screenshot`
- Viewable in the dashboard via the screenshot thumbnail on job cards
- Viewable in full resolution in the Screenshot Modal

---

## Testing

```bash
cd server
npm test
```

Tests cover:
- **Database operations**: CRUD, search, deduplication, status updates
- **Scraper logic**: Job normalization, missing fields handling, deduplication
- **Candidate profile**: Validation, required fields, email format

---

## API Reference

| Method | Endpoint                     | Description                        |
|--------|------------------------------|------------------------------------|
| GET    | `/api/jobs`                  | List all jobs (with ?search, ?status) |
| GET    | `/api/jobs/:id`              | Get single job details             |
| POST   | `/api/jobs/:id/apply`        | Start automation for single job    |
| POST   | `/api/jobs/apply-all`        | Start Apply-to-All                 |
| POST   | `/api/jobs/:id/reset`        | Reset job status                   |
| GET    | `/api/jobs/:id/screenshot`   | Get screenshot image               |
| GET    | `/api/jobs/status-stream`    | SSE stream for real-time updates   |
| GET    | `/api/stats`                 | Job statistics by status           |
| POST   | `/api/scrape`                | Trigger job scraping               |
| GET    | `/api/candidate`             | Get candidate profile              |
| GET    | `/api/health`                | Health check                       |

---

## Known Limitations

1. **CAPTCHA/Bot Protection**: Some Greenhouse pages may present CAPTCHA challenges (reCAPTCHA, hCaptcha, Cloudflare). The system detects these and records a graceful failure — it does NOT attempt to bypass them.

2. **Dynamic Form Structures**: While the field mapping handles most common Greenhouse form fields, some companies customize their application forms significantly. Unusual or custom fields may be skipped.

3. **Rate Limiting**: Running automation on many jobs quickly may trigger rate limiting. The system includes delays between jobs but cannot guarantee avoidance.

4. **Multi-Step Forms**: The system handles up to 5 steps. Very long multi-step forms may not be fully traversed.

5. **Custom Question Types**: Rich text editors, matrix questions, or highly custom question types may not be fillable.

6. **Job Availability**: Scraped jobs may become unavailable between scraping and applying. The system handles this gracefully.

---

## Safety Behavior

### ⚠️ Applications Are Never Submitted

This system implements multiple safety measures to ensure **no job application is ever actually submitted**:

1. **Button Detection**: The automation explicitly checks for and **refuses to click** any button containing "Submit", "Send Application", or similar text.

2. **Review Page Detection**: The automation identifies the review/final page and stops there.

3. **Screenshot Before Stop**: A screenshot is captured at the final stage as evidence.

4. **No CAPTCHA Bypass**: The system never attempts to bypass CAPTCHAs, MFA, or bot protection mechanisms.

5. **No Programmatic Submission**: There is no code that triggers form submission via JavaScript.

6. **Dummy Data Only**: All form fields are filled with clearly fake/test candidate data (jane.doe.test@example.com).

7. **Read-Only Evidence**: The system only reads form state and captures visual evidence.

---

## Commands Quick Reference

```bash
# Setup
npm run setup                    # Full setup (install + browsers + resume)

# Development
npm run dev                      # Start both server and client
npm run dev:server               # Start server only
npm run dev:client               # Start client only

# Scraping
npm run scrape                   # Scrape jobs from CLI
cd server && npm run scrape      # Alternative

# Testing
npm test                         # Run server tests
cd server && npm test            # Alternative

# Building
npm run build                    # Production build
```

---

## License

This project was created as an internship assessment submission and is not licensed for production use.
