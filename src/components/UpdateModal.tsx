"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal, ExternalLink, Clipboard, Check } from "lucide-react";
import { useState } from "react";

interface UpdateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  latestVersion: string;
}

export function UpdateModal({ isOpen, onOpenChange, latestVersion }: UpdateModalProps) {
  const [copied, setCopied] = useState(false);
  const updateCommand = "brew update && brew upgrade st-k8s";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(updateCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <Terminal className="w-5 h-5" />
            Update Available: v{latestVersion}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            A new version of ST-K8S is available. Follow the commands below to update using Homebrew.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 relative group">
            <code className="text-zinc-300 font-mono text-sm block pr-10">
              {updateCommand}
            </code>
            <button
              onClick={copyToClipboard}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-500">
              Not using Homebrew? You can download the latest binary directly from GitHub.
            </p>
            <Button
              variant="outline"
              asChild
              className="w-full border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 hover:text-white"
            >
              <a
                href="https://github.com/bhf/st-k8s/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                View Releases on GitHub
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
