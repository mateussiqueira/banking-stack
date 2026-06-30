"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FolderOpen,
  CreditCard,
  Key,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Equipes", href: "/admin/teams", icon: Users },
      { name: "Alunos", href: "/admin/learners", icon: GraduationCap },
    ],
  },
  {
    title: "Gestão",
    items: [
      { name: "Conteúdo", href: "/admin/content", icon: FolderOpen },
      { name: "Billing", href: "/admin/billing", icon: CreditCard },
      { name: "API Settings", href: "/admin/api", icon: Key },
    ],
  },
  {
    title: "Sistema",
    items: [
      { name: "Configurações", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-surface-200 bg-surface-50 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center border-b border-surface-200 px-4">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nexa-500 text-xs font-bold text-black">
              BS
            </div>
            <span className="text-sm font-semibold text-neutral-50">
              Banking Stack
              <span className="ml-1 text-nexa-400">Admin</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-nexa-500 text-xs font-bold text-black">
            BS
          </div>
        )}
      </div>

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

      <div className="border-t border-surface-200 p-3">
        {!collapsed && (
          <div className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-xs font-medium text-red-400">
              AD
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-neutral-50">
                Admin
              </p>
              <p className="truncate text-xs text-surface-400">Enterprise</p>
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
