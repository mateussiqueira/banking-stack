import { create } from 'zustand';
import type { PersonalInfoData, AddressData, IdentityData } from '@/lib/validation';

const STORAGE_KEY = 'kyc-form-state';

interface FileUpload {
  file: File;
  preview: string;
  name: string;
  size: number;
}

interface KYCState {
  currentStep: number;
  personalInfo: Partial<PersonalInfoData>;
  address: Partial<AddressData>;
  identity: Partial<IdentityData>;
  selfieImage: string | null;
  frontFile: FileUpload | null;
  backFile: FileUpload | null;
  proofFile: FileUpload | null;
  loading: boolean;
  submitted: boolean;
}

interface KYCActions {
  setCurrentStep: (step: number) => void;
  setPersonalInfo: (data: Partial<PersonalInfoData>) => void;
  setAddress: (data: Partial<AddressData>) => void;
  setIdentity: (data: Partial<IdentityData>) => void;
  setSelfieImage: (image: string | null) => void;
  setFrontFile: (upload: FileUpload | null) => void;
  setBackFile: (upload: FileUpload | null) => void;
  setProofFile: (upload: FileUpload | null) => void;
  setLoading: (loading: boolean) => void;
  setSubmitted: (submitted: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

const initialState: KYCState = {
  currentStep: 0,
  personalInfo: {},
  address: {},
  identity: {},
  selfieImage: null,
  frontFile: null,
  backFile: null,
  proofFile: null,
  loading: false,
  submitted: false,
};

function loadState(): Partial<KYCState> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        currentStep: parsed.currentStep ?? 0,
        personalInfo: parsed.personalInfo ?? {},
        address: parsed.address ?? {},
        identity: parsed.identity ?? {},
        selfieImage: parsed.selfieImage ?? null,
      };
    }
  } catch {}
  return {};
}

function saveState(state: Partial<KYCState>) {
  try {
    const data = {
      currentStep: state.currentStep,
      personalInfo: state.personalInfo,
      address: state.address,
      identity: state.identity,
      selfieImage: state.selfieImage,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export const useKYCStore = create<KYCState & KYCActions>((set, get) => ({
  ...initialState,
  ...loadState(),

  setCurrentStep: (step) => {
    set({ currentStep: step });
    saveState(get());
  },

  setPersonalInfo: (data) => {
    set((state) => ({ personalInfo: { ...state.personalInfo, ...data } }));
    saveState(get());
  },

  setAddress: (data) => {
    set((state) => ({ address: { ...state.address, ...data } }));
    saveState(get());
  },

  setIdentity: (data) => {
    set((state) => ({ identity: { ...state.identity, ...data } }));
    saveState(get());
  },

  setSelfieImage: (image) => {
    set({ selfieImage: image });
    saveState(get());
  },

  setFrontFile: (upload) => set({ frontFile: upload }),
  setBackFile: (upload) => set({ backFile: upload }),
  setProofFile: (upload) => set({ proofFile: upload }),
  setLoading: (loading) => set({ loading }),
  setSubmitted: (submitted) => set({ submitted }),

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 4) {
      set({ currentStep: currentStep + 1 });
      saveState(get());
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
      saveState(get());
    }
  },

  goToStep: (step) => {
    if (step >= 0 && step <= 4) {
      set({ currentStep: step });
      saveState(get());
    }
  },

  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    set(initialState);
  },
}));
