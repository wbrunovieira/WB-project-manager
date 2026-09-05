"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  initials: string;
}

export function UserDropdown({ user, initials }: UserDropdownProps) {
  const handleLogout = async () => {
    const response = await fetch("/api/auth/signout", {
      method: "POST",
    });

    if (response.ok) {
      window.location.href = "/login";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="ring-2 ring-brand/30 hover:ring-accent/50 transition-all">
          <AvatarFallback className="bg-gradient-to-br from-brand to-surface-elevated text-white text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-surface-elevated border-brand/50 text-gray-200">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-100">{user.name}</span>
            <span className="text-xs text-gray-400">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-brand/30" />
        <DropdownMenuItem className="hover:bg-brand/50 focus:bg-brand/50 cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-brand/50 focus:bg-brand/50 cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-brand/30" />
        <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-500/20 focus:bg-red-500/20 cursor-pointer text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
