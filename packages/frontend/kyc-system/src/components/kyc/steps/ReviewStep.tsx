import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewSchema, type ReviewData } from '@/lib/validation';
import { useKYCStore } from '@/store/kycStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormNavigation } from '@/components/kyc/FormNavigation';
import { Container } from '@/components/ui/Container';
import { cn } from '@/lib/utils';
import { Check, PencilLine, Loader2, CheckCircle2 } from 'lucide-react';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function SectionCard({
  title,
  step,
  children,
}: {
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  const goToStep = useKYCStore((s) => s.goToStep);

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToStep(step)}
        >
          <PencilLine className="mr-1 h-3 w-3" />
          Editar
        </Button>
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
        {children}
      </div>
    </div>
  );
}

export function ReviewStep() {
  const personalInfo = useKYCStore((s) => s.personalInfo);
  const address = useKYCStore((s) => s.address);
  const identity = useKYCStore((s) => s.identity);
  const selfieImage = useKYCStore((s) => s.selfieImage);
  const loading = useKYCStore((s) => s.loading);
  const submitted = useKYCStore((s) => s.submitted);
  const setSubmitted = useKYCStore((s) => s.setSubmitted);

  const {
    handleSubmit,
    formState: { errors },
    register,
    watch,
  } = useForm<ReviewData>({
    resolver: zodResolver(reviewSchema),
    mode: 'onChange',
  });

  const termsAccepted = watch('termsAccepted');

  const onSubmit = async () => {
    useKYCStore.getState().setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    useKYCStore.getState().setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Container>
        <Card>
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="rounded-full bg-primary-100 p-3 dark:bg-primary-900">
              <CheckCircle2 className="h-10 w-10 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Cadastro Enviado!
            </h2>
            <p className="max-w-sm text-sm text-neutral-500">
              Seus dados foram recebidos com sucesso. Nossa equipe irá
              verificar as informações e você receberá uma resposta em breve.
            </p>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card title="Revisão" subtitle="Confira seus dados antes de enviar">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <SectionCard title="Dados Pessoais" step={0}>
            <DetailRow label="Nome" value={personalInfo.fullName ?? '-'} />
            <DetailRow label="E-mail" value={personalInfo.email ?? '-'} />
            <DetailRow label="Telefone" value={personalInfo.phone ?? '-'} />
            <DetailRow label="Nascimento" value={personalInfo.dateOfBirth ?? '-'} />
          </SectionCard>

          <SectionCard title="Endereço" step={1}>
            <DetailRow label="Logradouro" value={address.street ?? '-'} />
            <DetailRow label="Cidade" value={address.city ?? '-'} />
            <DetailRow label="Estado" value={address.state ?? '-'} />
          </SectionCard>

          <SectionCard title="Identidade" step={2}>
            <DetailRow
              label="Documento"
              value={identity.idType ?? '-'}
            />
            <DetailRow label="Número" value={identity.idNumber ?? '-'} />
            <DetailRow label="CPF" value={identity.cpf ?? '-'} />
          </SectionCard>

          <SectionCard title="Selfie" step={3}>
            {selfieImage ? (
              <div className="flex items-center gap-3 text-sm text-primary-600">
                <Check className="h-4 w-4" />
                Selfie capturada
              </div>
            ) : (
              <span className="text-sm text-semantic-error">Não capturada</span>
            )}
          </SectionCard>

          <label className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
            <input
              type="checkbox"
              {...register('termsAccepted')}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Declaro que as informações fornecidas são verdadeiras e estou
              ciente da verificação de identidade.
            </span>
          </label>
          {errors.termsAccepted && (
            <p className="text-xs text-semantic-error">
              {errors.termsAccepted.message}
            </p>
          )}

          <FormNavigation
            isNextDisabled={!termsAccepted}
            isNextLoading={loading}
          />
        </form>
      </Card>
    </Container>
  );
}
