"use client";

import ChatComponent from "@/components/ChatComponent";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize2 } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  return (
    <div className="flex h-screen w-full bg-zinc-950 overflow-hidden flex-col">
      {/* Header for full-page chat */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-black">
        <div className="flex items-center gap-4">
          <Link href="/k8s-dashboard">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Maximize2 className="w-5 h-5 text-[#368dab]" />
            <h1 className="text-xl font-bold text-white tracking-tight">Full-Page Chat</h1>
          </div>
        </div>
        <div className="text-xs text-zinc-500 font-mono hidden sm:block">
          Distraction-free Kubernetes Assistant
        </div>
      </header>
      
      {/* Main Chat Area */}
      <main className="flex-1 relative overflow-hidden flex justify-center p-4">
        <div className="w-full h-full">
          <ChatComponent isFullPage={true} />
        </div>
      </main>
    </div>
  );
}
