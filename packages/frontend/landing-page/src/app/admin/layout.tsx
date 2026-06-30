import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Providers } from "@/components/pro/providers";
import { AdminLayoutClient } from "@/components/admin/admin-layout-client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Banking Stack Pro — Admin Dashboard",
  description:
    "Painel administrativo para gerenciar equipes, alunos e conteúdo do Banking Stack Pro",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </Providers>
  );
}
