import React from 'react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function StepIndicator({ currentStep, totalSteps, className }: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div 
      className={cn(
        "flex flex-col sm:flex-row items-center justify-center gap-4",
        className
      )}
      role="navigation"
      aria-label={`Step ${currentStep} of ${totalSteps}`}
    >
      {/* Mobile Progress Bar (visible on small screens) */}
      <div className="w-full sm:hidden bg-border-light dark:bg-border-dark rounded-full h-2 mb-2">
        <div 
          className="bg-coral-500 h-full rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          role="progressbar"
          aria-valuenow={(currentStep / totalSteps) * 100}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Step Indicators (hidden on mobile) */}
      <div className="hidden sm:flex items-center gap-3">
        {steps.map((step) => (
          <React.Fragment key={step}>
            {step > 1 && (
              <div 
                className={cn(
                  "h-px w-12 transition-colors",
                  step <= currentStep 
                    ? "bg-coral-500" 
                    : "bg-border-light dark:bg-border-dark"
                )}
                aria-hidden="true"
              />
            )}
            <div
              className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                step === currentStep && "bg-coral-500 text-white",
                step < currentStep && "bg-coral-100 dark:bg-coral-900 text-coral-500",
                step > currentStep && "bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-light dark:text-text-dark"
              )}
              aria-current={step === currentStep ? "step" : undefined}
            >
              {step}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Step Text */}
      <p 
        className={cn(
          "text-lg sm:text-2xl font-medium",
          "text-text-light dark:text-text-dark"
        )}
      >
        Step <span className="text-coral-500 font-bold">{currentStep}</span> of {totalSteps}
      </p>
    </div>
  );
}