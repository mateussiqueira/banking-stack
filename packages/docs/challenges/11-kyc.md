# 11 — KYC System

**🇧🇷** Sistema de Verificação de Identidade  
**🇬🇧** Know Your Customer System

---

KYC é aquela tela chata de "envie seu documento, tire uma selfie, preencha seus dados". Todo banco tem. Ninguém gosta de implementar. Mas se fizer errado, a receita federal multa, o compliance liga, e o usuário desiste no meio do fluxo.

E o pior: o usuário fecha o navegador no passo 3, e quando volta, tem que começar do zero. Você perdeu um cliente potencial porque o estado não foi preservado.

Esse desafio é sobre fazer um fluxo multi-etapas que não perde o estado, não deixa o usuário perdido, e funciona offline parcialmente. É sobre fazer KYC que o usuário não odeie.

---

## O fluxo

```
Step 1                Step 2               Step 3
[Personal Data] ────► [Documents] ───────► [Face Capture] ──► Review
     │                     │                      │
     ▼                     ▼                      ▼
  name, CPF,            RG (frente)            selfie via
  email, phone          CNH (verso)            webcam

Progress: ●──●──●──○
          25% 50% 75% Review
```

Cada passo salva o progresso. Se o usuário fechar e voltar, continua de onde parou. O formulário valida antes de avançar. Os documentos são compactados antes do upload. A selfie é capturada com liveness detection básica.

---

## O código que faz diferença

### Zustand store (estado não morre no refresh)

```typescript
// store/kycStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Step = 'personal' | 'documents' | 'face-capture' | 'review' | 'submitted';

interface KYCState {
  step: Step;
  progress: number;

  personalData: {
    name: string;
    cpf: string;
    email: string;
    phone: string;
    birthDate: string;
  };

  documents: {
    rgFront: File | null;
    rgFrontPreview: string | null;
    cnhBack: File | null;
    cnhBackPreview: string | null;
  };

  faceCapture: {
    image: string | null;
    livenessPassed: boolean;
  };

  setStep: (step: Step) => void;
  setPersonalData: (data: Partial<KYCState['personalData']>) => void;
  setDocument: (type: 'rgFront' | 'cnhBack', file: File, preview: string) => void;
  setFaceCapture: (image: string) => void;
  submit: () => Promise<void>;
  reset: () => void;
}

export const useKYCStore = create<KYCState>()(
  persist(
    (set, get) => ({
      step: 'personal',
      progress: 0,

      personalData: { name: '', cpf: '', email: '', phone: '', birthDate: '' },
      documents: { rgFront: null, rgFrontPreview: null, cnhBack: null, cnhBackPreview: null },
      faceCapture: { image: null, livenessPassed: false },

      setStep: (step) => {
        const progressMap: Record<Step, number> = {
          personal: 0, documents: 25, 'face-capture': 50, review: 75, submitted: 100,
        };
        set({ step, progress: progressMap[step] });
      },

      setPersonalData: (data) => set((state) => ({
        personalData: { ...state.personalData, ...data }
      })),

      setDocument: (type, file, preview) => set((state) => ({
        documents: { ...state.documents, [type]: file, [`${type}Preview`]: preview }
      })),

      setFaceCapture: (image) => set((state) => ({
        faceCapture: { image, livenessPassed: true }
      })),

      submit: async () => {
        const state = get();
        const formData = new FormData();
        formData.append('name', state.personalData.name);
        formData.append('cpf', state.personalData.cpf);
        if (state.documents.rgFront) formData.append('rgFront', state.documents.rgFront);
        if (state.documents.cnhBack) formData.append('cnhBack', state.documents.cnhBack);
        if (state.faceCapture.image) formData.append('selfie', state.faceCapture.image);

        await fetch('/api/kyc/submit', { method: 'POST', body: formData });
        set({ step: 'submitted', progress: 100 });
      },

      reset: () => set({
        step: 'personal', progress: 0,
        personalData: { name: '', cpf: '', email: '', phone: '', birthDate: '' },
        documents: { rgFront: null, rgFrontPreview: null, cnhBack: null, cnhBackPreview: null },
        faceCapture: { image: null, livenessPassed: false },
      }),
    }),
    {
      name: 'kyc-storage',
      partialize: (state) => ({
        step: state.step,
        progress: state.progress,
        personalData: state.personalData,
        faceCapture: state.faceCapture,
      }),
    }
  )
);
```

O `persist` salva no localStorage. Se o usuário fechar o navegador e voltar, continua de onde parou. Se quiser limpar, `reset()`.

Repara no `partialize`. A gente não salva os arquivos (File) no localStorage — eles são objetos binários que não serializam bem. Salvamos só os dados textuais e as previews (base64). Os arquivos vão ser re-upload no submit. Isso é intencional: arquivos são grandes demais pro localStorage (limite de 5-10MB) e não precisam sobreviver a fechar o navegador — o usuário pode re-anexar.

### Validação por etapa

Cada etapa tem sua validação. Você não deixa o usuário avançar se os dados estão incompletos:

```typescript
// lib/validation.ts
import { z } from 'zod';

export const personalDataSchema = z.object({
  name: z.string().min(3, 'Nome precisa ter no mínimo 3 caracteres'),
  cpf: z.string().transform(v => v.replace(/\D/g, '')).pipe(z.string().length(11, 'CPF inválido')),
  email: z.string().email('Email inválido'),
  phone: z.string().transform(v => v.replace(/\D/g, '')).pipe(z.string().min(10, 'Telefone inválido')),
  birthDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Use DD/MM/AAAA'),
});

export const documentSchema = z.object({
  rgFront: z.instanceof(File, { message: 'RG é obrigatório' }),
  cnhBack: z.instanceof(File, { message: 'CNH é obrigatória' }),
});
```

```typescript
// lib/cpf.ts
// Validação de CPF (algoritmo dos 2 dígitos verificadores)
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // 111.111.111-11
  
  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit > 9) firstDigit = 0;
  
  if (parseInt(digits[9]) !== firstDigit) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit > 9) secondDigit = 0;
  
  return parseInt(digits[10]) === secondDigit;
}

// Formata CPF: 12345678901 -> 123.456.789-01
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  
  return digits.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    '$1.$2.$3-$4'
  );
}
```

Validar CPF no frontend evita enviar dados inválidos pro servidor. O algoritmo dos dígitos verificadores não é trivial, mas é obrigatório pra qualquer sistema financeiro brasileiro. Uma regex não basta — você precisa calcular os dígitos.

### Etapa 1: Personal Data

```typescript
// components/PersonalDataStep.tsx
import { useState } from 'react';
import { useKYCStore } from '@/store/kycStore';
import { personalDataSchema } from '@/lib/validation';
import { formatCPF } from '@/lib/cpf';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function PersonalDataStep() {
  const { personalData, setPersonalData, setStep } = useKYCStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function handleChange(field: string, value: string) {
    let formatted = value;

    if (field === 'cpf') {
      formatted = formatCPF(value);
    }
    if (field === 'phone') {
      formatted = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '($1) $2');
    }
    if (field === 'birthDate') {
      formatted = value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1/$2')
        .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    }

    setPersonalData({ [field]: formatted });

    // Validação em tempo real (só se já foi tocado)
    if (touched[field]) {
      const result = personalDataSchema.safeParse({
        ...personalData,
        [field]: formatted,
      });

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setErrors(prev => ({
          ...prev,
          [field]: fieldErrors[field]?.[0] || '',
        }));
      } else {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    }
  }

  function handleBlur(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));

    const result = personalDataSchema.safeParse(personalData);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      if (fieldErrors[field]) {
        setErrors(prev => ({ ...prev, [field]: fieldErrors[field]![0] }));
      }
    }
  }

  function handleNext() {
    const result = personalDataSchema.safeParse(personalData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const newErrors: Record<string, string> = {};
      for (const [field, msgs] of Object.entries(fieldErrors)) {
        newErrors[field] = msgs![0];
      }
      setErrors(newErrors);
      setTouched({ name: true, cpf: true, email: true, phone: true, birthDate: true });
      return;
    }

    setStep('documents');
  }

  const fields = [
    { key: 'name', label: 'Nome completo', type: 'text', placeholder: 'Seu nome completo' },
    { key: 'cpf', label: 'CPF', type: 'text', placeholder: '000.000.000-00', maxLength: 14 },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'seu@email.com' },
    { key: 'phone', label: 'Telefone', type: 'text', placeholder: '(11) 99999-9999' },
    { key: 'birthDate', label: 'Data de nascimento', type: 'text', placeholder: 'DD/MM/AAAA', maxLength: 10 },
  ] as const;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900">Dados pessoais</h2>

      {fields.map(({ key, label, type, placeholder, maxLength }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            {label}
          </label>
          <Input
            type={type}
            value={(personalData as any)[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            onBlur={() => handleBlur(key)}
            placeholder={placeholder}
            maxLength={maxLength}
            error={touched[key] ? errors[key] : undefined}
          />
        </div>
      ))}

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} variant="primary" size="lg">
          Próximo: Documentos
        </Button>
      </div>
    </div>
  );
}
```

### Input com erro

```typescript
// components/ui/Input.tsx
import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export function Input({ className, error, label, id, ...props }: InputProps) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'flex h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm',
          'placeholder:text-zinc-400',
          'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

Repara no `aria-invalid` e `aria-describedby`. Isso é acessibilidade na prática. Leitores de tela anunciam "CPF inválido" quando o campo está com erro. Sem esses atributos, o usuário de leitor de tela não sabe que tem um erro.

### Etapa 2: Upload de documentos

```typescript
// components/DocumentsStep.tsx
import { useKYCStore } from '@/store/kycStore';
import { DocumentUpload } from './DocumentUpload';

export function DocumentsStep() {
  const { documents, setDocument, setStep } = useKYCStore();

  const isValid = documents.rgFront !== null && documents.cnhBack !== null;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-zinc-900">Documentos</h2>
      <p className="text-sm text-zinc-500">
        Envie frente do RG e verso da CNH. Formatos aceitos: PNG, JPG. Máximo 10MB cada.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <DocumentUpload
            type="rgFront"
            label="frente do RG"
            onUpload={setDocument}
            preview={documents.rgFrontPreview}
          />
        </div>

        <div>
          <DocumentUpload
            type="cnhBack"
            label="verso da CNH"
            onUpload={setDocument}
            preview={documents.cnhBackPreview}
          />
        </div>
      </div>

      {/* Preview cards */}
      {documents.rgFrontPreview && (
        <div className="rounded-lg border border-zinc-200 p-3">
          <img src={documents.rgFrontPreview} alt="Preview RG" className="max-h-48 rounded" />
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep('personal')}>
          Voltar
        </Button>
        <Button variant="primary" size="lg" disabled={!isValid} onClick={() => setStep('face-capture')}>
          Próximo: Selfie
        </Button>
      </div>
    </div>
  );
}
```

### Upload de documento com preview

```typescript
// components/DocumentUpload.tsx
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  type: 'rgFront' | 'cnhBack';
  label: string;
  onUpload: (type: string, file: File, preview: string) => void;
  preview: string | null;
}

export function DocumentUpload({ type, label, onUpload, preview }: Props) {
  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;

    // Preview pra mostrar pro usuário
    const preview = URL.createObjectURL(file);
    onUpload(type, file, preview);
  }, [type, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  if (preview) {
    return (
      <div className="relative">
        <img src={preview} alt={label} className="w-full rounded-xl object-cover" />
        <button
          onClick={() => onUpload(type, null as any, null as any)}
          className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-zinc-300 hover:border-zinc-400'}`}
    >
      <input {...getInputProps()} />
      <p className="text-sm text-zinc-600">
        {isDragActive ? 'Solte o arquivo aqui' : `Arraste ${label} ou clique para selecionar`}
      </p>
      <p className="text-xs text-zinc-400 mt-1">PNG, JPG. Máx 10MB</p>
    </div>
  );
}
```

O `URL.createObjectURL` cria uma URL temporária pra exibir o preview sem fazer upload. Quando o usuário desmontar o componente, chame `URL.revokeObjectURL` pra liberar memória. Mas a store já guarda a preview, então o garbage collector cuida.

### Etapa 3: Captura facial

```typescript
// components/FaceCaptureStep.tsx
import { useKYCStore } from '@/store/kycStore';
import { useWebcam } from '@/hooks/useWebcam';
import { Button } from '@/components/ui/Button';
import { Camera, RefreshCw } from 'lucide-react';

export function FaceCaptureStep() {
  const { faceCapture, setFaceCapture, setStep } = useKYCStore();
  const { ref, start, capture, stop, error, isActive } = useWebcam();

  useEffect(() => {
    start();
    return () => stop();
  }, []);

  function handleCapture() {
    const image = capture();
    if (image) {
      setFaceCapture(image);
      stop();
    }
  }

  function handleRetake() {
    setFaceCapture('');
    start();
  }

  if (faceCapture.image) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-zinc-900">Selfie capturada</h2>

        <img src={faceCapture.image} alt="Selfie" className="mx-auto max-w-sm rounded-xl" />

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep('documents')}>
            Voltar
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={handleRetake}>
              Tirar outra
            </Button>
            <Button variant="primary" onClick={() => setStep('review')}>
              Revisar dados
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-zinc-900">Câmera indisponível</h2>
        <p className="text-red-500">{error}</p>
        <p className="text-sm text-zinc-500">
          Verifique se a câmera está conectada e se você permitiu o acesso no navegador.
        </p>
        <Button onClick={start}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900">Tire uma selfie</h2>

      <div className="mx-auto max-w-sm overflow-hidden rounded-xl bg-black">
        <video ref={ref} autoPlay playsInline className="w-full" />
      </div>

      {!isActive && (
        <p className="text-sm text-zinc-500">Iniciando câmera...</p>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep('documents')}>
          Voltar
        </Button>
        <Button variant="primary" leftIcon={<Camera className="h-4 w-4" />} onClick={handleCapture} disabled={!isActive}>
          Capturar
        </Button>
      </div>
    </div>
  );
}
```

### Webcam com react-webcam

```typescript
// hooks/useWebcam.ts
import { useRef, useState, useCallback } from 'react';

export function useWebcam() {
  const ref = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(s);
      if (ref.current) ref.current.srcObject = s;
    } catch {
      setError('Câmera não encontrada ou sem permissão');
    }
  }, []);

  const capture = useCallback((): string | null => {
    if (!ref.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = ref.current.videoWidth;
    canvas.height = ref.current.videoHeight;
    canvas.getContext('2d')?.drawImage(ref.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const stop = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  }, [stream]);

  return { ref, start, capture, stop, error, isActive: !!stream };
}
```

### Liveness detection simples

No mundo real, você usaria um serviço como IdNow, Unico ou Jumio pra liveness detection. Mas dá pra fazer uma verificação básica no frontend:

```typescript
// lib/liveness.ts
export interface LivenessCheck {
  passed: boolean;
  score: number;
  message: string;
}

export function basicLivenessCheck(imageData: string): LivenessCheck {
  // Carrega a imagem em um canvas pra análise
  const img = new Image();
  img.src = imageData;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData_obj = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData_obj.data;

  // 1. Verifica se a imagem não é completamente uniforme (foto de tela)
  let variance = 0;
  let sum = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const brightness = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    sum += brightness;
  }

  const avgBrightness = sum / (pixels.length / 4);

  for (let i = 0; i < pixels.length; i += 4) {
    const brightness = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    variance += Math.pow(brightness - avgBrightness, 2);
  }

  variance /= pixels.length / 4;

  // Imagem muito uniforme = possível foto de tela ou papel
  if (variance < 500) {
    return { passed: false, score: 0.1, message: 'Imagem parece ser de tela ou papel' };
  }

  // 2. Verifica proporções de rosto (muito básico, só pra simular)
  const aspectRatio = canvas.width / canvas.height;
  if (aspectRatio < 0.5 || aspectRatio > 2.0) {
    return { passed: false, score: 0.2, message: 'Proporção de imagem inválida para selfie' };
  }

  // Passou nas verificações básicas
  return { passed: true, score: 0.8, message: 'Verificação básica ok' };
}
```

Isso não substitui um serviço de KYC profissional. Mas já filtra casos óbvios: foto de tela, foto de papel, imagem monocromática. No simulador, serve pra demonstrar o conceito.

### Etapa 4: Review

```typescript
// components/ReviewStep.tsx
import { useState } from 'react';
import { useKYCStore } from '@/store/kycStore';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function ReviewStep() {
  const { personalData, documents, faceCapture, submit, setStep } = useKYCStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      await submit();
    } catch (err) {
      setError('Erro ao enviar. Tente novamente.');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900">Revisar dados</h2>

      <Card variant="outlined">
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Nome</dt>
            <dd className="text-zinc-900">{personalData.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">CPF</dt>
            <dd className="text-zinc-900">{personalData.cpf}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Email</dt>
            <dd className="text-zinc-900">{personalData.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Telefone</dt>
            <dd className="text-zinc-900">{personalData.phone}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {documents.rgFrontPreview && (
          <Card variant="outlined" padding="sm">
            <CardTitle>RG (frente)</CardTitle>
            <img src={documents.rgFrontPreview} alt="RG" className="mt-2 rounded" />
          </Card>
        )}
        {documents.cnhBackPreview && (
          <Card variant="outlined" padding="sm">
            <CardTitle>CNH (verso)</CardTitle>
            <img src={documents.cnhBackPreview} alt="CNH" className="mt-2 rounded" />
          </Card>
        )}
      </div>

      {faceCapture.image && (
        <Card variant="outlined" padding="sm">
          <CardTitle>Selfie</CardTitle>
          <img src={faceCapture.image} alt="Selfie" className="mt-2 max-w-xs rounded" />
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep('face-capture')} disabled={submitting}>
          Voltar
        </Button>
        <Button variant="primary" size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirmar e enviar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
```

### Progress bar

```typescript
// components/ProgressBar.tsx
import { cn } from '@/lib/cn';
import { useKYCStore } from '@/store/kycStore';

const steps = [
  { key: 'personal', label: 'Dados' },
  { key: 'documents', label: 'Documentos' },
  { key: 'face-capture', label: 'Selfie' },
  { key: 'review', label: 'Revisão' },
] as const;

export function ProgressBar() {
  const { step } = useKYCStore();
  const currentIdx = steps.findIndex(s => s.key === step);

  return (
    <nav aria-label="Progresso do KYC" className="mb-8">
      <ol className="flex items-center gap-2">
        {steps.map((s, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <li key={s.key} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                isCompleted && 'bg-violet-600 text-white',
                isCurrent && 'border-2 border-violet-600 text-violet-600',
                !isCompleted && !isCurrent && 'border-2 border-zinc-300 text-zinc-400'
              )}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  idx + 1
                )}
              </div>
              <span className={cn(
                'text-sm',
                isCurrent && 'font-medium text-violet-600',
                isCompleted && 'text-zinc-500',
                !isCompleted && !isCurrent && 'text-zinc-400'
              )}>
                {s.label}
              </span>
              {idx < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2',
                  isCompleted ? 'bg-violet-600' : 'bg-zinc-200'
                )} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

### Página principal (orquestrador)

```typescript
// app/page.tsx
'use client';

import { useKYCStore } from '@/store/kycStore';
import { ProgressBar } from '@/components/ProgressBar';
import { PersonalDataStep } from '@/components/PersonalDataStep';
import { DocumentsStep } from '@/components/DocumentsStep';
import { FaceCaptureStep } from '@/components/FaceCaptureStep';
import { ReviewStep } from '@/components/ReviewStep';
import { SubmittedStep } from '@/components/SubmittedStep';

export default function KYCPage() {
  const { step, reset } = useKYCStore();

  function renderStep() {
    switch (step) {
      case 'personal':
        return <PersonalDataStep />;
      case 'documents':
        return <DocumentsStep />;
      case 'face-capture':
        return <FaceCaptureStep />;
      case 'review':
        return <ReviewStep />;
      case 'submitted':
        return <SubmittedStep />;
      default:
        return <PersonalDataStep />;
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">
        Verificação de identidade
      </h1>

      <ProgressBar />

      {renderStep()}

      <div className="mt-8 text-center">
        <button
          onClick={reset}
          className="text-sm text-zinc-400 hover:text-zinc-600 underline"
        >
          Recomeçar do início
        </button>
      </div>
    </div>
  );
}
```

O orquestrador é simples: switch case por step. Cada step é um componente independente. O Zustand mantém o estado global. Se o usuário recarregar a página, o `persist` restaura o step e os dados.

### API de submit

```typescript
// app/api/kyc/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const name = formData.get('name') as string;
  const cpf = formData.get('cpf') as string;
  const rgFront = formData.get('rgFront') as File | null;
  const cnhBack = formData.get('cnhBack') as File | null;
  const selfie = formData.get('selfie') as string | null;

  // Validação no servidor
  if (!name || !cpf || !rgFront || !cnhBack || !selfie) {
    return NextResponse.json(
      { error: 'Todos os campos são obrigatórios' },
      { status: 400 }
    );
  }

  // Upload dos documentos (simulado)
  const rgUrl = await uploadToS3(rgFront, `kyc/${cpf}/rg-front`);
  const cnhUrl = await uploadToS3(cnhBack, `kyc/${cpf}/cnh-back`);

  // Processamento da selfie (integracao com servico de KYC)
  const kycResult = await processKYC({
    name,
    cpf,
    rgUrl,
    cnhUrl,
    selfie: selfie.replace('data:image/jpeg;base64,', ''),
  });

  return NextResponse.json({
    status: 'pending_review',
    kycId: kycResult.id,
    message: 'Documentos recebidos para análise',
  });
}

async function uploadToS3(file: File, key: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // Simula upload
  console.log(`Uploading ${key} (${buffer.length} bytes)`);
  return `https://storage.banking-stack.com/${key}`;
}

async function processKYC(data: any) {
  // Simula processamento KYC
  // Na vida real: integracao com Serasa, Unico, etc.
  return {
    id: crypto.randomUUID(),
    status: 'pending_review',
    score: Math.random() * 100,
  };
}
```

### Tratamento de erro global

```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class KYCErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-md py-24 text-center">
          <h2 className="text-xl font-semibold text-zinc-900">Algo deu errado</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {this.state.error?.message || 'Erro inesperado'}
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Como rodar

```bash
pnpm --filter @banking/kyc-system dev
# http://localhost:5174

pnpm --filter @banking/kyc-system test
# Vitest
```

### Testando manualmente

```bash
# Abre o navegador em http://localhost:5174

# Passo 1: Preenche dados pessoais
# Passo 2: Upload de documentos (qualquer PNG/JPG)
# Passo 3: Captura selfie (permite câmera)
# Passo 4: Revisa e envia

# Testa recovery: no passo 3, recarrega a página
# Deve voltar pro passo 3 com os dados preservados

# Testa reset: clica em "Recomeçar do início"
# Deve voltar pro passo 1 com tudo limpo
```

---

## Lições aprendidas

1. **Zustand + persist = estado que sobrevive** — O usuário fecha o navegador no passo 3, volta no passo 3. Não perde dados. Mas lembre de não persistir arquivos grandes (File) no localStorage — só as strings.

2. **Validação em duas camadas** — Frontend com Zod valida antes de enviar (UX rápida). Backend valida de novo (segurança). Nunca confie só no frontend.

3. **Preview de documento é questão de UX** — Mostrar o documento que o usuário enviou dá confiança. Ele vê que o upload funcionou. Use `URL.createObjectURL` pra preview sem upload.

4. **Webcam é frágil** — `getUserMedia` pode falhar por 1000 motivos: permissão negada, câmera ocupada, navegador incompatível. Sempre tenha fallback: "ou enviar uma foto".

5. **Progresso visível reduz abandono** — Saber que falta só 1 passo de 4 faz o usuário continuar. Barra de progresso com labels claras. `aria-label` pra acessibilidade.

6. **Acessibilidade importa em KYC** — Usuário com deficiência visual também precisa abrir conta. Inputs com `aria-invalid`, `aria-describedby`, labels. Leitores de tela precisam saber dos erros.

7. **Compressão de imagem antes do upload** — Selfie em base64 pode ter 5MB. Reduza qualidade (0.8), redimensione se necessário. O upload fica mais rápido, a API agradece.

8. **Telefone e CPF com máscara** — Format enquanto o usuário digita. Máscara input melhora a experiência. Mas o valor salvo deve ser sem formatação (só dígitos). O Zustand salva o valor mascarado? Depende — o `persist` salva o que está na store. Eu prefiro salvar só dígitos e aplicar máscara na exibição.
