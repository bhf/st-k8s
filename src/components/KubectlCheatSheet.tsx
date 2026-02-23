"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clipboard, Check, Terminal } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface KubectlCheatSheetProps {
  resourceType: string;
  resourceName: string;
  namespace?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const toolToKubectlMap: Record<string, string> = {
  "pod-resources": "pod",
  "pods": "pod",
  "deployments": "deployment",
  "replicasets": "replicaset",
  "statefulsets": "statefulset",
  "daemonsets": "daemonset",
  "services": "service",
  "ingresses": "ingress",
  "endpoints": "endpoints",
  "events": "event",
  "configmaps": "configmap",
  "jobs": "job",
  "cronjobs": "cronjob",
  "serviceaccounts": "serviceaccount",
  "roles": "role",
  "rolebindings": "rolebinding",
  "nodes": "node",
  "volumes": "pv",
};

export function KubectlCheatSheet({
  resourceType,
  resourceName,
  namespace,
  open,
  onOpenChange,
}: KubectlCheatSheetProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const k8sType = toolToKubectlMap[resourceType] || resourceType;
  const nsFlag = namespace && namespace !== "all" ? ` -n ${namespace}` : "";

  const commands = [
    {
      label: "Describe Resource",
      command: `kubectl describe ${k8sType} ${resourceName}${nsFlag}`,
      description: "Show detailed information about the resource.",
    },
    {
      label: "View YAML",
      command: `kubectl get ${k8sType} ${resourceName}${nsFlag} -o yaml`,
      description: "Get the resource definition in YAML format.",
    },
    {
      label: "Delete Resource",
      command: `kubectl delete ${k8sType} ${resourceName}${nsFlag}`,
      description: "Delete the resource from the cluster.",
    },
  ];

  // Resource-specific commands
  if (k8sType === "pod") {
    commands.push(
      {
        label: "View Logs",
        command: `kubectl logs ${resourceName}${nsFlag}`,
        description: "Fetch the logs of the first container in the pod.",
      },
      {
        label: "Interactive Shell",
        command: `kubectl exec -it ${resourceName}${nsFlag} -- /bin/sh`,
        description: "Open an interactive shell inside the pod.",
      },
      {
        label: "Port Forward",
        command: `kubectl port-forward ${resourceName}${nsFlag} 8080:8080`,
        description: "Forward a local port to a port on the pod.",
      }
    );
  } else if (k8sType === "service") {
    commands.push({
      label: "Port Forward",
      command: `kubectl port-forward svc/${resourceName}${nsFlag} 8080:80`,
      description: "Forward a local port to the service.",
    });
  }

  if (["deployment", "statefulset", "replicaset"].includes(k8sType)) {
    commands.push({
      label: "Scale Resource",
      command: `kubectl scale ${k8sType} ${resourceName}${nsFlag} --replicas=3`,
      description: "Scale the resource to a specific number of replicas.",
    });
  }

  if (["deployment", "statefulset", "daemonset"].includes(k8sType)) {
    commands.push({
      label: "Restart (Rollout)",
      command: `kubectl rollout restart ${k8sType}/${resourceName}${nsFlag}`,
      description: "Perform a rolling restart of the resource.",
    });
  }

  if (k8sType === "node") {
    commands.push(
      {
        label: "Cordon Node",
        command: `kubectl cordon ${resourceName}`,
        description: "Mark node as unschedulable (prevents new pods from being scheduled).",
      },
      {
        label: "Drain Node",
        command: `kubectl drain ${resourceName} --ignore-daemonsets --delete-emptydir-data`,
        description: "Evict pods from node in preparation for maintenance.",
      },
      {
        label: "Uncordon Node",
        command: `kubectl uncordon ${resourceName}`,
        description: "Mark node as schedulable.",
      }
    );
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("Command copied to clipboard");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error("Failed to copy command");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Kubectl Cheat Sheet: {resourceName}
          </DialogTitle>
          <DialogDescription>
            Quick actions for {k8sType} in namespace {namespace || "default"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {commands.map((cmd, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/50"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {cmd.label}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => copyToClipboard(cmd.command, index)}
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                  {copiedIndex === index ? "Copied" : "Copy"}
                </Button>
              </div>
              <code className="text-xs bg-zinc-200 dark:bg-zinc-800 p-2 rounded block whitespace-pre-wrap break-all border border-zinc-300 dark:border-zinc-700 font-mono">
                {cmd.command}
              </code>
              <p className="text-[11px] text-zinc-500 italic">{cmd.description}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
