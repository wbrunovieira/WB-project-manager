"use client";

import { useEffect, useState } from "react";

interface DateDisplayProps {
  date: Date | string;
  className?: string;
}

export function DateDisplay({ date, className }: DateDisplayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder during SSR to avoid hydration mismatch
    return <span className={className}>--/--/----</span>;
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;
  return <span className={className}>{dateObj.toLocaleDateString()}</span>;
}
