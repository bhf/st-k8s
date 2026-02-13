"use client";

import { useEffect, useState } from "react";
import Sidebar, { ToolType } from "./Sidebar";
import DashboardContent from "./DashboardContent";
import ChatComponent from "@/components/ChatComponent";
import CommandPalette from "./CommandPalette";

export default function K8sDashboardPage() {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>("default");
  const [selectedTool, setSelectedTool] = useState<ToolType>("pod-resources");
  const [isLoadingNamespaces, setIsLoadingNamespaces] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Open on ":" if not typing in an input
      if (e.key === ":" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    async function fetchNamespaces() {
      try {
        const res = await fetch("/api/tools/k8s-namespaces");
        const data = await res.json();
        if (data.namespaces) {
          setNamespaces(data.namespaces);
          if (data.namespaces.length > 0 && !data.namespaces.includes("default")) {
             setSelectedNamespace(data.namespaces[0]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch namespaces", e);
      } finally {
        setIsLoadingNamespaces(false);
      }
    }

    fetchNamespaces();
  }, []);

  return (
    <div className="flex h-screen w-full bg-background dark:bg-background overflow-hidden relative">
        <Sidebar
          namespaces={namespaces}
          selectedNamespace={selectedNamespace}
          onSelectNamespace={setSelectedNamespace}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          isLoadingNamespaces={isLoadingNamespaces}
        />
        <main className="flex-1 h-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50">
          <DashboardContent
            namespace={selectedNamespace}
            tool={selectedTool}
          />
        </main>
        
        <CommandPalette 
          open={isCommandPaletteOpen} 
          onOpenChange={setIsCommandPaletteOpen} 
          onSelectTool={setSelectedTool} 
        />
        <ChatComponent />
    </div>
  );
}
