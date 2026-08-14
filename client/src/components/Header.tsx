import { useState, useEffect } from 'react';
import { api } from '../api';
import { CandidateProfile } from '../types';
import ProfileSettingsModal from './ProfileSettingsModal';
import './Header.css';

const Header = () => {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    api.getCandidate().then(setProfile).catch(() => {});
  }, []);

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-titles">
          <div className="live-indicator">
            <span className="dot"></span>
            <span className="live-text">System Live</span>
          </div>
          <h1 className="header-title">Greenhouse Application Dashboard</h1>
          <p className="header-subtitle">Automated Job Application System</p>
        </div>
        <div className="header-profile" onClick={() => setIsModalOpen(true)} style={{ cursor: 'pointer' }} title="Edit Profile">
          {profile ? (
            <div className="profile-badge">
              <span className="profile-name">{profile.firstName} {profile.lastName} &#9881;</span>
              <span className="profile-title">{profile.currentTitle}</span>
            </div>
          ) : (
            <div className="profile-badge loading-shimmer">
              Loading profile...
            </div>
          )}
        </div>
      </div>
      {isModalOpen && (
        <ProfileSettingsModal 
          initialProfile={profile} 
          onClose={() => setIsModalOpen(false)} 
          onSave={(newProfile) => setProfile(newProfile)} 
        />
      )}
    </header>
  );
};

export default Header;
