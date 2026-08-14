import { useEffect } from 'react';
import { Job } from '../types';
import StatusBadge from './StatusBadge';
import { api } from '../api';
import './JobDetail.css';

interface JobDetailProps {
  job: Job;
  onClose: () => void;
  onApply: (id: string) => void;
  onReset: (id: string) => void;
  onViewScreenshot: (job: Job) => void;
}

export default function JobDetail({ job, onClose, onApply, onReset, onViewScreenshot }: JobDetailProps) {
  const isApplyable = job.status === 'not_applied' || job.status === 'failed';
  const isResettable = job.status === 'failed' || job.status === 'screenshot_captured';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="job-detail-overlay" onClick={onClose}>
      <div className="job-detail" onClick={e => e.stopPropagation()}>
        <button className="job-detail__close" onClick={onClose}>&#10005;</button>
        <div className="job-detail__header">
          <span className="job-detail__company">{job.company}</span>
          <StatusBadge status={job.status} />
        </div>
        <h2 className="job-detail__title">{job.title}</h2>
        {job.description && (
          <p className="job-detail__description" style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
            {job.description}
          </p>
        )}
        <div className="job-detail__info-grid">
          <div className="job-detail__info-item">
            <span className="job-detail__info-label">Location</span>
            <span className="job-detail__info-value">{job.location}</span>
          </div>
          <div className="job-detail__info-item">
            <span className="job-detail__info-label">Department</span>
            <span className="job-detail__info-value">{job.department}</span>
          </div>
          <div className="job-detail__info-item">
            <span className="job-detail__info-label">Source</span>
            <span className="job-detail__info-value">{job.source}</span>
          </div>
          <div className="job-detail__info-item">
            <span className="job-detail__info-label">Job URL</span>
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="job-detail__link">
              Open on Greenhouse &#8599;
            </a>
          </div>
          {job.applied_at && (
            <div className="job-detail__info-item">
              <span className="job-detail__info-label">Applied At</span>
              <span className="job-detail__info-value">{new Date(job.applied_at).toLocaleString()}</span>
            </div>
          )}
        </div>
        {job.failure_reason && (
          <div className="job-detail__error">
            <strong>Failure Reason:</strong> {job.failure_reason}
          </div>
        )}
        {job.screenshot_path && (
          <div className="job-detail__screenshot">
            <h3>Screenshot Evidence</h3>
            <div className="job-detail__screenshot-container" onClick={() => onViewScreenshot(job)}>
              <img src={api.getScreenshotUrl(job.id)} alt={`Screenshot for ${job.title}`} />
              <span className="job-detail__screenshot-hint">Click to enlarge</span>
            </div>
          </div>
        )}
        <div className="job-detail__actions">
          {isApplyable && (
            <button className="job-detail__btn job-detail__btn--apply" onClick={() => { onApply(job.id); onClose(); }}>
              Start Application
            </button>
          )}
          {isResettable && (
            <button className="job-detail__btn job-detail__btn--reset" onClick={() => { onReset(job.id); onClose(); }}>
              Reset Status
            </button>
          )}
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="job-detail__btn job-detail__btn--link">
            View on Greenhouse &#8599;
          </a>
        </div>
      </div>
    </div>
  );
}
