"use client";

import { useEffect, useState } from "react";
import Sidebar, { ToolType } from "./Sidebar";
import DashboardContent from "./DashboardContent";
import ChatComponent from "@/components/ChatComponent";
import CommandPalette from "./CommandPalette";

export default function K8sDashboardPage() {
  const [contexts, setContexts] = useState<{name: string, isCurrent: boolean}[]>([]);
  const [selectedContext, setSelectedContext] = useState<string>("");
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>("default");
  const [selectedTool, setSelectedTool] = useState<ToolType>("pod-resources");
  const [isLoadingNamespaces, setIsLoadingNamespaces] = useState(true);
  const [isLoadingContexts, setIsLoadingContexts] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    async function fetchContexts() {
      try {
        const res = await fetch("/api/tools/k8s-contexts");
        const data = await res.json();
        if (data.data) {
          setContexts(data.data);
          const current = data.data.find((ctx: any) => ctx.isCurrent);
          if (current) {
            setSelectedContext(current.name);
          } else if (data.data.length > 0) {
            setSelectedContext(data.data[0].name);
          }
        }
      } catch (e) {
        console.error("Failed to fetch contexts", e);
      } finally {
        setIsLoadingContexts(false);
      }
    }
    fetchContexts();
  }, []);

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
    let ignore = false;
    async function fetchNamespaces() {
      if (!selectedContext) return;
      
      setIsLoadingNamespaces(true);
      try {
        const url = new URL("/api/tools/k8s-namespaces", window.location.origin);
        url.searchParams.set("context", selectedContext);
        
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to fetch namespaces");
        
        const data = await res.json();
        if (ignore) return;

        if (data.namespaces) {
          setNamespaces(data.namespaces);
          
          // AC: If previously selected namespace doesn't exist, default to 'default' or first in list
          const hasCurrent = data.namespaces.includes(selectedNamespace);
          const hasDefault = data.namespaces.includes("default");
          
          if (!hasCurrent) {
            if (hasDefault) {
              setSelectedNamespace("default");
            } else if (data.namespaces.length > 0) {
              setSelectedNamespace(data.namespaces[0]);
            }
          }
        }
      } catch (e) {
        if (!ignore) {
          console.error("Failed to fetch namespaces", e);
          setNamespaces([]);
        }
      } finally {
        if (!ignore) setIsLoadingNamespaces(false);
      }
    }

    fetchNamespaces();
    return () => { ignore = true; };
  }, [selectedContext]);

  return (
    <div className="flex h-screen w-full bg-background dark:bg-background overflow-hidden relative">
        <Sidebar
          contexts={contexts}
          selectedContext={selectedContext}
          onSelectContext={setSelectedContext}
          namespaces={namespaces}
          selectedNamespace={selectedNamespace}
          onSelectNamespace={setSelectedNamespace}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          isLoadingNamespaces={isLoadingNamespaces}
          isLoadingContexts={isLoadingContexts}
        />
        <main className="flex-1 h-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50">
          <DashboardContent
            namespace={selectedNamespace}
            context={selectedContext}
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
