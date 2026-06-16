import { AnimatePresence, motion } from 'framer-motion';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { PersonalInfoStep } from '@/components/kyc/steps/PersonalInfoStep';
import { AddressStep } from '@/components/kyc/steps/AddressStep';
import { IdentityStep } from '@/components/kyc/steps/IdentityStep';
import { SelfieStep } from '@/components/kyc/steps/SelfieStep';
import { ReviewStep } from '@/components/kyc/steps/ReviewStep';
import { useKYCStore } from '@/store/kycStore';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/lib/theme/theme';

const stepComponents = [
  PersonalInfoStep,
  AddressStep,
  IdentityStep,
  SelfieStep,
  ReviewStep,
];

export default function App() {
  const currentStep = useKYCStore((s) => s.currentStep);
  const goToStep = useKYCStore((s) => s.goToStep);
  const submitted = useKYCStore((s) => s.submitted);
  const { theme, toggleTheme } = useTheme();
  const StepComponent = stepComponents[currentStep];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-xl font-bold text-primary-500">Banking KYC</span>
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      <main className="py-6">
        {!submitted && (
          <div className="mx-auto max-w-2xl px-4 pb-6 sm:px-6">
            <StepIndicator currentStep={currentStep} onStepClick={goToStep} />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
