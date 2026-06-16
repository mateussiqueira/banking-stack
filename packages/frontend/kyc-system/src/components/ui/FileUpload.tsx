import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface FileUploadProps {
  accept?: Record<string, string[]>;
  maxSize?: number;
  label?: string;
  error?: string;
  value?: File | null;
  onChange?: (file: File | null) => void;
  preview?: string | null;
}

export function FileUpload({
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf'],
  },
  maxSize = 5 * 1024 * 1024,
  label,
  error,
  value,
  onChange,
  preview: externalPreview,
}: FileUploadProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const preview = externalPreview ?? localPreview;

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      onChange?.(file);
      if (file.type.startsWith('image/')) {
        setLocalPreview(URL.createObjectURL(file));
      } else {
        setLocalPreview(null);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
  });

  const handleRemove = () => {
    onChange?.(null);
    setLocalPreview(null);
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </p>
      )}

      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <File className="h-8 w-8 text-neutral-400" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.name}</p>
            <p className="text-xs text-neutral-500">
              {(value.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
            isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
              : 'border-neutral-300 hover:border-primary-400 dark:border-neutral-600'
          )}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <Upload className="h-8 w-8 text-primary-500" />
          ) : (
            <Image className="h-8 w-8 text-neutral-400" />
          )}
          <div className="text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Arraste o arquivo ou clique para selecionar
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              PDF, JPG ou PNG até 5MB
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-semantic-error">{error}</p>}
    </div>
  );
}
