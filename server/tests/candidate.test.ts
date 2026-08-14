import { describe, it, expect } from 'vitest';
import { CandidateProfile } from '../src/types.js';

const mockProfile: CandidateProfile = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe.test@example.com',
  phone: '555-0123',
  currentCompany: 'Tech Corp',
  currentTitle: 'Software Engineer',
  linkedinUrl: 'https://linkedin.com/in/janedoe',
  websiteUrl: 'https://janedoe.dev',
  location: 'San Francisco, CA',
  howDidYouHear: 'Job Board',
  yearsOfExperience: '3',
  salaryExpectation: '90000',
  startDate: '2025-02-01',
  workAuthorization: 'Yes',
  gender: 'Decline to self-identify',
  race: 'Decline to self-identify',
  veteranStatus: 'I am not a protected veteran',
  disabilityStatus: 'I do not wish to answer',
  education: {
    school: 'State University',
    degree: "Bachelor's",
    fieldOfStudy: 'Computer Science',
    gpa: '3.7',
    startDate: '2018-09-01',
    endDate: '2022-05-15',
  },
  resumePath: 'candidate/resume.pdf',
  coverLetter: 'Cover letter text',
};

function validateProfile(profile: CandidateProfile): { valid: boolean; errors: string[] } {
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

describe('Candidate Profile', () => {
  it('should validate a valid profile', () => {
    const result = validateProfile(mockProfile);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing required fields', () => {
    const incomplete = { ...mockProfile, email: '' };
    const result = validateProfile(incomplete);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect invalid email', () => {
    const badEmail = { ...mockProfile, email: 'not-an-email' };
    const result = validateProfile(badEmail);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('should have all education fields', () => {
    expect(mockProfile.education.school).toBeTruthy();
    expect(mockProfile.education.degree).toBeTruthy();
    expect(mockProfile.education.fieldOfStudy).toBeTruthy();
  });
});
