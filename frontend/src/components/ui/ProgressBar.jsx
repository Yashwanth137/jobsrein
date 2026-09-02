import React from 'react';

export default function ProgressBar({ value, max = 100, label, showPercent = true, size = 'md' }) {
  const percent = Math.round((value / max) * 100);

  const getColor = (p) => {
    if (p >= 75) return 'bg-match-strong';
    if (p >= 50) return 'bg-match-partial';
    return 'bg-match-missing';
  };

  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div className="space-y-1.5">
      {(label || showPercent) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {label}
            </span>
          )}
          {showPercent && (
            <span className="text-sm font-mono font-medium text-surface-500 dark:text-surface-400">
              {percent}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${heights[size]} bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden`}>
        <div
          className={`${heights[size]} ${getColor(percent)} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
