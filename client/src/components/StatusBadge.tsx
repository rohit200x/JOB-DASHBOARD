import { JobStatus } from '../types';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: JobStatus;
}

const statusConfig: Record<JobStatus, { label: string; className: string; icon: string }> = {
  not_applied: { label: 'Not Applied', className: 'status--gray', icon: '○' },
  in_progress: { label: 'In Progress', className: 'status--blue pulse', icon: '↻' },
  form_filled: { label: 'Form Filled', className: 'status--indigo', icon: '✓' },
  review_page_reached: { label: 'Review Reached', className: 'status--purple', icon: '👁' },
  screenshot_captured: { label: 'Applied (Screenshot)', className: 'status--green', icon: '★' },
  failed: { label: 'Failed', className: 'status--red', icon: '!' },
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <div className={`status-badge ${config.className}`}>
      <span className="status-icon">{config.icon}</span>
      <span className="status-label">{config.label}</span>
    </div>
  );
};

export default StatusBadge;
