import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StayTuned K8S",
  description: "A K8s dashboard, API and MCP server. Dark mode with k8s inspired theme.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Global client providers (e.g., NextAuth SessionProvider) */}
        <Providers>
          {children}
          <Toaster 
            position="top-center" 
            toastOptions={{
              className: "font-mono text-xs border-zinc-800 bg-zinc-950 text-zinc-100 shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-none border-l-4",
              classNames: {
                success: "border-l-green-500",
                error: "border-l-red-500",
                info: "border-l-[#368dab]",
              }
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
