"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Box,
  Layers,
  Network,
  Server,
  Activity,
  Database,
  Globe,
  HardDrive,
  Cpu,
  FileText,
  Clock,
  Play,
  Lock
} from "lucide-react";
import Image from "next/image";
import {ModeToggle} from "@/components/ui/mode-toggle";

export type ToolType =
  | "pod-resources"
  | "deployments"
  | "replicasets"
  | "statefulsets"
  | "daemonsets"
  | "services"
  | "ingresses"
  | "endpoints"
  | "events"
  | "volumes"
  | "nodes"
  | "configmaps"
  | "jobs"
  | "cronjobs"
  | "serviceaccounts"
  | "roles"
  | "rolebindings";

interface SidebarProps {
  contexts: {name: string, isCurrent: boolean}[];
  selectedContext: string;
  onSelectContext: (ctx: string) => void;
  namespaces: string[];
  selectedNamespace: string;
  onSelectNamespace: (ns: string) => void;
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  isLoadingNamespaces: boolean;
  isLoadingContexts: boolean;
}

const TOOLS: { id: ToolType; label: string; icon: React.ReactNode }[] = [
  { id: "pod-resources", label: "Pod Resources", icon: <Box className="w-4 h-4" /> },
  { id: "deployments", label: "Deployments", icon: <Layers className="w-4 h-4" /> },
  { id: "replicasets", label: "ReplicaSets", icon: <Layers className="w-4 h-4" /> },
  { id: "statefulsets", label: "StatefulSets", icon: <Database className="w-4 h-4" /> },
  { id: "daemonsets", label: "DaemonSets", icon: <Server className="w-4 h-4" /> },
  { id: "services", label: "Services", icon: <Network className="w-4 h-4" /> },
  { id: "ingresses", label: "Ingresses", icon: <Globe className="w-4 h-4" /> },
  { id: "endpoints", label: "Endpoints", icon: <Activity className="w-4 h-4" /> },
  { id: "configmaps", label: "ConfigMaps", icon: <FileText className="w-4 h-4" /> },
  { id: "jobs", label: "Jobs", icon: <Play className="w-4 h-4" /> },
  { id: "cronjobs", label: "CronJobs", icon: <Clock className="w-4 h-4" /> },
  { id: "volumes", label: "Volumes (PVCs)", icon: <HardDrive className="w-4 h-4" /> },
  { id: "nodes", label: "Nodes", icon: <Cpu className="w-4 h-4" /> },
  { id: "events", label: "Events", icon: <Activity className="w-4 h-4" /> },
  { id: "serviceaccounts", label: "ServiceAccounts", icon: <Lock className="w-4 h-4" /> },
  { id: "roles", label: "Roles", icon: <Lock className="w-4 h-4" /> },
  { id: "rolebindings", label: "RoleBindings", icon: <Lock className="w-4 h-4" /> },
];

export default function Sidebar({
  contexts,
  selectedContext,
  onSelectContext,
  namespaces,
  selectedNamespace,
  onSelectNamespace,
  selectedTool,
  onSelectTool,
  isLoadingNamespaces,
  isLoadingContexts
}: SidebarProps) {
  return (
    <aside className="hidden md:flex md:w-64 bg-zinc-50 dark:bg-zinc-900 border-r flex-col h-full">
      <div className="p-4 border-b flex items-center bg-black justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Image
            src="/logo2.png"
            alt="st-k8s"
            width={28}
            height={28}
            priority
            className="shrink-0"
          />
          <span className="font-bold text-xl text-[#368dab] bg-black px-2 py-1 rounded truncate">
            ~$ ST-K8s_
          </span>
        </div>
        <ModeToggle />
      </div>

      <div className="p-4 border-b space-y-4">
        <div className="space-y-2">
          <label htmlFor="context-select" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Context
          </label>
          <select
            id="context-select"
            className="w-full p-2 rounded-md border text-sm bg-white dark:bg-black"
            value={selectedContext}
            onChange={(e) => onSelectContext(e.target.value)}
            disabled={isLoadingContexts}
          >
            {isLoadingContexts ? (
              <option>Loading contexts...</option>
            ) : (
              contexts.map(ctx => (
                <option key={ctx.name} value={ctx.name}>
                  {ctx.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="namespace-select" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Namespace
          </label>
          <select
            id="namespace-select"
            className="w-full p-2 rounded-md border text-sm bg-white dark:bg-black"
            value={selectedNamespace}
            onChange={(e) => onSelectNamespace(e.target.value)}
            disabled={isLoadingNamespaces}
          >
            {isLoadingNamespaces ? (
              <option>Loading namespaces...</option>
            ) : (
              namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {TOOLS.map((tool) => (
            <Button
              key={tool.id}
              variant={selectedTool === tool.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                selectedTool === tool.id && "bg-zinc-200 dark:bg-zinc-800"
              )}
              onClick={() => onSelectTool(tool.id)}
            >
              {tool.icon}
              <span className="ml-2">{tool.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}
