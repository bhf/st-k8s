"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ToolType } from "./Sidebar";
import { 
  Box, 
  Layers, 
  Database, 
  Server, 
  Network, 
  Globe, 
  Activity, 
  FileText, 
  HardDrive, 
  Cpu,
  Clock,
  Play
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTool: (tool: ToolType) => void;
}

const COMMANDS: { 
  cmd: string; 
  alias: string[]; 
  tool: ToolType; 
  label: string;
  icon: React.ReactNode;
}[] = [
  { cmd: "pods", alias: ["po"], tool: "pod-resources", label: "Pod Resources", icon: <Box className="w-4 h-4" /> },
  { cmd: "deployments", alias: ["deploy"], tool: "deployments", label: "Deployments", icon: <Layers className="w-4 h-4" /> },
  { cmd: "replicasets", alias: ["rs"], tool: "replicasets", label: "ReplicaSets", icon: <Layers className="w-4 h-4" /> },
  { cmd: "statefulsets", alias: ["sts"], tool: "statefulsets", label: "StatefulSets", icon: <Database className="w-4 h-4" /> },
  { cmd: "daemonsets", alias: ["ds"], tool: "daemonsets", label: "DaemonSets", icon: <Server className="w-4 h-4" /> },
  { cmd: "services", alias: ["svc"], tool: "services", label: "Services", icon: <Network className="w-4 h-4" /> },
  { cmd: "ingresses", alias: ["ing"], tool: "ingresses", label: "Ingresses", icon: <Globe className="w-4 h-4" /> },
  { cmd: "endpoints", alias: ["ep"], tool: "endpoints", label: "Endpoints", icon: <Activity className="w-4 h-4" /> },
  { cmd: "events", alias: ["ev"], tool: "events", label: "Events", icon: <Activity className="w-4 h-4" /> },
  { cmd: "volumes", alias: ["pvc"], tool: "volumes", label: "Volumes (PVCs)", icon: <HardDrive className="w-4 h-4" /> },
  { cmd: "nodes", alias: ["no"], tool: "nodes", label: "Nodes", icon: <Cpu className="w-4 h-4" /> },
  { cmd: "configmaps", alias: ["cm"], tool: "configmaps", label: "ConfigMaps", icon: <FileText className="w-4 h-4" /> },
  { cmd: "jobs", alias: ["job"], tool: "jobs", label: "Jobs", icon: <Play className="w-4 h-4" /> },
  { cmd: "cronjobs", alias: ["cj"], tool: "cronjobs", label: "CronJobs", icon: <Clock className="w-4 h-4" /> },
];

export default function CommandPalette({ open, onOpenChange, onSelectTool }: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      // Timeout to allow Dialog to focus first, then we focus input if needed, 
      // but Dialog typically handles focus to the first focusable element. 
      // We will ensure input is focused.
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filteredCommands = React.useMemo(() => {
    // If input starts with ':', strip it
    const cleanQuery = query.startsWith(":") ? query.slice(1) : query;
    if (!cleanQuery) return COMMANDS;
    
    const lowerQuery = cleanQuery.toLowerCase();
    return COMMANDS.filter(c => 
      c.cmd.startsWith(lowerQuery) || 
      c.alias.some(a => a.startsWith(lowerQuery)) ||
      c.label.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        onSelectTool(filteredCommands[selectedIndex].tool);
        onOpenChange(false);
      }
    }
  };

  // Reset selected index when query changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] p-0 overflow-hidden bg-background border-zinc-200 dark:border-zinc-800 shadow-xl top-[20%] translate-y-0 translate-x-[-50%] gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="mr-2 h-4 w-4 shrink-0 text-zinc-500 font-bold">{">"}</span>
          <Input
            ref={inputRef}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 border-none shadow-none focus-visible:ring-0 px-0"
            placeholder="Type a command (e.g., :pods, :svc)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-sm text-zinc-500">
              No commands found.
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <div
                key={command.tool}
                className={cn(
                  "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                  index === selectedIndex ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
                onClick={() => {
                  onSelectTool(command.tool);
                  onOpenChange(false);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="mr-2 flex h-4 w-4 items-center justify-center opacity-70">
                  {command.icon}
                </div>
                <span className="flex-1">{command.label}</span>
                <div className="ml-auto flex items-center gap-1">
                  {/* Alias badges */}
                  {command.alias.map(a => (
                    <span key={a} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-zinc-500">
                      :{a}
                    </span>
                  ))}
                  <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-zinc-500">
                    :{command.cmd}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
