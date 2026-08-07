'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, Circle } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface ProgressBarProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function ProgressBar({ steps, currentStep, className }: ProgressBarProps) {
  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex flex-col items-center',
                index < steps.length - 1 && 'flex-1'
              )}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-5 left-1/2 h-0.5 w-full',
                    'transition-colors duration-300',
                    isCompleted ? 'bg-wise-green-bright' : 'bg-white/15'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step indicator */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    'transition-all duration-300',
                    'border-2',
                    isCompleted &&
                      'bg-wise-green-bright border-wise-green-bright text-wise-green-forest',
                    isCurrent &&
                      'bg-wise-green-forest border-wise-green-bright text-wise-green-bright ring-4 ring-wise-green-bright/20',
                    isPending && 'bg-wise-green-forest border-white/25 text-white/40'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Circle
                      className={cn(
                        'h-6 w-6',
                        isCurrent && 'fill-wise-green-bright text-wise-green-bright'
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span className="sr-only">
                    {isCompleted
                      ? 'Completed'
                      : isCurrent
                        ? 'Current'
                        : 'Upcoming'}{' '}
                    step: {step.label}
                  </span>
                </div>

                {/* Step label */}
                <div className="mt-2 flex flex-col items-center max-w-[120px]">
                  <span
                    className={cn(
                      'text-sm font-medium text-center',
                      'transition-colors duration-300',
                      isCompleted && 'text-wise-green-bright',
                      isCurrent && 'text-wise-green-bright',
                      isPending && 'text-white/40'
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span
                      className={cn(
                        'mt-1 text-xs text-center',
                        'transition-colors duration-300',
                        isCurrent ? 'text-white/60' : 'text-white/30'
                      )}
                    >
                      {step.description}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
