"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPlan?: "pro" | "enterprise";
}

export function AuthGuard({ children, requiredPlan = "pro" }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/pro/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-nexa-500" />
          <p className="text-body-sm text-surface-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  // Verificar plano (para contentores enterprise)
  if (requiredPlan === "enterprise" && (session?.user as any)?.plan !== "enterprise") {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <h1 className="text-heading-lg font-bold text-neutral-50 mb-2">
            Acesso Restrito
          </h1>
          <p className="text-body-md text-surface-400">
            Este conteúdo requer plano Enterprise.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
