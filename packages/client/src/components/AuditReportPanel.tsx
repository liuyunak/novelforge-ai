import { useState } from 'react';
import { Card } from './ui/Card';
import type { FastAuditResult, DeepAuditResult } from '../services/api';

interface AuditReportPanelProps {
  fastAudit: FastAuditResult | null;
  deepAudit: DeepAuditResult | null;
}

const dimensionLabels: Record<string, string> = {
  character_consistency: '角色一致性',
  plot_logic: '情节逻辑',
  ai_taste: 'AI味',
  ai_flavor: 'AI味',
  narrative_rhythm: '叙事节奏',
  pacing: '叙事节奏',
  style_match: '风格匹配',
};

function getScoreColor(score: number): string {
  if (score >= 8) return 'bg-success';
  if (score >= 6) return 'bg-accent';
  return 'bg-danger';
}

function getScoreTextColor(score: number): string {
  if (score >= 8) return 'text-success';
  if (score >= 6) return 'text-accent';
  return 'text-danger';
}

export function AuditReportPanel({ fastAudit, deepAudit }: AuditReportPanelProps) {
  const [expandedCheck, setExpandedCheck] = useState<number | null>(null);

  if (!fastAudit && !deepAudit) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 italic text-sm">等待审计完成...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {fastAudit && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">快速检查</h3>
            <span className={`text-lg font-bold ${getScoreTextColor(fastAudit.score)}`}>
              {fastAudit.score}
            </span>
          </div>
          <div className="space-y-2">
            {fastAudit.checks.map((check, index) => (
              <div key={index}>
                <div
                  className="flex items-center justify-between py-1.5 cursor-pointer hover:bg-dark-elevated rounded px-2 -mx-2"
                  onClick={() => setExpandedCheck(expandedCheck === index ? null : index)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        check.passed
                          ? 'bg-success-dim text-success'
                          : 'bg-danger-dim text-danger'
                      }`}
                    >
                      {check.passed ? '✓' : '✗'}
                    </span>
                    <span className="text-sm text-gray-300">{check.name}</span>
                  </div>
                  {check.details && (
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        expandedCheck === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
                {expandedCheck === index && check.details && (
                  <div className="ml-7 mt-1 mb-2 text-xs text-gray-500 bg-dark-elevated rounded p-2">
                    {check.details}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-dark-border flex items-center justify-between">
            <span className="text-xs text-gray-500">总分</span>
            <span className={`text-xl font-bold ${getScoreTextColor(fastAudit.score)}`}>
              {fastAudit.score}/100
            </span>
          </div>
        </Card>
      )}

      {deepAudit && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">深度审计</h3>
            <span className="text-2xl font-bold text-accent">
              {deepAudit.overall_score}
            </span>
          </div>

          <div className="space-y-3 mb-4">
            {getDeepAuditEntries(deepAudit).map(({ label, value }, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{label}</span>
                  <span className={`text-sm font-medium ${getScoreTextColor(value)}`}>
                    {value}
                  </span>
                </div>
                <div className="h-2 bg-dark-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreColor(value)}`}
                    style={{ width: `${Math.min(value * 10, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-dark-border">
            <h4 className="text-xs font-medium text-gray-500 mb-2">改进建议</h4>
            <ul className="space-y-1.5">
              {deepAudit.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-gray-400 flex gap-2">
                  <span className="text-accent font-medium flex-shrink-0">{index + 1}.</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}

function getDeepAuditEntries(deepAudit: DeepAuditResult): { label: string; value: number }[] {
  const scores = deepAudit.scores;
  if (Array.isArray(scores)) {
    return scores.map((dim) => ({ label: dimensionLabels[dim.name] || dim.name, value: dim.score }));
  }
  return Object.entries(scores).map(([key, value]) => ({
    label: dimensionLabels[key] || key,
    value: value as number,
  }));
}
