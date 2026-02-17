"use client";
import { ThemeProvider } from "next-themes";
import { RefreshProvider } from "@/lib/refresh-context";
import type { ReactNode } from "react";

// Add other global client providers here as needed
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RefreshProvider>
        {children}
      </RefreshProvider>
    </ThemeProvider>
  );
}
