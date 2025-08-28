import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  onStepClick?: (index: number) => void;
}

export function ProgressBar({ currentStep, totalSteps, completedSteps, onStepClick }: ProgressBarProps) {
  return (
    <div className="w-full bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Application Progress</h2>
        <span className="text-sm text-gray-300">
          {completedSteps} of {totalSteps} completed
        </span>
      </div>
      
      <div className="relative">
        {/* Progress bar background */}
        <div className="h-2 bg-gray-700 rounded-full" />
        
        {/* Progress bar fill */}
        <div 
          className="absolute top-0 h-2 bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
        />
        
        {/* Step indicators - visually align with the current step number */}
        <div className="flex justify-between mt-4 pt-2 h-16">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const isCompleted = index < completedSteps;
            const isCurrent = index === currentStep - 1;
            
            return (
              <div 
                key={index}
                className={`flex flex-col items-center ${
                  isCurrent ? 'text-blue-400 cursor-pointer' : 
                  isCompleted ? 'text-green-400 cursor-pointer' : 
                  'text-gray-500'
                }`}
                onClick={() => onStepClick && onStepClick(index)}
                role={onStepClick ? "button" : undefined}
              >
                <div className="bg-gray-800 rounded-full p-1">
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                <span className="text-xs mt-1">Step {index + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}