import React from 'react';
import { Check, X, Lightbulb, ArrowRight } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import DiffBlock from '../ui/DiffBlock';

const CATEGORY_META = {
  already_demonstrated: {
    label: 'Already Demonstrated',
    description: 'Evidence exists but could be stated more clearly',
    icon: Check,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  possibly_relevant: {
    label: 'Possibly Relevant',
    description: 'Adjacent experience that could be reframed',
    icon: Lightbulb,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  missing: {
    label: 'Genuinely Missing',
    description: 'No evidence found — do not add false claims',
    icon: X,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
  },
};

export default function RecommendationList({ recommendations = [], onUpdateStatus }) {
  if (!recommendations.length) return null;

  // Group by category
  const grouped = {};
  recommendations.forEach((rec, idx) => {
    const cat = rec.category || 'missing';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...rec, _index: idx });
  });

  return (
    <Card>
      <CardHeader
        title="Recommendations"
        subtitle={`${recommendations.length} improvement suggestions`}
        icon={Lightbulb}
      />

      <div className="space-y-6">
        {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
          const items = grouped[catKey];
          if (!items?.length) return null;

          return (
            <div key={catKey}>
              {/* Category header */}
              <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${meta.bg}`}>
                <meta.icon className={`w-4 h-4 ${meta.color}`} />
                <div>
                  <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                  <span className="text-xs text-surface-500 ml-2">
                    ({items.length}) — {meta.description}
                  </span>
                </div>
              </div>

              {/* Recommendation cards */}
              <div className="space-y-3 ml-2">
                {items.map((rec) => (
                  <div
                    key={rec._index}
                    className="border border-surface-200 dark:border-surface-700 rounded-xl p-4 space-y-3"
                  >
                    {/* Requirement target */}
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                      <span className="text-xs font-mono text-surface-400 uppercase tracking-wider">
                        For:
                      </span>
                      <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                        {rec.requirement}
                      </span>
                    </div>

                    {/* Diff block (only for non-missing) */}
                    {(rec.current_text || rec.suggested_text) && (
                      <DiffBlock current={rec.current_text} suggested={rec.suggested_text} />
                    )}

                    {/* Rationale */}
                    <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                      {rec.rationale}
                    </p>

                    {/* Approve / Reject buttons (for non-missing only) */}
                    {rec.category !== 'missing' && (
                      <div className="flex items-center gap-2 pt-1">
                        {rec.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => onUpdateStatus(rec._index, 'approved')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                                         rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600
                                         dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800
                                         hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => onUpdateStatus(rec._index, 'rejected')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                                         rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500
                                         border border-surface-200 dark:border-surface-700
                                         hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                            >
                              <X className="w-3 h-3" /> Dismiss
                            </button>
                          </>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                            rec.status === 'approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
                          }`}>
                            {rec.status === 'approved' ? '✓ Approved' : '✗ Dismissed'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
