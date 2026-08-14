import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { CandidateProfile } from './types.js';

const PROFILE_PATH = join(process.cwd(), 'candidate', 'profile.json');

export function loadCandidateProfile(): CandidateProfile {
  if (!existsSync(PROFILE_PATH)) {
    throw new Error(`Candidate profile not found at: ${PROFILE_PATH}`);
  }
  const raw = readFileSync(PROFILE_PATH, 'utf-8');
  return JSON.parse(raw) as CandidateProfile;
}

export function saveCandidateProfile(profile: CandidateProfile): void {
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');
}

export function getResumeAbsolutePath(): string {
  const profile = loadCandidateProfile();
  const resumePath = resolve(process.cwd(), profile.resumePath);
  if (!existsSync(resumePath)) {
    throw new Error(`Resume not found at: ${resumePath}`);
  }
  return resumePath;
}

export function validateProfile(profile: CandidateProfile): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required: (keyof CandidateProfile)[] = ['firstName', 'lastName', 'email', 'phone', 'resumePath'];
  for (const field of required) {
    if (!profile[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (profile.email && !profile.email.includes('@')) {
    errors.push('Invalid email format');
  }
  return { valid: errors.length === 0, errors };
}
