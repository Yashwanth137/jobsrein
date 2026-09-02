import React from 'react';

const VARIANTS = {
  strong: { label: 'Strong', classes: 'badge-strong' },
  partial: { label: 'Partial', classes: 'badge-partial' },
  missing: { label: 'Missing', classes: 'badge-missing' },
};

export default function MatchBadge({ level }) {
  const variant = VARIANTS[level] || VARIANTS.missing;
  return (
    <span className={`badge ${variant.classes}`}>
      {variant.label}
    </span>
  );
}
