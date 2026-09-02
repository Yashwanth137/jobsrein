import React from 'react';

export default function Card({ children, className = '', hover = false, padding = 'p-6' }) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${padding} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-accent-50 dark:bg-accent-950 flex items-center justify-center">
            <Icon className="w-5 h-5 text-accent-600 dark:text-accent-400" />
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-surface-500 dark:text-surface-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
