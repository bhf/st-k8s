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
import {
  Cpu,
  Plus,
  Clipboard,
  Monitor,
  ExternalLink,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

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
  const [projectPath, setProjectPath] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [versionInfo, setVersionInfo] = useState<{ version: string; latestVersion: string | null; updateAvailable: boolean } | null>(null);

  useEffect(() => {
    // Helper to fetch with absolute URL for test environments
    const safeFetch = (path: string) => {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      return fetch(new URL(path, baseUrl).toString());
    };

    safeFetch("/api/config")
      .then((res) => res.json())
      .then((data) => setProjectPath(data.projectPath || ""))
      .catch(console.error);

    safeFetch("/api/version")
      .then((res) => res.json())
      .then((data) => setVersionInfo(data))
      .catch(console.error);
  }, []);

  const mcpConfig = {
    servers: {
      "st-k8s": {
        command: "npm",
        args: ["run", "mcp"],
        cwd: projectPath || "/absolute/path/to/st-k8s",
      },
    },
  };

  const getCursorDeepLink = () => {
    const configStr = JSON.stringify(mcpConfig.servers["st-k8s"]);
    const encodedConfig = btoa(configStr);
    return `cursor://anysphere.cursor-deeplink/mcp/install?name=st-k8s&config=${encodedConfig}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(mcpConfig, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
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
        {versionInfo && (
          <>
            {versionInfo.updateAvailable ? (
              <a
                href="https://github.com/bhf/st-k8s/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-[9px] text-amber-500 hover:text-amber-400 transition-colors bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
                title={`Update available: v${versionInfo.latestVersion}`}
              >
                ↑ v{versionInfo.latestVersion}
              </a>
            ) : (
              <div className="font-mono text-[9px] text-zinc-500" title="Current version">
                v{versionInfo.version}
              </div>
            )}
            <div className="w-px h-3 bg-zinc-800 mx-1" />
          </>
        )}
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-500 mr-2">
          © 2026 <a href="https://sanjeev.pages.dev/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">StayTuned</a>
        </div>
        <div className="w-px h-3 bg-zinc-800 mx-1" />
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          CONNECTED
        </div>

        <div className="w-px h-3 bg-zinc-800 mx-1" />

        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 hover:bg-zinc-800/50 px-2 py-1 rounded transition-colors text-zinc-400 hover:text-emerald-400 group h-6 outline-none">
              <Cpu className="w-3.5 h-3.5" />
              <span className="font-medium uppercase tracking-tighter text-[10px]">MCP</span>
              <Plus className="w-2.5 h-2.5 text-zinc-600 group-hover:text-emerald-500/50 transition-colors" />
            </button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-400 outline-none">
                <Cpu className="w-5 h-5" />
                MCP Server Integration
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Connect your Kubernetes cluster to your AI editor via Model Context Protocol.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold">Cursor</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-mono tracking-wider">Recommended</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  One-click installation for Cursor. This will add the <code className="text-zinc-300">st-k8s</code> server to your MCP settings.
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-all font-semibold"
                >
                  <a href={getCursorDeepLink()}>
                    Install in Cursor
                    <ExternalLink className="ml-2 w-3 h-3" />
                  </a>
                </Button>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-semibold">VS Code</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Copy the configuration to your <code className="text-zinc-300">mcp.json</code> file (usually in <code className="text-zinc-300">~/.vscode/mcp.json</code>).
                </p>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="w-full bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300 transition-all font-semibold"
                >
                  {copied ? (
                    <>
                      Copied!
                      <Check className="ml-2 w-3.5 h-3.5 text-emerald-500" />
                    </>
                  ) : (
                    <>
                      Copy Configuration
                      <Clipboard className="ml-2 w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </footer>
  );
}
