import { useState, useEffect, useCallback } from 'react';
import { Job } from '../types';
import { api } from '../api';
import { useNotification } from './Notification';
import StatsBar from './StatsBar';
import SearchBar from './SearchBar';
import JobCard from './JobCard';
import JobDetail from './JobDetail';
import ApplyAllButton from './ApplyAllButton';
import ScreenshotModal from './ScreenshotModal';
import './Dashboard.css';

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [screenshotJob, setScreenshotJob] = useState<Job | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const { showNotification } = useNotification();

  const fetchJobs = useCallback(async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  // SSE for real-time updates
  useEffect(() => {
    let sse: EventSource | null = null;
    try {
      sse = api.getStatusStream();
      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setJobs(prev => prev.map(j =>
            j.id === data.jobId
              ? { ...j, status: data.status, failure_reason: data.failureReason, screenshot_path: data.screenshotPath || j.screenshot_path }
              : j
          ));
          if (data.status === 'screenshot_captured') {
            showNotification('Application screenshot captured!', 'success');
          } else if (data.status === 'failed') {
            showNotification(`Failed: ${(data.failureReason || 'Unknown').substring(0, 60)}`, 'error');
          }
        } catch { /* ignore parse errors */ }
      };
      sse.onerror = () => { /* SSE will auto-reconnect */ };
    } catch { /* ignore SSE connection errors */ }
    return () => { if (sse) sse.close(); };
  }, [showNotification]);

  // Initial fetch and polling fallback
  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  // Apply filters
  useEffect(() => {
    let result = jobs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(j => j.status === statusFilter);
    }
    setFilteredJobs(result);
  }, [jobs, searchQuery, statusFilter]);

  const handleApply = async (jobId: string) => {
    try {
      await api.applyToJob(jobId);
      showNotification('Application automation started...', 'info');
    } catch {
      showNotification('Failed to start application', 'error');
    }
  };

  const handleReset = async (jobId: string) => {
    try {
      await api.resetJob(jobId);
      setJobs(prev => prev.map(j =>
        j.id === jobId ? { ...j, status: 'not_applied', failure_reason: null, screenshot_path: null, applied_at: null } : j
      ));
      showNotification('Job status reset', 'info');
    } catch {
      showNotification('Failed to reset job', 'error');
    }
  };

  const handleApplyAll = async () => {
    setIsApplyingAll(true);
    try {
      const result = await api.applyToAll();
      showNotification(`Apply to All started for ${result.count} jobs`, 'info');
    } catch {
      showNotification('Failed to start Apply to All', 'error');
    }
    setTimeout(() => setIsApplyingAll(false), 300000);
  };

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const result = await api.triggerScrape();
      showNotification(`Scraped ${result.count} jobs successfully`, 'success');
      await fetchJobs();
    } catch {
      showNotification('Failed to scrape jobs', 'error');
    }
    setIsScraping(false);
  };

  const unappliedCount = jobs.filter(j => j.status === 'not_applied').length;
  const processingCount = jobs.filter(j => ['in_progress', 'form_filled', 'review_page_reached'].includes(j.status)).length;

  useEffect(() => {
    if (processingCount === 0 && isApplyingAll) {
      const timer = setTimeout(() => setIsApplyingAll(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [processingCount, isApplyingAll]);

  return (
    <div className="dashboard">
      <StatsBar jobs={jobs} />
      <div className="dashboard__toolbar">
        <SearchBar
          onSearch={setSearchQuery}
          onStatusFilter={setStatusFilter}
          onScrape={handleScrape}
          isScraping={isScraping}
        />
        <ApplyAllButton
          unappliedCount={unappliedCount}
          onApplyAll={handleApplyAll}
          isRunning={isApplyingAll}
        />
      </div>
      {loading ? (
        <div className="dashboard__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton dashboard__skeleton-card"></div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon">&#128203;</div>
          <h3>No Jobs Found</h3>
          <p>{jobs.length === 0
            ? 'Click "Scrape Jobs" to fetch job listings from Greenhouse'
            : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="dashboard__grid">
          {filteredJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onApply={handleApply}
              onReset={handleReset}
              onViewDetail={setSelectedJob}
              onViewScreenshot={setScreenshotJob}
            />
          ))}
        </div>
      )}
      {selectedJob && (
        <JobDetail
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={handleApply}
          onReset={handleReset}
          onViewScreenshot={setScreenshotJob}
        />
      )}
      {screenshotJob && (
        <ScreenshotModal
          job={screenshotJob}
          onClose={() => setScreenshotJob(null)}
        />
      )}
    </div>
  );
}
