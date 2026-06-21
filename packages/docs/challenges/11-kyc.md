# 11 — KYC System

**🇧🇷** Sistema de Verificação de Identidade (Know Your Customer)  
**🇬🇧** Know Your Customer Identity Verification System

---

## 🇧🇷 Descrição do Desafio

Implementar um sistema KYC (Know Your Customer) que permite a verificação de identidade de usuários através de upload de documentos, captura facial e validação de dados. O sistema é construído com React + Vite e utiliza um fluxo multi-etapas.

Requisitos:
- Upload de documentos (RG, CNH, selfie)
- Captura facial via webcam
- Formulário multi-etapas com validação (Zod)
- Barra de progresso do fluxo KYC
- Armazenamento de estado com Zustand
- Preview dos documentos enviados
- Responsivo e acessível

---

## 🇬🇧 Challenge Description

Implement a KYC (Know Your Customer) system that allows identity verification through document upload, facial capture, and data validation. The system is built with React + Vite and uses a multi-step flow.

Requirements:
- Document upload (ID, driver's license, selfie)
- Facial capture via webcam
- Multi-step form with validation (Zod)
- KYC flow progress bar
- State management with Zustand
- Uploaded document preview
- Responsive and accessible

---

## Architecture / Arquitetura

```
kyc-system/
├── src/
│   ├── components/
│   │   ├── KYCStepper.tsx       # Multi-step stepper
│   │   ├── DocumentUpload.tsx    # File upload component
│   │   ├── FaceCapture.tsx       # Webcam capture
│   │   ├── DataForm.tsx         # Personal data form
│   │   └── ProgressBar.tsx      # KYC progress
│   ├── hooks/
│   │   ├── useKYC.ts           # KYC flow hook
│   │   └── useWebcam.ts        # Webcam hook
│   ├── lib/
│   │   ├── validation.ts       # Zod schemas
│   │   └── theme/
│   │       ├── colors.ts
│   │       ├── tokens.ts
│   │       └── theme.tsx
│   ├── store/
│   │   └── kycStore.ts         # Zustand store
│   └── __tests__/
└── public/
```

## KYC Flow / Fluxo KYC

```
Step 1                    Step 2                   Step 3
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Personal    │───►│ Document    │───►│ Face        │───► Review → Submit
│ Data Form   │    │ Upload      │    │ Capture     │
│ (name, CPF, │    │ (RG, CNH)   │    │ (webcam)    │
│  email)     │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘

Progress: ● ── ● ── ● ── ○ [Submit]
          25%   50%   75%   100%
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Vite** | Build tool |
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **React Router DOM** | Navigation |
| **React Hook Form** | Form management |
| **Zod** | Schema validation |
| **Zustand** | State management |
| **Radix UI** | Accessible components |
| **react-dropzone** | File upload |
| **react-webcam** | Camera capture |
| **Framer Motion** | Animations |
| **TailwindCSS** | Styling |
| **Vitest** | Testing |

## How to Run / Como Executar

```bash
# Development
pnpm --filter @banking/kyc-system dev

# Build
pnpm --filter @banking/kyc-system build

# Tests
pnpm --filter @banking/kyc-system test
```

The dev server starts at `http://localhost:5174`.
