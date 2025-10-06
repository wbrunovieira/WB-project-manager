"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderKanban, Folder, Building2, Clock, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "My Issues", href: "/my-issues", icon: FolderKanban },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Time Tracking", href: "/time-tracking", icon: Clock },
  { name: "Workspaces", href: "/workspaces", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-60 flex-col border-r border-[#792990]/20 bg-[#350459]">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[#792990]/20 px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#792990] to-[#350459] ring-2 ring-[#FFB947]/30">
            <span className="text-base font-bold text-white">WB</span>
          </div>
          <span className="font-bold text-gray-100">WB Digital</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-[#792990] text-gray-100 shadow-lg shadow-[#792990]/30"
                  : "text-gray-300 hover:bg-[#792990]/20 hover:text-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#792990]/20 p-4">
        <div className="text-xs text-gray-400">
          <kbd className="rounded bg-[#792990]/20 px-2 py-1 text-gray-300 border border-[#792990]/30">
            ⌘K
          </kbd>{" "}
          to open command palette
        </div>
      </div>
    </div>
  );
}
