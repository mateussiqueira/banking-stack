import { useState, useCallback, useEffect } from 'react';

interface UseFileUploadOptions {
  maxSize?: number;
  acceptedTypes?: string[];
}

interface FileUploadState {
  file: File | null;
  preview: string | null;
  error: string | null;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { maxSize = 5 * 1024 * 1024, acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'] } = options;
  const [state, setState] = useState<FileUploadState>({ file: null, preview: null, error: null });

  useEffect(() => {
    return () => {
      if (state.preview) URL.revokeObjectURL(state.preview);
    };
  }, [state.preview]);

  const setFile = useCallback(
    (file: File | null) => {
      setState((prev) => {
        if (prev.preview) URL.revokeObjectURL(prev.preview);
        if (!file) return { file: null, preview: null, error: null };

        if (file.size > maxSize) {
          return { file: null, preview: null, error: `Arquivo deve ter no máximo ${maxSize / 1024 / 1024}MB` };
        }
        if (!acceptedTypes.includes(file.type)) {
          return { file: null, preview: null, error: 'Tipo de arquivo não aceito' };
        }

        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
        return { file, preview, error: null };
      });
    },
    [maxSize, acceptedTypes]
  );

  const clear = useCallback(() => {
    setState((prev) => {
      if (prev.preview) URL.revokeObjectURL(prev.preview);
      return { file: null, preview: null, error: null };
    });
  }, []);

  return { ...state, setFile, clear };
}

// TODO: add file dimension validation for images (min 300dpi)
