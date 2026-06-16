import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SelfieCaptureProps {
  onCapture: (image: string) => void;
  value?: string | null;
}

export function SelfieCapture({ onCapture, value }: SelfieCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [facingMode] = useState<'user'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(value ?? null);

  const startCountdown = useCallback(() => {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        capture();
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, []);

  const capture = useCallback(() => {
    const image = webcamRef.current?.getScreenshot();
    if (image) {
      setCapturedImage(image);
      onCapture(image);
    }
  }, [onCapture]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setCountdown(null);
  }, []);

  if (capturedImage) {
    return (
      <div className="space-y-4">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-xl bg-neutral-900">
          <img
            src={capturedImage}
            alt="Selfie capturada"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 ring-2 ring-primary-500 ring-inset" />
        </div>
        <div className="flex justify-center">
          <Button variant="outline" onClick={retake}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tirar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-xl bg-neutral-900">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode, width: 720, height: 960 }}
          className="h-full w-full object-cover"
          mirrored
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              'h-56 w-44 rounded-2xl border-2 border-dashed transition-colors',
              countdown !== null
                ? 'border-primary-400'
                : 'border-white/40'
            )}
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <AlertCircle className="h-3 w-3" />
            <span>Mantenha o rosto visível e com boa iluminação</span>
          </div>
        </div>

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-6xl font-bold text-white animate-ping">
              {countdown}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        {countdown === null && (
          <Button onClick={startCountdown}>
            <Camera className="mr-2 h-4 w-4" />
            Capturar Selfie
          </Button>
        )}
      </div>
    </div>
  );
}
