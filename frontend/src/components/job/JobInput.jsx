import React, { useState } from 'react';
import { Link2, FileText, Loader2 } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';

export default function JobInput({ onSubmit, loading }) {
  const [mode, setMode] = useState('text'); // 'text' | 'url'
  const [jobText, setJobText] = useState('');
  const [jobUrl, setJobUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'text' && jobText.trim()) {
      onSubmit({ job_text: jobText.trim() });
    } else if (mode === 'url' && jobUrl.trim()) {
      onSubmit({ job_url: jobUrl.trim() });
    }
  };

  const isValid = mode === 'text' ? jobText.trim().length > 50 : jobUrl.trim().length > 10;

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader
        title="Add Job Description"
        subtitle="Paste the job description text or provide a URL"
        icon={FileText}
      />

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg mb-5 w-fit">
        <button
          onClick={() => setMode('text')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150
            ${mode === 'text'
              ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
              : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
        >
          <FileText className="w-3.5 h-3.5 inline mr-1.5" />
          Paste Text
        </button>
        <button
          onClick={() => setMode('url')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150
            ${mode === 'url'
              ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
              : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
        >
          <Link2 className="w-3.5 h-3.5 inline mr-1.5" />
          Job URL
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'text' ? (
          <div className="space-y-2">
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={12}
              className="input-base resize-none font-mono text-xs leading-relaxed"
            />
            <div className="flex justify-between text-xs text-surface-400">
              <span>{jobText.length > 50 ? '✓ Sufficient content' : 'Minimum 50 characters'}</span>
              <span>{jobText.length.toLocaleString()} chars</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://jobs.example.com/posting/12345"
              className="input-base"
            />
            <p className="text-xs text-surface-400">
              We'll attempt to extract the job description from the URL.
              If extraction fails, you'll be asked to paste the text directly.
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={!isValid || loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing...
              </>
            ) : (
              'Parse Job Description'
            )}
          </button>
        </div>
      </form>
    </Card>
  );
}
