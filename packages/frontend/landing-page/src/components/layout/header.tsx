"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Zap } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Recursos", labelEn: "Features" },
  { href: "#how-it-works", label: "Como Funciona", labelEn: "How It Works" },
  { href: "#pricing", label: "Preços", labelEn: "Pricing" },
  { href: "#testimonials", label: "Depoimentos", labelEn: "Testimonials" },
];

export function Header() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-surface/95 backdrop-blur-md border-b border-surface-100"
          : "bg-transparent"
      )}
    >
      <Container>
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-nexa-500 flex items-center justify-center transition-transform group-hover:scale-110">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="text-heading-sm font-bold text-neutral-50">
              Nexa
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-body-sm text-surface-400 hover:text-nexa-500 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
            <Button variant="primary" size="sm">
              Começar Grátis
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-surface-400 hover:text-neutral-50"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </Container>

      <div
        className={cn(
          "md:hidden transition-all duration-300 overflow-hidden",
          isOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 py-4 bg-surface-100 border-t border-surface-200 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-body-md text-surface-400 hover:text-nexa-500 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 space-y-2">
            <Button variant="ghost" size="md" className="w-full">
              Entrar
            </Button>
            <Button variant="primary" size="md" className="w-full">
              Começar Grátis
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
