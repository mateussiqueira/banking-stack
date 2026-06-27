# 11 — KYC System

**🇧🇷** Sistema de Verificação de Identidade  
**🇬🇧** Know Your Customer System

---

KYC é aquela tela chata de "envie seu documento, tire uma selfie, preencha seus dados". Todo banco tem. Ninguém gosta de implementar. Mas se fizer errado, a receita federal multa, o compliance liga, e o usuário desiste no meio do fluxo.

Esse desafio é sobre fazer um fluxo multi-etapas que não perde o estado, não deixa o usuário perdido, e funciona offline parcialmente.

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

### Upload de documento com preview

```typescript
// components/DocumentUpload.tsx
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  type: 'rgFront' | 'cnhBack';
  label: string;
  onUpload: (type: string, file: File, preview: string) => void;
}

export function DocumentUpload({ type, label, onUpload }: Props) {
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

---

## Validação com Zod

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

---

## Como rodar

```bash
pnpm --filter @banking/kyc-system dev
# http://localhost:5174

pnpm --filter @banking/kyc-system test
# Vitest
```