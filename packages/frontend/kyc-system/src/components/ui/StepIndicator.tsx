import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Dados Pessoais', description: 'Nome, email, telefone' },
  { label: 'Endereço', description: 'Comprovante de residência' },
  { label: 'Identidade', description: 'Documentos e CPF' },
  { label: 'Selfie', description: 'Foto facial' },
  { label: 'Revisão', description: 'Confirme seus dados' },
];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Progresso do formulário" className="w-full">
      <ol className="flex items-center">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <li
              key={idx}
              className={cn(
                'relative flex flex-1 flex-col items-center',
                idx < STEPS.length - 1 && 'after:absolute after:left-1/2 after:top-4 after:h-0.5 after:w-full after:-translate-y-1/2 after:bg-neutral-200 dark:after:bg-neutral-700',
                isCompleted && 'after:bg-primary-500'
              )}
            >
              <button
                type="button"
                onClick={() => onStepClick?.(idx)}
                disabled={!isCompleted && !isCurrent}
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  isCompleted && 'bg-primary-500 text-white cursor-pointer',
                  isCurrent && 'border-2 border-primary-500 bg-white text-primary-500 dark:bg-neutral-900',
                  !isCompleted && !isCurrent && 'border-2 border-neutral-300 bg-white text-neutral-400 dark:border-neutral-600 dark:bg-neutral-900'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </button>

              <div className="mt-2 hidden text-center md:block">
                <p
                  className={cn(
                    'text-xs font-medium',
                    isCurrent
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-neutral-500'
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-neutral-400">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
