import { useEffect, useState } from 'react';
import { Job } from '../types';
import { api } from '../api';
import './ScreenshotModal.css';

interface ScreenshotModalProps {
  job: Job;
  onClose: () => void;
}

export default function ScreenshotModal({ job, onClose }: ScreenshotModalProps) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="screenshot-modal" onClick={onClose}>
      <div className="screenshot-modal__content" onClick={e => e.stopPropagation()}>
        <button className="screenshot-modal__close" onClick={onClose}>&#10005;</button>
        <h3 className="screenshot-modal__title">{job.title}</h3>
        <p className="screenshot-modal__subtitle">Application Screenshot Evidence</p>
        <div
          className={`screenshot-modal__image-wrapper ${zoomed ? 'screenshot-modal__image-wrapper--zoomed' : ''}`}
          onClick={() => setZoomed(!zoomed)}
        >
          <img src={api.getScreenshotUrl(job.id)} alt={`Screenshot for ${job.title}`} />
        </div>
        <p className="screenshot-modal__hint">{zoomed ? 'Click to zoom out' : 'Click image to zoom in'}</p>
      </div>
    </div>
  );
}
