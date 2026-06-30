"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Code2,
  Layers,
  Trophy,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
  {
    title: "Visão Geral",
    items: [
      { name: "Dashboard", href: "/pro", icon: Layers },
      { name: "Meu Progresso", href: "/pro/progress", icon: Trophy },
    ],
  },
  {
    title: "Módulos",
    items: [
      { name: "🐹 Go — Alta Performance", href: "/pro/go", icon: Code2 },
      { name: "🦀 Rust — Missão Crítica", href: "/pro/rust", icon: Code2 },
      {
        name: "🌐 Sistemas Distribuídos",
        href: "/pro/distributed",
        icon: Code2,
      },
    ],
  },
  {
    title: "Comunidade",
    items: [
      { name: "Desafios", href: "/pro/challenges", icon: BookOpen },
      { name: "Configurações", href: "/pro/settings", icon: Settings },
    ],
  },
];

export function ProSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-surface-200 bg-surface-50 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-surface-200 px-4">
        {!collapsed && (
          <Link href="/pro" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nexa-500 text-xs font-bold text-black">
              BS
            </div>
            <span className="text-sm font-semibold text-neutral-50">
              Banking Stack
              <span className="ml-1 text-nexa-400">Pro</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-nexa-500 text-xs font-bold text-black">
            BS
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {navigation.map((group) => (
          <div key={group.title} className="mb-6">
            {!collapsed && (
              <h4 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-surface-400">
                {group.title}
              </h4>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-nexa-500/10 text-nexa-400"
                          : "text-surface-400 hover:bg-surface-100 hover:text-neutral-50"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User & Collapse */}
      <div className="border-t border-surface-200 p-3">
        {!collapsed && (
          <div className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nexa-500/20 text-xs font-medium text-nexa-400">
              MS
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-neutral-50">
                Mateus S.
              </p>
              <p className="truncate text-xs text-surface-400">Plano Pro</p>
            </div>
            <LogOut className="h-4 w-4 text-surface-400" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg py-2 text-surface-400 hover:bg-surface-100"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
