import React, { useState, useEffect } from 'react';
import { useApplications, useApplication } from '../hooks/useApplications';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import JobInput from '../components/job/JobInput';
import JobRequirements from '../components/job/JobRequirements';
import ResumeUpload from '../components/resume/ResumeUpload';
import ResumePreview from '../components/resume/ResumePreview';
import ScoreOverview from '../components/analysis/ScoreOverview';
import EvidenceMap from '../components/analysis/EvidenceMap';
import RecommendationList from '../components/analysis/RecommendationList';
import { Skeleton } from '../components/ui/EmptyState';
import { Loader2 } from 'lucide-react';

export default function MainApp() {
  const { applications, loading: appsLoading, createApplication, deleteApplication } = useApplications();
  const [activeAppId, setActiveAppId] = useState(null);

  // When applications load for the first time, select the most recent one if none selected
  useEffect(() => {
    if (!appsLoading && applications.length > 0 && !activeAppId) {
      setActiveAppId(applications[0].id);
    }
  }, [applications, appsLoading, activeAppId]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          applications={applications}
          activeId={activeAppId}
          onSelect={setActiveAppId}
          onNew={() => setActiveAppId('new')}
          onDelete={async (id) => {
            await deleteApplication(id);
            if (activeAppId === id) setActiveAppId(null);
          }}
        />
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="absolute inset-0">
            {activeAppId === 'new' ? (
              <NewAnalysisFlow
                onCreate={async (data) => {
                  const newApp = await createApplication(data);
                  setActiveAppId(newApp.id);
                }}
              />
            ) : activeAppId ? (
              <ApplicationDetail appId={activeAppId} />
            ) : (
              <div className="flex items-center justify-center h-full text-surface-400">
                Select an application or start a new analysis
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function NewAnalysisFlow({ onCreate }) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          New Analysis
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Start by providing the job description you want to target.
        </p>
      </div>
      <JobInput
        loading={loading}
        onSubmit={async (data) => {
          setLoading(true);
          try {
            await onCreate(data);
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
}

function ApplicationDetail({ appId }) {
  const {
    application, loading, uploadResume, updateJob, runAnalysis, updateRecommendation
  } = useApplication(appId);

  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!application) {
    return <div className="p-8 text-center text-red-500">Application not found</div>;
  }

  const { job_parsed, resume_parsed, resume_filename, analysis_result } = application;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await runAnalysis();
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10 pb-32">
      {/* 1. Job Requirements */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
            1. Target Job
          </h2>
        </div>
        <JobRequirements jobParsed={job_parsed} onUpdate={updateJob} />
      </section>

      {/* 2. Resume */}
      <section>
        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-4">
          2. Your Resume
        </h2>
        {!resume_parsed ? (
          <ResumeUpload
            loading={uploading}
            currentFilename={resume_filename}
            onUpload={async (file) => {
              setUploading(true);
              try {
                await uploadResume(file);
              } finally {
                setUploading(false);
              }
            }}
          />
        ) : (
          <div className="space-y-4">
            <ResumePreview resumeParsed={resume_parsed} />
            <div className="flex justify-end">
              <label className="btn-secondary cursor-pointer text-xs">
                Upload different resume
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files[0]) {
                      setUploading(true);
                      try {
                        await uploadResume(e.target.files[0]);
                      } finally {
                        setUploading(false);
                      }
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </section>

      {/* 3. Analysis */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
            3. Fit Analysis
          </h2>
          {job_parsed && resume_parsed && !analysis_result && (
            <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary">
              {analyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                'Run Analysis'
              )}
            </button>
          )}
        </div>

        {analyzing && (
          <div className="p-12 text-center border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800/50">
            <Loader2 className="w-8 h-8 text-accent-500 animate-spin mx-auto mb-4" />
            <p className="text-surface-700 dark:text-surface-300 font-medium">Analyzing your resume against the job requirements...</p>
            <p className="text-sm text-surface-500 mt-2">This usually takes 15-30 seconds. We are running deterministic matching and LLM evidence interpretation.</p>
          </div>
        )}

        {analysis_result && !analyzing && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-end">
              <button onClick={handleAnalyze} className="btn-secondary text-xs py-1.5 px-3">
                Rerun Analysis
              </button>
            </div>
            <ScoreOverview analysis={analysis_result} />
            <RecommendationList
              recommendations={analysis_result.recommendations}
              onUpdateStatus={updateRecommendation}
            />
            <EvidenceMap evidenceMap={analysis_result.evidence_map} />
          </div>
        )}

        {!analysis_result && !analyzing && (!job_parsed || !resume_parsed) && (
          <div className="p-8 text-center border border-dashed border-surface-300 dark:border-surface-700 rounded-xl">
            <p className="text-surface-500">Provide both a job and a resume to run the analysis.</p>
          </div>
        )}
      </section>
    </div>
  );
}
