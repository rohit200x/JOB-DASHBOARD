import { Job } from '../types';
import './StatsBar.css';

interface StatsBarProps {
  jobs: Job[];
}

export default function StatsBar({ jobs }: StatsBarProps) {
  const stats = {
    total: jobs.length,
    not_applied: jobs.filter(j => j.status === 'not_applied').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    form_filled: jobs.filter(j => j.status === 'form_filled').length,
    review_page_reached: jobs.filter(j => j.status === 'review_page_reached').length,
    screenshot_captured: jobs.filter(j => j.status === 'screenshot_captured').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  return (
    <div className="stats-bar">
      <div className="stats-bar__item stats-bar__item--total">
        <span className="stats-bar__count">{stats.total}</span>
        <span className="stats-bar__label">Total Jobs</span>
      </div>
      <div className="stats-bar__item stats-bar__item--idle">
        <span className="stats-bar__count">{stats.not_applied}</span>
        <span className="stats-bar__label">Not Applied</span>
      </div>
      <div className="stats-bar__item stats-bar__item--progress">
        <span className="stats-bar__count">{stats.in_progress}</span>
        <span className="stats-bar__label">In Progress</span>
      </div>
      <div className="stats-bar__item stats-bar__item--filled">
        <span className="stats-bar__count">{stats.form_filled}</span>
        <span className="stats-bar__label">Form Filled</span>
      </div>
      <div className="stats-bar__item stats-bar__item--review">
        <span className="stats-bar__count">{stats.review_page_reached}</span>
        <span className="stats-bar__label">Review Reached</span>
      </div>
      <div className="stats-bar__item stats-bar__item--success">
        <span className="stats-bar__count">{stats.screenshot_captured}</span>
        <span className="stats-bar__label">Completed</span>
      </div>
      <div className="stats-bar__item stats-bar__item--failed">
        <span className="stats-bar__count">{stats.failed}</span>
        <span className="stats-bar__label">Failed</span>
      </div>
    </div>
  );
}
