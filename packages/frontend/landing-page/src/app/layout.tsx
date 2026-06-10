import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Nexa | Plataforma de Pagamentos",
  description:
    "Transforme seus pagamentos com Nexa. Aceite Pix, Open Finance, KYC e relatórios em tempo real.",
  keywords: [
    "nexa",
    "pagamentos",
    "pix",
    "open finance",
    "fintech",
    "payment",
    "brazil",
  ],
  openGraph: {
    title: "Nexa | Plataforma de Pagamentos",
    description:
      "Transforme seus pagamentos com Nexa. Aceite Pix, Open Finance, KYC e relatórios em tempo real.",
    type: "website",
    locale: "pt_BR",
    siteName: "Nexa",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
