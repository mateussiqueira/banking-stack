import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { identitySchema, type IdentityData } from '@/lib/validation';
import { formatCPF } from '@/lib/cpf';
import { useKYCStore } from '@/store/kycStore';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FileUpload } from '@/components/ui/FileUpload';
import { Card } from '@/components/ui/Card';
import { FormNavigation } from '@/components/kyc/FormNavigation';
import { Container } from '@/components/ui/Container';

const ID_TYPES = [
  { value: 'Passport', label: 'Passaporte' },
  { value: 'DriverLicense', label: 'Carteira de Motorista' },
  { value: 'RG', label: 'RG' },
];

export function IdentityStep() {
  const savedData = useKYCStore((s) => s.identity);
  const setIdentity = useKYCStore((s) => s.setIdentity);
  const frontFile = useKYCStore((s) => s.frontFile);
  const backFile = useKYCStore((s) => s.backFile);
  const setFrontFile = useKYCStore((s) => s.setFrontFile);
  const setBackFile = useKYCStore((s) => s.setBackFile);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<IdentityData>({
    resolver: zodResolver(identitySchema),
    mode: 'onChange',
    defaultValues: savedData,
  });

  const onSubmit = (data: IdentityData) => {
    setIdentity(data);
  };

  return (
    <Container>
      <Card title="Documentos" subtitle="Envie seus documentos de identificação">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Select
            label="Tipo de Documento"
            placeholder="Selecione o tipo"
            options={ID_TYPES}
            error={errors.idType?.message}
            {...register('idType')}
          />

          <Input
            label="Número do Documento"
            placeholder="Número do documento"
            error={errors.idNumber?.message}
            {...register('idNumber')}
          />

          <Input
            label="CPF"
            placeholder="000.000.000-00"
            error={errors.cpf?.message}
            {...register('cpf')}
            onChange={(e) => {
              const formatted = formatCPF(e.target.value);
              setValue('cpf', formatted, { shouldValidate: true });
            }}
          />

          <FileUpload
            label="Frente do Documento"
            value={frontFile?.file ?? null}
            preview={frontFile?.preview ?? null}
            onChange={(file) => {
              if (file) {
                setFrontFile({
                  file,
                  preview: URL.createObjectURL(file),
                  name: file.name,
                  size: file.size,
                });
                setValue('idFront', file, { shouldValidate: true });
              } else {
                setFrontFile(null);
              }
            }}
            error={errors.idFront?.message}
          />

          <FileUpload
            label="Verso do Documento"
            value={backFile?.file ?? null}
            preview={backFile?.preview ?? null}
            onChange={(file) => {
              if (file) {
                setBackFile({
                  file,
                  preview: URL.createObjectURL(file),
                  name: file.name,
                  size: file.size,
                });
                setValue('idBack', file, { shouldValidate: true });
              } else {
                setBackFile(null);
              }
            }}
            error={errors.idBack?.message}
          />

          <FormNavigation
            isNextDisabled={!isValid}
          />
        </form>
      </Card>
    </Container>
  );
}
