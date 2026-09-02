import React from 'react';
import { Target, Info } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import ScoreRing from '../ui/ScoreRing';
import ProgressBar from '../ui/ProgressBar';

const DIMENSION_LABELS = {
  skills: 'Skills Match',
  experience: 'Experience Match',
  responsibilities: 'Responsibility Match',
  projects: 'Project / Evidence',
  education: 'Education / Qualifications',
  keywords: 'Keyword Coverage',
};

export default function ScoreOverview({ analysis }) {
  if (!analysis) return null;

  const { overall_score, dimensions, evidence_map, methodology, summary } = analysis;

  const strongCount = evidence_map.filter(e => e.match_level === 'strong').length;
  const partialCount = evidence_map.filter(e => e.match_level === 'partial').length;
  const missingCount = evidence_map.filter(e => e.match_level === 'missing').length;
  const totalReqs = evidence_map.length;

  return (
    <Card>
      <CardHeader title="Job Match Analysis" icon={Target} />

      {/* Main score + summary */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
        <div className="relative">
          <ScoreRing score={overall_score} size={140} strokeWidth={10} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <p className="text-lg font-semibold text-surface-800 dark:text-surface-200 mb-3">
            {summary}
          </p>
          <div className="flex flex-wrap gap-4">
            <StatPill color="bg-match-strong" label="Strong" count={strongCount} />
            <StatPill color="bg-match-partial" label="Partial" count={partialCount} />
            <StatPill color="bg-match-missing" label="Missing" count={missingCount} />
            <StatPill color="bg-surface-400" label="Total" count={totalReqs} />
          </div>
        </div>
      </div>

      {/* Dimension breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">
          Score Breakdown
        </h4>
        <div className="space-y-3">
          {Object.entries(dimensions).map(([key, value]) => (
            <ProgressBar
              key={key}
              value={value}
              label={DIMENSION_LABELS[key] || key}
            />
          ))}
        </div>
      </div>

      {/* Methodology note */}
      {methodology && (
        <div className="mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
          <button
            className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
            onClick={(e) => {
              const detail = e.currentTarget.nextElementSibling;
              detail.classList.toggle('hidden');
            }}
          >
            <Info className="w-3.5 h-3.5" />
            How this score was computed
          </button>
          <div className="hidden mt-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 text-xs text-surface-500 dark:text-surface-400 font-mono space-y-1">
            <p>Model: v{methodology.version}</p>
            <p>Formula: (strong×1.0 + partial×0.5) / total × 100 per dimension</p>
            <p>Overall: weighted average of dimension scores</p>
            <p>Weights: {Object.entries(methodology.weights).map(([k, v]) => `${k}=${v}`).join(', ')}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function StatPill({ color, label, count }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-sm text-surface-600 dark:text-surface-400">
        <span className="font-semibold font-mono">{count}</span> {label}
      </span>
    </div>
  );
}
