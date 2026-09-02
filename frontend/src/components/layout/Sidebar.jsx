import React from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function getScoreColor(score) {
  if (score == null) return 'text-surface-400';
  if (score >= 75) return 'text-match-strong';
  if (score >= 50) return 'text-match-partial';
  return 'text-match-missing';
}

export default function Sidebar({
  applications = [],
  activeId,
  onSelect,
  onNew,
  onDelete,
}) {
  return (
    <aside className="w-72 shrink-0 border-r border-surface-200 dark:border-surface-700
                      bg-surface-50 dark:bg-surface-900 flex flex-col h-full">
      {/* New Analysis button */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <button onClick={onNew} className="btn-primary w-full text-sm">
          <Plus className="w-4 h-4" />
          New Analysis
        </button>
      </div>

      {/* Application list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        <AnimatePresence>
          {applications.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              layout
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(app.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(app.id);
                  }
                }}
                className={`w-full text-left rounded-xl px-3 py-3 group cursor-pointer transition-colors duration-150 select-none
                  ${activeId === app.id
                    ? 'bg-accent-50 dark:bg-accent-950/50 border border-accent-200 dark:border-accent-800'
                    : 'hover:bg-surface-100 dark:hover:bg-surface-800 border border-transparent'
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-surface-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
                        {app.job_title || 'Untitled'}
                      </p>
                      <p className="text-xs text-surface-500 truncate">
                        {app.company || 'No company'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(app.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-1.5 ml-6">
                  {app.overall_score != null ? (
                    <span className={`text-xs font-mono font-bold ${getScoreColor(app.overall_score)}`}>
                      {app.overall_score}% match
                    </span>
                  ) : (
                    <span className="text-xs text-surface-400">No analysis</span>
                  )}
                  <span className="text-[10px] text-surface-400">
                    {formatTimeAgo(app.updated_at)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {applications.length === 0 && (
          <div className="text-center py-12 px-4">
            <FileText className="w-8 h-8 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
            <p className="text-sm text-surface-400">No applications yet</p>
            <p className="text-xs text-surface-400 mt-1">Click "New Analysis" to start</p>
          </div>
        )}
      </div>
    </aside>
  );
}
