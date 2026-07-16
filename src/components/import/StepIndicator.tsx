'use client';

export function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              i < currentStep
                ? 'bg-blue-600 text-white'
                : i === currentStep
                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                : 'bg-gray-200 text-gray-500'
            }`}>
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-medium ${
              i <= currentStep ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-12 h-0.5 mx-3 ${
              i < currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
