import { chromium, Browser, Page } from 'playwright';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Job, JobStatus, CandidateProfile, AutomationResult } from './types.js';
import { loadCandidateProfile, getResumeAbsolutePath } from './candidate.js';

const SCREENSHOT_DIR = join(process.cwd(), 'screenshots');
const JOB_TIMEOUT = 120000;
const PAGE_TIMEOUT = 30000;

const FIELD_MAPPINGS: Record<string, string> = {
  'first_name': 'firstName', 'first-name': 'firstName', 'firstname': 'firstName', 'fname': 'firstName', 'first name': 'firstName',
  'last_name': 'lastName', 'last-name': 'lastName', 'lastname': 'lastName', 'lname': 'lastName', 'last name': 'lastName',
  'email': 'email', 'e-mail': 'email', 'email_address': 'email', 'email address': 'email',
  'phone': 'phone', 'phone_number': 'phone', 'mobile': 'phone', 'phone number': 'phone', 'telephone': 'phone',
  'linkedin': 'linkedinUrl', 'linkedin_url': 'linkedinUrl', 'linkedin_profile': 'linkedinUrl', 'linkedin url': 'linkedinUrl',
  'website': 'websiteUrl', 'portfolio': 'websiteUrl', 'portfolio_url': 'websiteUrl', 'personal website': 'websiteUrl',
  'company': 'currentCompany', 'current_company': 'currentCompany', 'current_employer': 'currentCompany', 'current company': 'currentCompany',
  'title': 'currentTitle', 'current_title': 'currentTitle', 'current title': 'currentTitle',
  'location': 'location', 'city': 'location', 'address': 'location',
  'school': 'education.school', 'university': 'education.school', 'college': 'education.school',
  'degree': 'education.degree', 'degree type': 'education.degree',
  'discipline': 'education.fieldOfStudy', 'field_of_study': 'education.fieldOfStudy', 'major': 'education.fieldOfStudy',
  'gpa': 'education.gpa',
  'cover_letter': 'coverLetter', 'coverletter': 'coverLetter', 'cover letter': 'coverLetter',
  'how_did_you_hear': 'howDidYouHear', 'how did you hear': 'howDidYouHear', 'hear about us': 'howDidYouHear',
  'salary': 'salaryExpectation', 'salary_expectation': 'salaryExpectation', 'desired salary': 'salaryExpectation',
  'start_date': 'startDate', 'availability': 'startDate',
  'years_experience': 'yearsOfExperience', 'experience': 'yearsOfExperience', 'years of experience': 'yearsOfExperience',
  'authorized': 'workAuthorization', 'work_authorization': 'workAuthorization', 'work authorization': 'workAuthorization',
  'gender': 'gender', 'race': 'race', 'ethnicity': 'race',
  'veteran': 'veteranStatus', 'veteran status': 'veteranStatus',
  'disability': 'disabilityStatus', 'disability status': 'disabilityStatus',
};

function getProfileValue(profile: CandidateProfile, key: string): string | undefined {
  if (key.includes('.')) {
    const [parent, child] = key.split('.');
    const parentObj = (profile as any)[parent];
    return parentObj?.[child];
  }
  return (profile as any)[key];
}

function matchFieldToProfile(labelText: string, profile: CandidateProfile): string | undefined {
  const normalized = labelText.toLowerCase().trim().replace(/[^a-z0-9\s_-]/g, '').replace(/\s+/g, ' ');

  for (const [pattern, profileKey] of Object.entries(FIELD_MAPPINGS)) {
    if (normalized === pattern || normalized.includes(pattern)) {
      return getProfileValue(profile, profileKey);
    }
  }

  if (normalized.includes('first') && normalized.includes('name')) return profile.firstName;
  if (normalized.includes('last') && normalized.includes('name')) return profile.lastName;
  if (normalized.includes('full') && normalized.includes('name')) return `${profile.firstName} ${profile.lastName}`;
  if (normalized.includes('name') && !normalized.includes('company') && !normalized.includes('school')) return profile.firstName;
  if (normalized.includes('email') || normalized.includes('e-mail')) return profile.email;
  if (normalized.includes('phone') || normalized.includes('mobile') || normalized.includes('telephone')) return profile.phone;
  if (normalized.includes('linkedin')) return profile.linkedinUrl;
  if (normalized.includes('website') || normalized.includes('portfolio') || normalized.includes('github')) return profile.websiteUrl;
  if (normalized.includes('cover') && normalized.includes('letter')) return profile.coverLetter;
  if (normalized.includes('salary') || normalized.includes('compensation') || normalized.includes('pay')) return profile.salaryExpectation;

  return undefined;
}

export type StatusCallback = (jobId: string, status: JobStatus, failureReason?: string | null, screenshotPath?: string | null) => void;

export class GreenhouseAutomation {
  private profile: CandidateProfile;
  private resumePath: string;

  constructor() {
    this.profile = loadCandidateProfile();
    this.resumePath = getResumeAbsolutePath();
    if (!existsSync(SCREENSHOT_DIR)) {
      mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  }

  async applyToJob(job: Job, updateStatus: StatusCallback): Promise<AutomationResult> {
    let browser: Browser | null = null;
    const startTime = Date.now();

    console.log(`\n[AUTOMATION] Starting: ${job.title} (${job.company})`);
    console.log(`  URL: ${job.url}`);

    try {
      updateStatus(job.id, 'in_progress');

      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();
      page.setDefaultTimeout(PAGE_TIMEOUT);

      console.log('  Navigating to job page...');
      await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
      await page.waitForTimeout(2000);

      if (await this.detectCaptcha(page)) {
        console.log('  CAPTCHA detected - aborting');
        const screenshotPath = await this.captureScreenshot(page, job.id);
        updateStatus(job.id, 'failed', 'CAPTCHA detected - manual intervention required', screenshotPath);
        return { jobId: job.id, status: 'failed', screenshotPath, failureReason: 'CAPTCHA detected - manual intervention required' };
      }

      console.log('  Looking for Apply button...');
      const applyClicked = await this.clickApplyButton(page);
      if (!applyClicked) {
        console.log('  No Apply button found, checking if already on form...');
        const hasForm = await page.locator('form, input[type="text"], input[type="email"]').first().isVisible().catch(() => false);
        if (!hasForm) {
          const screenshotPath = await this.captureScreenshot(page, job.id);
          updateStatus(job.id, 'failed', 'Could not find application form or Apply button', screenshotPath);
          return { jobId: job.id, status: 'failed', screenshotPath, failureReason: 'Could not find application form or Apply button' };
        }
      }

      await page.waitForTimeout(3000);

      if (await this.detectCaptcha(page)) {
        console.log('  CAPTCHA detected on application form - aborting');
        const screenshotPath = await this.captureScreenshot(page, job.id);
        updateStatus(job.id, 'failed', 'CAPTCHA detected on application form', screenshotPath);
        return { jobId: job.id, status: 'failed', screenshotPath, failureReason: 'CAPTCHA detected on application form' };
      }

      console.log('  Filling application form...');
      await this.fillApplicationForm(page);
      updateStatus(job.id, 'form_filled');

      console.log('  Handling multi-step navigation...');
      await this.handleMultiStepForm(page);

      if (Date.now() - startTime > JOB_TIMEOUT) {
        const screenshotPath = await this.captureScreenshot(page, job.id);
        updateStatus(job.id, 'failed', 'Automation timed out', screenshotPath);
        return { jobId: job.id, status: 'failed', screenshotPath, failureReason: 'Automation timed out' };
      }

      updateStatus(job.id, 'review_page_reached');

      console.log('  Capturing screenshot...');
      const screenshotPath = await this.captureScreenshot(page, job.id);

      console.log(`  Screenshot captured: ${screenshotPath}`);
      console.log('  STOPPING - Not submitting application (safety constraint)');

      updateStatus(job.id, 'screenshot_captured', null, screenshotPath);

      return { jobId: job.id, status: 'screenshot_captured', screenshotPath, failureReason: null };
    } catch (error: any) {
      console.error(`  Automation failed: ${error.message}`);
      let screenshotPath: string | null = null;

      try {
        if (browser) {
          const pages = browser.contexts()?.[0]?.pages();
          if (pages && pages.length > 0) {
            screenshotPath = await this.captureScreenshot(pages[0], job.id);
          }
        }
      } catch { /* ignore */ }

      updateStatus(job.id, 'failed', error.message, screenshotPath);
      return { jobId: job.id, status: 'failed', screenshotPath, failureReason: error.message };
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  Completed in ${elapsed}s`);
    }
  }

  private async detectCaptcha(page: Page): Promise<boolean> {
    try {
      const recaptcha = await page.locator('iframe[src*="recaptcha"], iframe[src*="captcha"], iframe[title*="reCAPTCHA"], .g-recaptcha, #captcha, [data-captcha]').count();
      if (recaptcha > 0) return true;
      const hcaptcha = await page.locator('iframe[src*="hcaptcha"], .h-captcha').count();
      if (hcaptcha > 0) return true;
      const cfChallenge = await page.locator('#challenge-form, .cf-browser-verification').count();
      if (cfChallenge > 0) return true;
      return false;
    } catch {
      return false;
    }
  }

  private async clickApplyButton(page: Page): Promise<boolean> {
    const applySelectors = [
      'a:has-text("Apply")',
      'button:has-text("Apply")',
      'a[href*="#app"]',
      '.postings-btn',
      '#apply_button',
      'a.btn:has-text("Apply")',
      '[data-qa="btn-apply"]',
      'a:has-text("Apply for this job")',
      'a:has-text("Apply Now")',
    ];

    for (const selector of applySelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          const text = await btn.textContent() || '';
          if (text.toLowerCase().includes('submit')) continue;
          await btn.click();
          await page.waitForTimeout(2000);
          return true;
        }
      } catch {
        continue;
      }
    }
    return false;
  }

  private async fillApplicationForm(page: Page): Promise<void> {
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="number"]').all();

    for (const input of inputs) {
      try {
        if (!await input.isVisible()) continue;
        if (await input.isDisabled()) continue;

        const id = await input.getAttribute('id') || '';
        const name = await input.getAttribute('name') || '';
        const placeholder = await input.getAttribute('placeholder') || '';
        const ariaLabel = await input.getAttribute('aria-label') || '';
        const type = await input.getAttribute('type') || 'text';

        let labelText = ariaLabel || placeholder;
        if (id) {
          try {
            const label = page.locator(`label[for="${id}"]`);
            if (await label.count() > 0) {
              labelText = await label.textContent() || labelText;
            }
          } catch { /* ignore */ }
        }

        if (!labelText) {
          try {
            const parentLabel = input.locator('xpath=ancestor::label');
            if (await parentLabel.count() > 0) {
              labelText = await parentLabel.textContent() || '';
            }
          } catch { /* ignore */ }
        }

        const allHints = `${labelText} ${name} ${id} ${placeholder}`.toLowerCase();
        let value = matchFieldToProfile(allHints, this.profile);

        if (!value) {
          if (type === 'email') value = this.profile.email;
          else if (type === 'tel') value = this.profile.phone;
          else if (type === 'url') value = this.profile.websiteUrl;
        }

        if (value) {
          await input.fill('');
          await input.fill(value);
          console.log(`    Filled: ${(labelText || name || id).substring(0, 40)} = ${value.substring(0, 30)}`);
        }
      } catch {
        // Continue with next field
      }
    }

    // Fill textareas
    const textareas = await page.locator('textarea').all();
    for (const textarea of textareas) {
      try {
        if (!await textarea.isVisible()) continue;
        const id = await textarea.getAttribute('id') || '';
        const name = await textarea.getAttribute('name') || '';
        const ariaLabel = await textarea.getAttribute('aria-label') || '';
        const allHints = `${ariaLabel} ${name} ${id}`.toLowerCase();

        let value = matchFieldToProfile(allHints, this.profile);
        if (!value) value = this.profile.coverLetter;

        if (value) {
          await textarea.fill(value);
          console.log(`    Filled textarea: ${name || id}`);
        }
      } catch { /* ignore */ }
    }

    // Handle select/dropdown elements
    const selects = await page.locator('select').all();
    for (const select of selects) {
      try {
        if (!await select.isVisible()) continue;
        const id = await select.getAttribute('id') || '';
        const name = await select.getAttribute('name') || '';
        const ariaLabel = await select.getAttribute('aria-label') || '';
        const allHints = `${ariaLabel} ${name} ${id}`.toLowerCase();

        let value = matchFieldToProfile(allHints, this.profile);

        const options = await select.locator('option').all();
        const optionTexts: string[] = [];
        for (const opt of options) {
          const text = await opt.textContent() || '';
          optionTexts.push(text.trim());
        }

        if (value) {
          const matchingOption = optionTexts.find(opt =>
            opt.toLowerCase().includes(value!.toLowerCase()) ||
            value!.toLowerCase().includes(opt.toLowerCase())
          );
          if (matchingOption) {
            await select.selectOption({ label: matchingOption });
            console.log(`    Selected: ${name || id} = ${matchingOption}`);
          }
        } else {
          if (allHints.includes('gender') || allHints.includes('race') || allHints.includes('ethnicity') || allHints.includes('veteran') || allHints.includes('disability')) {
            const declineOption = optionTexts.find(opt =>
              opt.toLowerCase().includes('decline') ||
              opt.toLowerCase().includes('prefer not') ||
              opt.toLowerCase().includes('do not wish') ||
              opt.toLowerCase().includes('choose not')
            );
            if (declineOption) {
              await select.selectOption({ label: declineOption });
              console.log(`    Selected (EEO): ${name || id} = ${declineOption}`);
            }
          } else if (optionTexts.length > 1) {
            const validOption = optionTexts.find((opt, i) => i > 0 && opt.trim() !== '');
            if (validOption) {
              await select.selectOption({ label: validOption });
              console.log(`    Selected (fallback): ${name || id} = ${validOption}`);
            }
          }
        }
      } catch { /* ignore */ }
    }

    // Upload resume
    await this.uploadResume(page);

    // Handle checkboxes
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const checkbox of checkboxes) {
      try {
        if (!await checkbox.isVisible()) continue;
        if (!await checkbox.isChecked()) {
          await checkbox.check();
          console.log('    Checked checkbox');
        }
      } catch { /* ignore */ }
    }
  }

  private async uploadResume(page: Page): Promise<void> {
    try {
      const fileInputs = await page.locator('input[type="file"]').all();
      for (const fileInput of fileInputs) {
        try {
          const accept = await fileInput.getAttribute('accept') || '';
          const name = await fileInput.getAttribute('name') || '';
          const id = await fileInput.getAttribute('id') || '';
          const hints = `${name} ${id} ${accept}`.toLowerCase();
          const isResume = hints.includes('resume') || hints.includes('cv') || hints.includes('pdf') || hints.includes('doc') || fileInputs.indexOf(fileInput) === 0;

          if (isResume) {
            await fileInput.setInputFiles(this.resumePath);
            console.log('    Uploaded resume');
            await page.waitForTimeout(1000);
            return;
          }
        } catch { /* ignore */ }
      }
      console.log('    No file input found for resume upload');
    } catch (error: any) {
      console.log(`    Resume upload failed: ${error.message}`);
    }
  }

  private async handleMultiStepForm(page: Page): Promise<void> {
    const maxSteps = 5;
    for (let step = 0; step < maxSteps; step++) {
      await page.waitForTimeout(1500);

      if (await this.isReviewPage(page)) {
        console.log('    Review/submit page detected');
        return;
      }

      const nextClicked = await this.clickNextButton(page);
      if (!nextClicked) {
        console.log('    No more navigation buttons found');
        return;
      }

      console.log(`    Navigated to step ${step + 2}`);
      await page.waitForTimeout(2000);
      await this.fillApplicationForm(page);
    }
  }

  private async isReviewPage(page: Page): Promise<boolean> {
    try {
      const pageText = await page.textContent('body') || '';
      const lowerText = pageText.toLowerCase();
      const reviewIndicators = ['review your', 'review application', 'submit application', 'submit your', 'confirm and submit', 'review & submit', 'ready to submit'];
      for (const indicator of reviewIndicators) {
        if (lowerText.includes(indicator)) return true;
      }
      const submitBtn = await page.locator('button:has-text("Submit Application"), button:has-text("Submit"), input[type="submit"]').count();
      if (submitBtn > 0) {
        const nextBtn = await page.locator('button:has-text("Next"), button:has-text("Continue")').count();
        if (nextBtn === 0) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async clickNextButton(page: Page): Promise<boolean> {
    const nextSelectors = [
      'button:has-text("Next")',
      'button:has-text("Continue")',
      'button:has-text("Save & Continue")',
      'input[value="Next"]',
      'button[type="button"]:has-text("Next")',
      'a:has-text("Next")',
    ];

    for (const selector of nextSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          const text = (await btn.textContent() || '').toLowerCase();
          // SAFETY: Never click submit
          if (text.includes('submit')) {
            console.log('    SAFETY STOP: Found submit button - NOT clicking');
            return false;
          }
          await btn.click();
          return true;
        }
      } catch {
        continue;
      }
    }
    return false;
  }

  private async captureScreenshot(page: Page, jobId: string): Promise<string> {
    const filename = `screenshot_${jobId}.png`;
    const filepath = join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return filename;
  }

  async applyToAll(jobs: Job[], updateStatus: StatusCallback): Promise<AutomationResult[]> {
    const results: AutomationResult[] = [];
    const unapplied = jobs.filter(j => j.status === 'not_applied');

    console.log(`\n[APPLY ALL] Processing ${unapplied.length} unapplied jobs...`);

    for (let i = 0; i < unapplied.length; i++) {
      const job = unapplied[i];
      console.log(`\n--- Job ${i + 1}/${unapplied.length} ---`);

      try {
        const result = await this.applyToJob(job, updateStatus);
        results.push(result);
      } catch (error: any) {
        console.error(`Error on job ${job.id}: ${error.message}`);
        updateStatus(job.id, 'failed', error.message);
        results.push({ jobId: job.id, status: 'failed', screenshotPath: null, failureReason: error.message });
      }

      if (i < unapplied.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n[APPLY ALL] Complete:');
    const successful = results.filter(r => r.status === 'screenshot_captured').length;
    const failed = results.filter(r => r.status === 'failed').length;
    console.log(`  Success: ${successful}, Failed: ${failed}`);

    return results;
  }
}
