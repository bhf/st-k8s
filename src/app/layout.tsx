import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

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
          <div className="min-h-screen pb-14">
            {children}
          </div>
          <footer className="hidden md:flex fixed bottom-0 left-0 w-full bg-black text-white h-8 items-center justify-center z-50 text-s overflow-hidden whitespace-nowrap">
            © 2026 <a href="https://sanjeev.pages.dev/" target="_blank" rel="noopener noreferrer" className="underline ml-1">StayTuned</a>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
