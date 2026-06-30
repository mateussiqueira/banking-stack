"use client";

import { Bell, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-200 bg-surface-50 px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
        <input
          type="text"
          placeholder="Buscar alunos, equipes, conteúdo..."
          className="w-full rounded-lg border border-surface-200 bg-surface-100 py-2 pl-10 pr-4 text-sm text-neutral-50 placeholder-surface-400 focus:border-nexa-500 focus:outline-none focus:ring-1 focus:ring-nexa-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-neutral-50">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-nexa-500" />
        </button>

        <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-400 hover:bg-surface-100 hover:text-neutral-50">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20 text-xs font-medium text-red-400">
            AD
          </div>
          <span className="hidden md:inline">Admin</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
