import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalInfoSchema, type PersonalInfoData } from '@/lib/validation';
import { formatPhone } from '@/lib/phone';
import { useKYCStore } from '@/store/kycStore';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { FormNavigation } from '@/components/kyc/FormNavigation';
import { Container } from '@/components/ui/Container';

const COUNTRIES = [
  { value: 'BR', label: 'Brasil' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'PT', label: 'Portugal' },
  { value: 'ES', label: 'Espanha' },
];

export function PersonalInfoStep() {
  const savedData = useKYCStore((s) => s.personalInfo);
  const setPersonalInfo = useKYCStore((s) => s.setPersonalInfo);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    mode: 'onChange',
    defaultValues: savedData,
  });

  const onSubmit = (data: PersonalInfoData) => {
    setPersonalInfo(data);
  };

  return (
    <Container>
      <Card title="Dados Pessoais" subtitle="Informe seus dados cadastrais">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Nome Completo"
            placeholder="Seu nome completo"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Telefone"
            placeholder="(11) 99999-9999"
            error={errors.phone?.message}
            {...register('phone')}
            onChange={(e) => {
              const formatted = formatPhone(e.target.value);
              setValue('phone', formatted, { shouldValidate: true });
            }}
          />

          <Input
            label="Data de Nascimento"
            type="date"
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />

          <Select
            label="País"
            placeholder="Selecione"
            options={COUNTRIES}
            error={errors.country?.message}
            {...register('country')}
          />

          <FormNavigation
            isNextDisabled={!isValid}
          />
        </form>
      </Card>
    </Container>
  );
}
