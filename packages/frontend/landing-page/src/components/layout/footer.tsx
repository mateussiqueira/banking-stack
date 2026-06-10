import * as React from "react";
import Link from "next/link";
import { Zap, Github, Twitter, Linkedin, Youtube } from "lucide-react";
import { Container } from "@/components/ui/container";

const footerLinks = {
  produto: {
    label: "Produto",
    labelEn: "Product",
    links: [
      { href: "#", label: "Pix" },
      { href: "#", label: "Open Finance" },
      { href: "#", label: "KYC" },
      { href: "#", label: "Relatórios" },
      { href: "#", label: "API" },
    ],
  },
  empresa: {
    label: "Empresa",
    labelEn: "Company",
    links: [
      { href: "#", label: "Sobre" },
      { href: "#", label: "Blog" },
      { href: "#", label: "Carreiras" },
      { href: "#", label: "Contato" },
    ],
  },
  recursos: {
    label: "Recursos",
    labelEn: "Resources",
    links: [
      { href: "#", label: "Documentação" },
      { href: "#", label: "Status" },
      { href: "#", label: "Changelog" },
      { href: "#", label: "FAQ" },
    ],
  },
  legal: {
    label: "Legal",
    labelEn: "Legal",
    links: [
      { href: "#", label: "Privacidade" },
      { href: "#", label: "Termos" },
      { href: "#", label: "Segurança" },
    ],
  },
};

const socialLinks = [
  { href: "#", icon: Github, label: "GitHub" },
  { href: "#", icon: Twitter, label: "Twitter" },
  { href: "#", icon: Linkedin, label: "LinkedIn" },
  { href: "#", icon: Youtube, label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-surface-50 border-t border-surface-100">
      <Container className="py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-nexa-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-black" />
              </div>
              <span className="text-heading-sm font-bold text-neutral-50">
                Nexa
              </span>
            </Link>
            <p className="text-body-sm text-surface-400 mb-4 max-w-xs">
              A plataforma completa de pagamentos para o seu negócio crescer.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center text-surface-400 hover:text-nexa-500 hover:bg-surface-200 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="text-body-sm font-semibold text-neutral-50 mb-3">
                {section.label}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-body-sm text-surface-400 hover:text-nexa-500 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-surface-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-caption text-surface-400">
            © {new Date().getFullYear()} Nexa. Todos os direitos reservados.
          </p>
          <p className="text-caption text-surface-400">
            Feito com ❤️ para transformar pagamentos no Brasil
          </p>
        </div>
      </Container>
    </footer>
  );
}
