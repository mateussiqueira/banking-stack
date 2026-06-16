import { useKYCStore } from '@/store/kycStore';
import { Card } from '@/components/ui/Card';
import { SelfieCapture } from '@/components/kyc/SelfieCapture';
import { FormNavigation } from '@/components/kyc/FormNavigation';
import { Container } from '@/components/ui/Container';
import { AlertCircle } from 'lucide-react';

export function SelfieStep() {
  const selfieImage = useKYCStore((s) => s.selfieImage);
  const setSelfieImage = useKYCStore((s) => s.setSelfieImage);

  return (
    <Container>
      <Card title="Selfie" subtitle="Tire uma foto do seu rosto">
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-semantic-info" />
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              <p className="font-medium">Instruções:</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>Certifique-se de que seu rosto está bem iluminado</li>
                <li>Remova óculos escuros e acessórios que cubram o rosto</li>
                <li>Mantenha uma expressão neutra e olhe para a câmera</li>
                <li>Fique em um fundo claro e sem distrações</li>
              </ul>
            </div>
          </div>

          <SelfieCapture
            value={selfieImage}
            onCapture={setSelfieImage}
          />

          <FormNavigation
            isNextDisabled={!selfieImage}
          />
        </div>
      </Card>
    </Container>
  );
}
