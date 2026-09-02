import React, { useState } from 'react';
import { Check, X, Edit3, Save } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';

function SkillTagList({ skills, label, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');

  const removeSkill = (idx) => {
    const updated = skills.filter((_, i) => i !== idx);
    onUpdate(updated);
  };

  const addSkill = () => {
    const trimmed = input.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onUpdate([...skills, trimmed]);
      setInput('');
    }
  };

  return (
    <div>
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
                       bg-accent-50 dark:bg-accent-950 text-accent-700 dark:text-accent-300
                       border border-accent-200 dark:border-accent-800"
          >
            {skill}
            {editing && (
              <button onClick={() => removeSkill(idx)} className="hover:text-red-500 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
        {editing && (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="Add..."
            className="px-2 py-1 text-xs rounded-lg border border-dashed border-surface-300 dark:border-surface-600
                       bg-transparent w-20 focus:w-32 transition-all outline-none
                       focus:border-accent-500"
          />
        )}
      </div>
      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="mt-2 text-xs text-accent-600 hover:text-accent-700 flex items-center gap-1"
        >
          <Edit3 className="w-3 h-3" /> Edit
        </button>
      )}
      {editing && (
        <button
          onClick={() => setEditing(false)}
          className="mt-2 text-xs text-accent-600 hover:text-accent-700 flex items-center gap-1"
        >
          <Save className="w-3 h-3" /> Done
        </button>
      )}
    </div>
  );
}

function StringList({ items, label }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
            <Check className="w-3.5 h-3.5 text-accent-500 mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function JobRequirements({ jobParsed, onUpdate }) {
  if (!jobParsed) return null;

  const updateField = (field) => (value) => {
    onUpdate({ ...jobParsed, [field]: value });
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader
        title={jobParsed.title || 'Job Requirements'}
        subtitle={[jobParsed.company, jobParsed.seniority, jobParsed.location, jobParsed.work_arrangement]
          .filter(Boolean).join(' · ')}
      />

      <div className="space-y-5">
        {/* Editable skill lists */}
        <SkillTagList
          skills={jobParsed.required_skills || []}
          label="Required Skills"
          onUpdate={updateField('required_skills')}
        />
        <SkillTagList
          skills={jobParsed.preferred_skills || []}
          label="Preferred Skills"
          onUpdate={updateField('preferred_skills')}
        />

        {/* Read-only lists */}
        <StringList items={jobParsed.responsibilities} label="Responsibilities" />
        <StringList items={jobParsed.qualifications} label="Qualifications" />

        {/* Single-value fields */}
        <div className="grid grid-cols-2 gap-4">
          {jobParsed.experience_requirements && (
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                Experience
              </p>
              <p className="text-sm text-surface-700 dark:text-surface-300">{jobParsed.experience_requirements}</p>
            </div>
          )}
          {jobParsed.education_requirements && (
            <div>
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">
                Education
              </p>
              <p className="text-sm text-surface-700 dark:text-surface-300">{jobParsed.education_requirements}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
