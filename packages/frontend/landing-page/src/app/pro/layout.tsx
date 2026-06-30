import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ProSidebar } from "@/components/pro/sidebar";
import { ProHeader } from "@/components/pro/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Banking Stack Pro — Área VIP",
  description:
    "Engenharia de Baixa Latência & FinTech com Go, Rust e Sistemas Distribuídos",
};

export default function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-surface">
      <ProSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ProHeader />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
