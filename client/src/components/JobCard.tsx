import { Job } from '../types';
import StatusBadge from './StatusBadge';
import { api } from '../api';
import './JobCard.css';

interface JobCardProps {
  job: Job;
  onApply: (id: string) => void;
  onReset: (id: string) => void;
  onViewDetail: (job: Job) => void;
  onViewScreenshot: (job: Job) => void;
}

export default function JobCard({ job, onApply, onReset, onViewDetail, onViewScreenshot }: JobCardProps) {
  const isApplyable = job.status === 'not_applied' || job.status === 'failed';
  const isResettable = job.status === 'failed' || job.status === 'screenshot_captured';
  const hasScreenshot = !!job.screenshot_path;
  const isProcessing = job.status === 'in_progress' || job.status === 'form_filled' || job.status === 'review_page_reached';

  return (
    <div className={`job-card ${isProcessing ? 'job-card--processing' : ''}`}>
      <div className="job-card__header">
        <span className="job-card__company">{job.company}</span>
        <StatusBadge status={job.status} />
      </div>
      <h3 className="job-card__title" onClick={() => onViewDetail(job)}>{job.title}</h3>
      <div className="job-card__meta">
        <span className="job-card__meta-item">&#128205; {job.location}</span>
        <span className="job-card__meta-item">&#127970; {job.department}</span>
        <span className="job-card__meta-item">&#128279; {job.source}</span>
      </div>
      {job.description && (
        <p className="job-card__description" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {job.description}
        </p>
      )}
      {job.failure_reason && (
        <div className="job-card__error">
          {job.failure_reason.substring(0, 100)}{job.failure_reason.length > 100 ? '...' : ''}
        </div>
      )}
      {hasScreenshot && (
        <div className="job-card__screenshot-thumb" onClick={() => onViewScreenshot(job)}>
          <img src={api.getScreenshotUrl(job.id)} alt="Screenshot" />
          <span className="job-card__screenshot-label">View Screenshot</span>
        </div>
      )}
      <div className="job-card__actions">
        <button className="job-card__btn job-card__btn--detail" onClick={() => onViewDetail(job)}>Details</button>
        <a href={job.url} target="_blank" rel="noopener noreferrer" className="job-card__btn job-card__btn--link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}>View Job</a>
        {isApplyable && (
          <button className="job-card__btn job-card__btn--apply" onClick={() => onApply(job.id)}>Apply</button>
        )}
        {isResettable && (
          <button className="job-card__btn job-card__btn--reset" onClick={() => onReset(job.id)}>Reset</button>
        )}
      </div>
    </div>
  );
}
