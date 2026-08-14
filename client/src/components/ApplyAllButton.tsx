import { useState } from 'react';
import './ApplyAllButton.css';

interface ApplyAllButtonProps {
  unappliedCount: number;
  onApplyAll: () => Promise<void>;
  isRunning: boolean;
}

const ApplyAllButton = ({ unappliedCount, onApplyAll, isRunning }: ApplyAllButtonProps) => {
  const [confirming, setConfirming] = useState(false);

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setConfirming(false);
    await onApplyAll();
  };

  return (
    <button
      className={`apply-all-btn ${isRunning ? 'applying' : ''} ${confirming ? 'confirming' : ''}`}
      onClick={handleClick}
      disabled={isRunning || unappliedCount === 0}
      title={unappliedCount === 0 ? 'No unapplied jobs' : `Apply to ${unappliedCount} jobs`}
    >
      <span className="btn-icon">{isRunning ? '⏳' : confirming ? '⚠️' : '⚡'}</span>
      {isRunning
        ? 'Processing Jobs...'
        : confirming
        ? `Confirm Apply to ${unappliedCount}?`
        : `Apply to All (${unappliedCount})`}
    </button>
  );
};

export default ApplyAllButton;
