import React from 'react';
import { Briefcase, Code, GraduationCap, FolderOpen, Award, Lightbulb } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import ExpandableSection from '../ui/ExpandableSection';

export default function ResumePreview({ resumeParsed }) {
  if (!resumeParsed) return null;

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader
        title="Parsed Resume"
        subtitle="Verify the information extracted from your resume"
      />

      <div className="space-y-3">
        {/* Summary */}
        {resumeParsed.summary && (
          <ExpandableSection title="Summary" defaultOpen={true}
            badge={<Lightbulb className="w-3.5 h-3.5 text-surface-400" />}>
            <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
              {resumeParsed.summary}
            </p>
          </ExpandableSection>
        )}

        {/* Experience */}
        {resumeParsed.experience?.length > 0 && (
          <ExpandableSection title={`Experience (${resumeParsed.experience.length})`} defaultOpen={true}
            badge={<Briefcase className="w-3.5 h-3.5 text-surface-400" />}>
            <div className="space-y-4">
              {resumeParsed.experience.map((exp, i) => (
                <div key={i} className="border-l-2 border-accent-300 dark:border-accent-700 pl-3">
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{exp.title}</p>
                  <p className="text-xs text-surface-500">{exp.company} · {exp.dates}</p>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{exp.description}</p>
                  {exp.achievements?.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {exp.achievements.map((a, j) => (
                        <li key={j} className="text-xs text-surface-600 dark:text-surface-400 flex items-start gap-1.5">
                          <span className="text-accent-500 mt-0.5">▹</span> {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Projects */}
        {resumeParsed.projects?.length > 0 && (
          <ExpandableSection title={`Projects (${resumeParsed.projects.length})`}
            badge={<FolderOpen className="w-3.5 h-3.5 text-surface-400" />}>
            <div className="space-y-3">
              {resumeParsed.projects.map((proj, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{proj.name}</p>
                  <p className="text-sm text-surface-600 dark:text-surface-400">{proj.description}</p>
                  {proj.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {proj.technologies.map((t, j) => (
                        <span key={j} className="px-2 py-0.5 text-[10px] font-medium rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Skills & Technologies */}
        {(resumeParsed.skills?.length > 0 || resumeParsed.technologies?.length > 0) && (
          <ExpandableSection title="Skills & Technologies" defaultOpen={true}
            badge={<Code className="w-3.5 h-3.5 text-surface-400" />}>
            <div className="flex flex-wrap gap-1.5">
              {[...(resumeParsed.skills || []), ...(resumeParsed.technologies || [])].map((skill, i) => (
                <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-accent-50 dark:bg-accent-950 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800">
                  {skill}
                </span>
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Education */}
        {resumeParsed.education?.length > 0 && (
          <ExpandableSection title={`Education (${resumeParsed.education.length})`}
            badge={<GraduationCap className="w-3.5 h-3.5 text-surface-400" />}>
            <div className="space-y-2">
              {resumeParsed.education.map((edu, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{edu.degree}</p>
                  <p className="text-xs text-surface-500">{edu.institution} · {edu.dates}</p>
                  {edu.details && <p className="text-xs text-surface-500 mt-0.5">{edu.details}</p>}
                </div>
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Certifications */}
        {resumeParsed.certifications?.length > 0 && (
          <ExpandableSection title={`Certifications (${resumeParsed.certifications.length})`}
            badge={<Award className="w-3.5 h-3.5 text-surface-400" />}>
            <ul className="space-y-1">
              {resumeParsed.certifications.map((cert, i) => (
                <li key={i} className="text-sm text-surface-700 dark:text-surface-300 flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-accent-500" /> {cert}
                </li>
              ))}
            </ul>
          </ExpandableSection>
        )}
      </div>
    </Card>
  );
}
