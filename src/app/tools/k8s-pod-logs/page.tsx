"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { toast } from "sonner";
import { useChat } from "@/components/ChatContext";
import { MessageSquarePlus } from "lucide-react";
import ChatComponent from "@/components/ChatComponent";

function LogViewer() {
  const searchParams = useSearchParams();
  const namespace = searchParams.get("namespace") || "default";
  const podName = searchParams.get("podName");
  const containerName = searchParams.get("containerName");

  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [tailLines, setTailLines] = useState(100);
  const [sinceSeconds, setSinceSeconds] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { addAttachment } = useChat();

  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    if (!podName || !containerName) return;

    // Stop previous stream if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLogs(["Fetching logs..."]);

    try {
      const res = await fetch(`/api/tools/k8s-pod-logs?namespace=${namespace}&podName=${podName}&containerName=${containerName}&tailLines=${tailLines}${sinceSeconds > 0 ? `&sinceSeconds=${sinceSeconds}` : ''}`);
      const data = await res.json();
      if (data.data) {
        setLogs(data.data.split("\n"));
        toast.success("Logs refreshed");
      } else if (data.error) {
        setLogs([`Error: ${data.error}`]);
        toast.error(`Error: ${data.error}`);
      }
    } catch (err) {
      setLogs([`Fetch failed: ${err}`]);
      toast.error("Fetch failed");
    }
  }, [podName, containerName, namespace, tailLines, sinceSeconds]);

  useEffect(() => {
    if (podName && containerName) {
      fetchLogs();
    }
  }, [podName, containerName, fetchLogs]);

  const startStreaming = async () => {
    if (!podName || !containerName) return;
    setIsStreaming(true);
    setLogs([]);
    toast.info("Starting log stream...");

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(
        `/api/tools/k8s-pod-logs?namespace=${namespace}&podName=${podName}&containerName=${containerName}&stream=true&tailLines=${tailLines}${sinceSeconds > 0 ? `&sinceSeconds=${sinceSeconds}` : ''}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        setLogs(prev => [...prev, ...text.split("\n")]);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        setLogs(prev => [...prev, `Streaming error: ${err}`]);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    toast.info("Log stream stopped");
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(logs.join("\n"));
    toast.success("Logs copied to clipboard");
  };

  const downloadLogs = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `${podName}-${containerName}-${timestamp}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Log download started");
  };

  const handleSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0 && logContainerRef.current?.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({
        text: sel.toString().trim(),
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    } else {
      setSelection(null);
    }
  };

  const addToChat = () => {
    if (!selection) return;
    addAttachment({
      name: `Log snippet from ${podName}`,
      type: 'log-snippet',
      data: {
        pod: podName,
        container: containerName,
        namespace,
        content: selection.text,
        timestamp: new Date().toISOString()
      }
    });
    toast.success("Added selection to chat context");
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  if (!podName || !containerName) {
    return <div className="p-8">Missing podName or containerName query parameters.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black">
      {/* Branded Header */}
      <header className="p-4 border-b flex items-center bg-black justify-between gap-3 shrink-0">
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
        <div className="flex items-center gap-4">
          <ModeToggle />
        </div>
      </header>

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 italic">
              Logs: <span className="text-[#368dab] font-mono">{podName}</span>
            </h1>
            <p className="text-sm text-zinc-500 font-mono">
              [container: {containerName}] [ns: {namespace}]
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={copyToClipboard} variant="outline" size="sm">Copy</Button>
            <Button onClick={downloadLogs} variant="outline" size="sm">Download</Button>
            {!isStreaming ? (
              <Button onClick={startStreaming} size="sm" className="bg-[#368dab] hover:bg-[#2d768f]">Stream</Button>
            ) : (
              <Button onClick={stopStreaming} variant="destructive" size="sm">Stop</Button>
            )}
            <Button onClick={fetchLogs} variant="secondary" size="sm">Refresh</Button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 px-4 rounded-md shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-500 whitespace-nowrap">Tail Lines</label>
            <Input
              type="number"
              value={tailLines}
              onChange={e => setTailLines(parseInt(e.target.value) || 0)}
              className="w-16 h-7 text-xs font-mono px-2"
            />
          </div>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-500 whitespace-nowrap">Since (s)</label>
            <Input
              type="number"
              value={sinceSeconds}
              onChange={e => setSinceSeconds(parseInt(e.target.value) || 0)}
              className="w-16 h-7 text-xs font-mono px-2"
            />
          </div>
          <div className="flex-1" />
          <div className="text-[10px] text-zinc-400 italic">
            Ready to inspect. Stream for live updates.
          </div>
        </div>

        <div
          ref={logContainerRef}
          onMouseUp={handleSelection}
          className="flex-1 bg-zinc-950 text-zinc-300 font-mono p-4 rounded-lg overflow-y-auto whitespace-pre-wrap text-xs border border-zinc-800 scrollbar-thin scrollbar-thumb-zinc-700 shadow-inner relative"
        >
          {logs.map((line, i) => (
            <div key={i} className="hover:bg-zinc-900/50 px-1 py-0.5 border-l-2 border-transparent hover:border-[#368dab] transition-colors leading-relaxed">
              {line}
            </div>
          ))}
          <div ref={logEndRef} />

          {selection && (
            <div
              className="fixed z-50 animate-in fade-in zoom-in duration-200"
              style={{
                left: `${selection.x}px`,
                top: `${selection.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <Button
                size="sm"
                onClick={addToChat}
                className="bg-[#368dab] hover:bg-[#2d768f] text-white shadow-lg border border-white/10 flex items-center gap-2 h-8 px-3"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Add to Chat
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PodLogsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading log viewer...</div>}>
      <LogViewer />
      <ChatComponent />
    </Suspense>
  );
}
