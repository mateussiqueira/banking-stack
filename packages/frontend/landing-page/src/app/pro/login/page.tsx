"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou senha incorretos");
      setLoading(false);
    } else {
      router.push("/pro");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-nexa-500 text-lg font-bold text-black">
            BS
          </div>
          <h1 className="text-heading-lg font-bold text-neutral-50">
            Banking Stack{" "}
            <span className="gradient-text">Pro</span>
          </h1>
          <p className="mt-2 text-body-sm text-surface-400">
            Acesse sua área VIP de engenharia fintech
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-surface-200 bg-surface-50">
          <CardHeader>
            <CardTitle className="text-body-md text-center">
              Entrar na conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-body-sm font-medium text-neutral-50">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full rounded-lg border border-surface-200 bg-surface-100 py-2.5 pl-10 pr-4 text-sm text-neutral-50 placeholder-surface-400 focus:border-nexa-500 focus:outline-none focus:ring-1 focus:ring-nexa-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-body-sm font-medium text-neutral-50">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-lg border border-surface-200 bg-surface-100 py-2.5 pl-10 pr-4 text-sm text-neutral-50 placeholder-surface-400 focus:border-nexa-500 focus:outline-none focus:ring-1 focus:ring-nexa-500"
                  />
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
              >
                Entrar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 rounded-lg bg-surface-100 p-4">
              <p className="text-xs font-medium text-surface-400 mb-2">
                Credenciais de teste:
              </p>
              <code className="block text-xs text-nexa-400">
                mateus@bankingstack.com / pro2024
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Back to home */}
        <p className="text-center text-body-sm text-surface-400">
          <a href="/" className="text-nexa-400 hover:text-nexa-300">
            ← Voltar para o site
          </a>
        </p>
      </div>
    </div>
  );
}
