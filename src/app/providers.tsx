"use client";
import { ThemeProvider } from "next-themes";
import { RefreshProvider } from "@/lib/refresh-context";
import { ChatProvider } from "@/components/ChatContext";
import type { ReactNode } from "react";

// Add other global client providers here as needed
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RefreshProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </RefreshProvider>
    </ThemeProvider>
  );
}
