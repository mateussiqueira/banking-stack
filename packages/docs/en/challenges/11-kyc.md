# Challenge 11 — KYC System

**🇬🇧** Know Your Customer System

---

KYC is that annoying "upload your document, take a selfie, fill in your details" screen. Every bank has one. Nobody likes implementing it. But get it wrong, and the tax authority fines you, compliance calls, and users drop off mid-flow.

This challenge is about building a multi-step flow that doesn't lose state, doesn't leave the user lost, and works partially offline.

---

## The Problem

When someone opens a bank account, the bank needs to:
1. Collect personal data (name, CPF, email, phone)
2. Verify identity documents (RG, CNH)
3. Capture a selfie with liveness check
4. Submit for verification
5. Survive browser refreshes without losing progress

The flow must be resilient — users often close the tab and come back. If they need to start over, they churn.

---

## Architecture

```
Step 1                Step 2               Step 3
[Personal Data] ────► [Documents] ───────► [Face Capture] ──► Review
     │                     │                      │
     ▼                     ▼                      ▼
  name, CPF,            RG (front)            selfie via
  email, phone          CNH (back)            webcam

Progress: ●──●──●──○
          25% 50% 75% Review
```

State is managed by **Zustand** with `persist` middleware so progress survives page refreshes and browser closes. Validation uses **Zod** schemas. The webcam capture uses `navigator.mediaDevices.getUserMedia`.

---

## TypeScript Implementation

### Zustand store (state survives refresh)

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

The `persist` middleware saves to localStorage. If the user closes the browser and comes back, they continue where they left off. `reset()` clears everything.

### Document upload with preview

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
        {isDragActive ? 'Drop the file here' : `Drag ${label} here or click to select`}
      </p>
      <p className="text-xs text-zinc-400 mt-1">PNG, JPG. Max 10MB</p>
    </div>
  );
}
```

### Webcam capture

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
      setError('Camera not found or no permission');
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

### Validation with Zod

```typescript
// lib/validation.ts
import { z } from 'zod';

export const personalDataSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  cpf: z.string().transform(v => v.replace(/\D/g, '')).pipe(z.string().length(11, 'Invalid CPF')),
  email: z.string().email('Invalid email'),
  phone: z.string().transform(v => v.replace(/\D/g, '')).pipe(z.string().min(10, 'Invalid phone')),
  birthDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Use DD/MM/YYYY'),
});

export const documentSchema = z.object({
  rgFront: z.instanceof(File, { message: 'RG is required' }),
  cnhBack: z.instanceof(File, { message: 'CNH is required' }),
});
```

---

## Testing

```bash
pnpm --filter @banking/kyc-system test
# Vitest
```

---

## Running

```bash
pnpm --filter @banking/kyc-system dev
# http://localhost:5174
```

---

## Lessons Learned

1. **Persist state to localStorage** — Zustand's `persist` middleware is trivial to set up and prevents the #1 cause of KYC churn: losing progress on refresh.
2. **Preview before upload** — `URL.createObjectURL` gives instant feedback. The user sees their document before the HTTP request fires.
3. **Zod for multi-step validation** — Schemas compose naturally. Validate personal data before allowing documents step. Validate documents before face capture.
4. **Webcam APIs are surprisingly simple** — `getUserMedia` + a canvas capture is ~20 lines. No library needed for the basics.
5. **Dropzone UX matters** — `react-dropzone` handles drag-and-drop, file type filtering, and size limits with minimal boilerplate.
