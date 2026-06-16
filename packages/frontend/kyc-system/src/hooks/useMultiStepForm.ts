import { useCallback } from 'react';
import { useKYCStore } from '@/store/kycStore';

const TOTAL_STEPS = 5;

export function useMultiStepForm() {
  const currentStep = useKYCStore((s) => s.currentStep);
  const nextStep = useKYCStore((s) => s.nextStep);
  const prevStep = useKYCStore((s) => s.prevStep);
  const goToStep = useKYCStore((s) => s.goToStep);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  const canGoNext = useCallback(() => {
    return currentStep < TOTAL_STEPS - 1;
  }, [currentStep]);

  const canGoPrev = useCallback(() => {
    return currentStep > 0;
  }, [currentStep]);

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    progress,
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep,
    goToStep,
    canGoNext,
    canGoPrev,
  };
}
