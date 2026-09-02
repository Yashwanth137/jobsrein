import React from 'react';

export default function ScoreRing({ score, size = 120, strokeWidth = 8, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  const getColor = (s) => {
    if (s >= 75) return '#10b981';  // emerald
    if (s >= 50) return '#f59e0b';  // amber
    return '#ef4444';               // red
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          className="stroke-surface-200 dark:stroke-surface-700"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${getColor(score)}40)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-3xl font-bold text-surface-900 dark:text-surface-100 font-mono">
          {score}
        </span>
        <span className="text-xs text-surface-500 font-medium">/ 100</span>
      </div>
      {label && (
        <span className="text-sm font-medium text-surface-600 dark:text-surface-400">{label}</span>
      )}
    </div>
  );
}
