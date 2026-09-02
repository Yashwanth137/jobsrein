import React, { useRef, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';

export default function ResumeUpload({ onUpload, loading, currentFilename }) {
  const fileRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file) => {
    if (file && file.type === 'application/pdf') {
      onUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader
        title="Upload Resume"
        subtitle="Upload your resume as a PDF"
        icon={FileText}
      />

      <div
        onClick={() => !loading && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
                   transition-colors duration-200
          ${dragActive
            ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/30'
            : 'border-surface-300 dark:border-surface-600 hover:border-accent-400 hover:bg-surface-50 dark:hover:bg-surface-800/50'
          }
          ${loading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
            <p className="text-sm text-surface-600 dark:text-surface-400">Parsing resume...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-surface-400" />
            <div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Drop your PDF here or click to browse
              </p>
              <p className="text-xs text-surface-400 mt-1">PDF files only</p>
            </div>
          </div>
        )}
      </div>

      {currentFilename && !loading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-accent-600 dark:text-accent-400">
          <FileText className="w-4 h-4" />
          <span className="font-medium">{currentFilename}</span>
          <span className="text-surface-400">— parsed successfully</span>
        </div>
      )}
    </Card>
  );
}
