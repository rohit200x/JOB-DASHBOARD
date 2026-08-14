import { useState, useEffect } from 'react';
import { CandidateProfile } from '../types';
import { api } from '../api';
import './ProfileSettingsModal.css';

interface ProfileSettingsModalProps {
  onClose: () => void;
  onSave: (profile: CandidateProfile) => void;
  initialProfile: CandidateProfile | null;
}

export default function ProfileSettingsModal({ onClose, onSave, initialProfile }: ProfileSettingsModalProps) {
  const [profile, setProfile] = useState<Partial<CandidateProfile>>(initialProfile || {});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleChange = (field: keyof CandidateProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (resumeFile) {
        await api.uploadResume(resumeFile);
      }
      const response = await api.updateCandidate(profile);
      onSave(response.profile);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <button className="profile-modal__close" onClick={onClose}>&#10005;</button>
        <h2 className="profile-modal__title">Candidate Profile Settings</h2>
        
        {error && (
          <div style={{ color: 'var(--red)', background: 'var(--red-light)', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div className="profile-form">
          <div className="profile-form__group">
            <label className="profile-form__label">First Name</label>
            <input className="profile-form__input" value={profile.firstName || ''} onChange={e => handleChange('firstName', e.target.value)} />
          </div>
          <div className="profile-form__group">
            <label className="profile-form__label">Last Name</label>
            <input className="profile-form__input" value={profile.lastName || ''} onChange={e => handleChange('lastName', e.target.value)} />
          </div>
          <div className="profile-form__group">
            <label className="profile-form__label">Email</label>
            <input className="profile-form__input" type="email" value={profile.email || ''} onChange={e => handleChange('email', e.target.value)} />
          </div>
          <div className="profile-form__group">
            <label className="profile-form__label">Phone</label>
            <input className="profile-form__input" value={profile.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
          </div>
          <div className="profile-form__group">
            <label className="profile-form__label">Current Title</label>
            <input className="profile-form__input" value={profile.currentTitle || ''} onChange={e => handleChange('currentTitle', e.target.value)} />
          </div>
          <div className="profile-form__group">
            <label className="profile-form__label">Location</label>
            <input className="profile-form__input" value={profile.location || ''} onChange={e => handleChange('location', e.target.value)} />
          </div>
          <div className="profile-form__group profile-form__full-width">
            <label className="profile-form__label">LinkedIn URL</label>
            <input className="profile-form__input" value={profile.linkedinUrl || ''} onChange={e => handleChange('linkedinUrl', e.target.value)} />
          </div>
          <div className="profile-form__group profile-form__full-width">
            <label className="profile-form__label">GitHub / Website URL</label>
            <input className="profile-form__input" value={profile.websiteUrl || ''} onChange={e => handleChange('websiteUrl', e.target.value)} />
          </div>
          <div className="profile-form__group profile-form__full-width">
            <label className="profile-form__label">Upload New Resume (PDF)</label>
            <input 
              type="file" 
              accept=".pdf,application/pdf" 
              className="profile-form__file"
              onChange={e => setResumeFile(e.target.files?.[0] || null)}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Leave blank to keep current resume. The file will be uploaded securely and used for future automated applications.
            </span>
          </div>

          <div className="profile-form__actions">
            <button className="profile-form__btn profile-form__btn--cancel" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button className="profile-form__btn profile-form__btn--save" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
