# @banking/kyc-system

**🇧🇷** Sistema KYC (Know Your Customer) com verificação de identidade  
**🇬🇧** KYC (Know Your Customer) identity verification system

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Vite** | Build tool |
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **TailwindCSS** | Styling |
| **React Hook Form** | Form management |
| **Zod** | Schema validation |
| **Zustand** | State management |
| **Radix UI** | Accessible components |
| **react-dropzone** | File upload |
| **react-webcam** | Camera capture |
| **Framer Motion** | Animations |
| **Vitest** | Testing |

## How to Run

```bash
# Development
pnpm --filter @banking/kyc-system dev

# Build
pnpm --filter @banking/kyc-system build

# Tests
pnpm --filter @banking/kyc-system test

# Test watch
pnpm --filter @banking/kyc-system test:watch
```

Dev server at `http://localhost:5174`.

## KYC Flow

1. **Personal Data** — Name, CPF, DOB, email
2. **Document Upload** — Front/back of ID (RG, CNH)
3. **Face Capture** — Webcam selfie
4. **Review & Submit**

## Structure

```
src/
├── components/
│   ├── KYCStepper.tsx       # Multi-step navigation
│   ├── DocumentUpload.tsx   # File upload with preview
│   ├── FaceCapture.tsx      # Webcam integration
│   ├── DataForm.tsx         # Personal data form
│   └── ProgressBar.tsx      # KYC progress indicator
├── hooks/
│   ├── useKYC.ts            # KYC flow hook
│   └── useWebcam.ts         # Camera hook
├── lib/
│   ├── validation.ts        # Zod schemas
│   └── theme/               # Design tokens
├── store/
│   └── kycStore.ts          # Zustand state
└── __tests__/               # Test files
```
