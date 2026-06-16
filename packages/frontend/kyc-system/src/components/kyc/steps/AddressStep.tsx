import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, type AddressData } from '@/lib/validation';
import { useKYCStore } from '@/store/kycStore';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { Card } from '@/components/ui/Card';
import { FormNavigation } from '@/components/kyc/FormNavigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';

export function AddressStep() {
  const savedData = useKYCStore((s) => s.address);
  const setAddress = useKYCStore((s) => s.setAddress);
  const proofFile = useKYCStore((s) => s.proofFile);
  const setProofFile = useKYCStore((s) => s.setProofFile);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    mode: 'onChange',
    defaultValues: savedData,
  });

  const onSubmit = (data: AddressData) => {
    setAddress(data);
  };

  return (
    <Container>
      <Card title="Endereço" subtitle="Informe seu endereço residencial">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="CEP"
                placeholder="00000-000"
                error={errors.postalCode?.message}
                {...register('postalCode')}
              />
            </div>
            <Button variant="outline" size="sm" className="mb-0.5">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Input
            label="Logradouro"
            placeholder="Nome da rua, avenida..."
            error={errors.street?.message}
            {...register('street')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Número"
              placeholder="123"
              error={errors.number?.message}
              {...register('number')}
            />
            <Input
              label="Complemento"
              placeholder="Apto, bloco..."
              error={errors.complement?.message}
              {...register('complement')}
            />
          </div>

          <Input
            label="Bairro"
            placeholder="Seu bairro"
            error={errors.neighborhood?.message}
            {...register('neighborhood')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cidade"
              placeholder="Sua cidade"
              error={errors.city?.message}
              {...register('city')}
            />
            <Input
              label="Estado"
              placeholder="SP"
              maxLength={2}
              className="uppercase"
              error={errors.state?.message}
              {...register('state')}
            />
          </div>

          <FileUpload
            label="Comprovante de Residência"
            value={proofFile?.file ?? null}
            preview={proofFile?.preview ?? null}
            onChange={(file) => {
              if (file) {
                setProofFile({
                  file,
                  preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
                  name: file.name,
                  size: file.size,
                });
                setValue('proofDoc', file, { shouldValidate: true });
              } else {
                setProofFile(null);
              }
            }}
            error={errors.proofDoc?.message}
          />

          <FormNavigation
            isNextDisabled={!isValid}
          />
        </form>
      </Card>
    </Container>
  );
}
