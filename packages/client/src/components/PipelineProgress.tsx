import type { PipelinePhase } from '../hooks/useSSE';

interface PipelineProgressProps {
  phase: PipelinePhase | null;
}

const steps: { key: PipelinePhase; label: string }[] = [
  { key: 'planning', label: '大纲生成' },
  { key: 'composing', label: '上下文装配' },
  { key: 'writing', label: '正文写作' },
  { key: 'fast_audit', label: '快速检查' },
  { key: 'deep_audit', label: '深度审计' },
  { key: 'done', label: '完成' },
];

const phaseOrder: PipelinePhase[] = [
  'pending',
  'planning',
  'awaiting_approval',
  'composing',
  'writing',
  'fast_audit',
  'deep_audit',
  'done',
  'error',
];

function getStepStatus(
  stepKey: PipelinePhase,
  currentPhase: PipelinePhase | null
): 'completed' | 'current' | 'pending' {
  if (!currentPhase) return 'pending';

  const stepIndex = phaseOrder.indexOf(stepKey);
  const currentIndex = phaseOrder.indexOf(currentPhase);

  if (currentPhase === 'error') {
    return stepIndex < currentIndex ? 'completed' : 'pending';
  }

  if (currentPhase === 'awaiting_approval') {
    return stepIndex <= phaseOrder.indexOf('planning') ? 'completed' : 'pending';
  }

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

export function PipelineProgress({ phase }: PipelineProgressProps) {
  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.key, phase);

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                    status === 'completed'
                      ? 'bg-success text-white'
                      : status === 'current'
                      ? 'bg-accent text-dark-bg animate-pulse-slow'
                      : 'bg-dark-elevated text-gray-500 border border-dark-border'
                  }`}
                >
                  {status === 'completed' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-xs whitespace-nowrap ${
                    status === 'current'
                      ? 'text-accent font-medium'
                      : status === 'completed'
                      ? 'text-success'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 mb-4">
                  <div
                    className={`h-0.5 rounded-full transition-colors duration-300 ${
                      status === 'completed' ? 'bg-accent' : 'bg-dark-border'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
