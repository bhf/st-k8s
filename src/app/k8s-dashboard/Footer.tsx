"use client";

import { cn } from "@/lib/utils";
import { Terminal, Box, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FooterProps {
  contexts: { name: string; isCurrent: boolean }[];
  selectedContext: string;
  onSelectContext: (ctx: string) => void;
  namespaces: string[];
  selectedNamespace: string;
  onSelectNamespace: (ns: string) => void;
  isLoadingNamespaces: boolean;
  isLoadingContexts: boolean;
}

export default function Footer({
  contexts,
  selectedContext,
  onSelectContext,
  namespaces,
  selectedNamespace,
  onSelectNamespace,
  isLoadingNamespaces,
  isLoadingContexts,
}: FooterProps) {
  return (
    <footer className="h-9 bg-zinc-950 border-t border-zinc-800 flex items-center px-3 justify-between text-[11px] text-zinc-400 select-none shrink-0 z-50">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 hover:bg-zinc-800/50 px-2 py-1 rounded transition-colors cursor-default">
          <Terminal className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-semibold text-zinc-300">ST-K8S</span>
        </div>

        <div className="w-px h-4 bg-zinc-800 mx-1" />

        <div className="flex items-center gap-2 group">
          <Globe className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
          <span className="font-mono text-zinc-500 uppercase tracking-tighter text-[10px] shrink-0">Context</span>
          <Select 
            value={selectedContext} 
            onValueChange={onSelectContext} 
            disabled={isLoadingContexts}
          >
            <SelectTrigger 
              aria-label="Context"
              className="h-6 border-none bg-transparent hover:bg-zinc-800/50 text-zinc-300 hover:text-white px-1 gap-1 focus:ring-0 shadow-none text-[11px] min-w-0"
            >
              <SelectValue placeholder="Context" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
              {contexts.map((ctx) => (
                <SelectItem key={ctx.name} value={ctx.name} className="focus:bg-zinc-800 focus:text-white text-[11px]">
                  {ctx.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-4 bg-zinc-800 mx-1" />

        <div className="flex items-center gap-2 group">
          <Box className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
          <span className="font-mono text-zinc-500 uppercase tracking-tighter text-[10px] shrink-0">Namespace</span>
          <Select 
            value={selectedNamespace} 
            onValueChange={onSelectNamespace} 
            disabled={isLoadingNamespaces}
          >
            <SelectTrigger 
              aria-label="Namespace"
              className="h-6 border-none bg-transparent hover:bg-zinc-800/50 text-zinc-300 hover:text-white px-1 gap-1 focus:ring-0 shadow-none text-[11px] min-w-0"
            >
              <SelectValue placeholder="Namespace" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
              {namespaces.map((ns) => (
                <SelectItem key={ns} value={ns} className="focus:bg-zinc-800 focus:text-white text-[11px]">
                  {ns}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 px-2 ml-auto">
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-500 mr-2">
          © 2026 <a href="https://sanjeev.pages.dev/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">StayTuned</a>
        </div>
        <div className="w-px h-3 bg-zinc-800 mx-1" />
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          CONNECTED
        </div>
      </div>
    </footer>
  );
}
