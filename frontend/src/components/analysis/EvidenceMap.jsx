import React, { useState } from 'react';
import { Map, Filter } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import MatchBadge from '../ui/MatchBadge';

export default function EvidenceMap({ evidenceMap = [] }) {
  const [filter, setFilter] = useState('all'); // all | strong | partial | missing

  const filtered = filter === 'all'
    ? evidenceMap
    : evidenceMap.filter(e => e.match_level === filter);

  const counts = {
    all: evidenceMap.length,
    strong: evidenceMap.filter(e => e.match_level === 'strong').length,
    partial: evidenceMap.filter(e => e.match_level === 'partial').length,
    missing: evidenceMap.filter(e => e.match_level === 'missing').length,
  };

  return (
    <Card>
      <CardHeader
        title="Evidence Map"
        subtitle="Requirement-by-requirement match with resume evidence"
        icon={Map}
      />

      {/* Filter bar */}
      <div className="flex gap-1.5 mb-5 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg w-fit">
        {['all', 'strong', 'partial', 'missing'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors duration-150
              ${filter === f
                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Evidence items */}
      <div className="space-y-3">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="border border-surface-200 dark:border-surface-700 rounded-xl p-4 space-y-2
                       hover:border-surface-300 dark:hover:border-surface-600 transition-colors"
          >
            {/* Requirement */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-surface-400">
                    Requirement
                  </span>
                  <MatchBadge level={item.match_level} />
                  {item.impact && (
                    <span className={`text-[10px] font-medium uppercase tracking-wider
                      ${item.impact === 'high' ? 'text-red-500' :
                        item.impact === 'medium' ? 'text-amber-500' : 'text-surface-400'}`}>
                      {item.impact} impact
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-surface-800 dark:text-surface-200">
                  {item.requirement}
                </p>
              </div>
            </div>

            {/* Evidence */}
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-surface-400">
                Evidence
              </span>
              {item.evidence ? (
                <div className="mt-1 p-2.5 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                  <p className="text-sm text-surface-700 dark:text-surface-300 italic">
                    "{item.evidence}"
                  </p>
                  {item.source && (
                    <p className="text-[10px] text-surface-400 mt-1 font-medium">
                      Source: {item.source}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-sm text-surface-400 italic">
                  No relevant evidence found in resume
                </p>
              )}
            </div>

            {/* Confidence */}
            {item.confidence != null && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-surface-400">
                  Confidence: {Math.round(item.confidence * 100)}%
                </span>
                <div className="w-16 h-1 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-500 rounded-full"
                    style={{ width: `${item.confidence * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-surface-400 text-center py-8">
          No requirements match this filter.
        </p>
      )}
    </Card>
  );
}
