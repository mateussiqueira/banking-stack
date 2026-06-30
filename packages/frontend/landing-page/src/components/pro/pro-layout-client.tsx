"use client";

import { usePathname } from "next/navigation";
import { ProSidebar } from "@/components/pro/sidebar";
import { ProHeader } from "@/components/pro/header";
import { AuthGuard } from "@/lib/auth/auth-guard";

// Rotas que não precisam de autenticação
const publicRoutes = ["/pro/login"];

export function ProLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  // Login page — layout simples sem sidebar
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Dashboard — com autenticação
  return (
    <AuthGuard>
      <div className="flex h-screen bg-surface">
        <ProSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <ProHeader />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
