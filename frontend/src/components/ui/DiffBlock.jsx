import React from 'react';

export default function DiffBlock({ current, suggested }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {current && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-3">
          <span className="text-xs font-mono font-medium text-red-500 dark:text-red-400 uppercase tracking-wider">
            Current
          </span>
          <p className="mt-1.5 text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
            {current}
          </p>
        </div>
      )}
      {suggested && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
          <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Suggested
          </span>
          <p className="mt-1.5 text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
            {suggested}
          </p>
        </div>
      )}
    </div>
  );
}
