import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileSearch, ArrowRight, Check, X, Lightbulb,
  FileText, Upload, BarChart3, ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-600 flex items-center justify-center">
              <FileSearch className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-surface-900 dark:text-surface-100 text-sm">
              Resume Intelligence
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-colors">
              Sign in
            </Link>
            <Link to="/login" className="btn-primary text-sm py-2 px-4">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
              <span className="text-xs font-medium text-accent-700 dark:text-accent-300">
                Evidence-based analysis
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-surface-900 dark:text-surface-100 leading-[1.1] tracking-tight mb-6">
              Know exactly how your
              <br />
              <span className="text-accent-600 dark:text-accent-400">resume fits the job.</span>
            </h1>

            <p className="text-lg text-surface-500 dark:text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Paste a job description or job link. Upload your resume. Get an evidence-based
              analysis of your match, gaps, and the changes worth making before you apply.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/login" className="btn-primary px-8 py-3 text-base">
                Analyze My Resume
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#example" className="btn-secondary px-6 py-3 text-base">
                See Example Analysis
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-6 border-t border-surface-200 dark:border-surface-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-600 dark:text-accent-400 mb-2">
              How it works
            </h2>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              Three steps to understand your fit
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FileText, step: '01', title: 'Add the Job', desc: 'Paste the job description or provide a URL. We extract and structure every requirement.' },
              { icon: Upload, step: '02', title: 'Upload Your Resume', desc: 'Upload your PDF resume. We parse it into structured sections and verify with you.' },
              { icon: BarChart3, step: '03', title: 'Get Your Analysis', desc: 'Requirement-by-requirement evidence mapping, transparent scoring, and specific improvements.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: parseFloat(step) * 0.1 }}
                className="card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-950 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                  </div>
                  <span className="text-xs font-mono font-bold text-surface-400">{step}</span>
                </div>
                <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Example Evidence ── */}
      <section id="example" className="py-20 px-6 bg-surface-100/50 dark:bg-surface-900/50 border-t border-surface-200 dark:border-surface-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-600 dark:text-accent-400 mb-2">
              Evidence-first analysis
            </h2>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              Every recommendation is traceable
            </p>
          </div>

          <div className="space-y-4">
            {/* Strong match example */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-surface-400 uppercase">Requirement</span>
                <span className="badge badge-strong">Strong</span>
              </div>
              <p className="text-sm font-medium text-surface-800 dark:text-surface-200 mb-3">
                Python + FastAPI backend experience
              </p>
              <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 mb-2">
                <span className="text-xs font-mono text-surface-400 uppercase">Evidence found</span>
                <p className="text-sm text-surface-600 dark:text-surface-400 italic mt-1">
                  "Software Engineer Intern — Built asynchronous FastAPI REST APIs with PostgreSQL"
                </p>
                <p className="text-[10px] text-surface-400 mt-1">Source: Experience</p>
              </div>
            </div>

            {/* Missing example */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-surface-400 uppercase">Requirement</span>
                <span className="badge badge-missing">Missing</span>
                <span className="text-[10px] font-medium uppercase text-amber-500">Medium impact</span>
              </div>
              <p className="text-sm font-medium text-surface-800 dark:text-surface-200 mb-3">
                Kubernetes orchestration experience
              </p>
              <p className="text-sm text-surface-400 italic">
                No relevant evidence found in resume
              </p>
            </div>

            {/* Recommendation example */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Suggested Improvement</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-3">
                  <span className="text-xs font-mono text-red-500 uppercase">Current</span>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                    Built backend APIs using FastAPI.
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                  <span className="text-xs font-mono text-emerald-600 uppercase">Suggested</span>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                    Engineered asynchronous REST APIs using FastAPI and Pydantic, optimizing data serialization for complex candidate profiles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 border-t border-surface-200 dark:border-surface-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent-600 flex items-center justify-center">
              <FileSearch className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Resume Intelligence</span>
          </div>
          <p className="text-xs text-surface-400">
            Engineering intelligence for job applications.
          </p>
        </div>
      </footer>
    </div>
  );
}
