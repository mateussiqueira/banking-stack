import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useMultiStepForm } from '@/hooks/useMultiStepForm';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FormNavigationProps {
  onNext?: () => void;
  onPrev?: () => void;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  nextLabel?: string;
}

export function FormNavigation({
  onNext,
  onPrev,
  isNextDisabled,
  isNextLoading,
  nextLabel,
}: FormNavigationProps) {
  const { currentStep, totalSteps, prevStep, nextStep, isFirstStep, isLastStep } = useMultiStepForm();

  const handlePrev = () => {
    onPrev?.();
    prevStep();
  };

  const handleNext = () => {
    onNext?.();
    if (!isNextDisabled) nextStep();
  };

  return (
    <div className="space-y-4">
      <ProgressBar value={currentStep + 1} max={totalSteps} />

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={isFirstStep}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>

        {!isLastStep && (
          <Button
            onClick={handleNext}
            disabled={isNextDisabled}
            loading={isNextLoading}
          >
            {nextLabel || 'Próximo'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {isLastStep && (
          <Button type="submit" loading={isNextLoading} disabled={isNextDisabled}>
            Enviar
          </Button>
        )}
      </div>
    </div>
  );
}
