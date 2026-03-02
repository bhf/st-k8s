"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="flex flex-col h-screen dark:bg-black">
      {/* Branded Header */}
      <header className="p-4 border-b flex items-center bg-black justify-between gap-3 shrink-0">
        <Link href="/k8s-dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
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
        </Link>
      </header>

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 italic flex items-center gap-3">
              <span>Logs: <span className="text-[#368dab] font-mono">{podName}</span></span>
              <span className={`text-xs font-bold tracking-widest px-2 py-0.5 rounded-full border ${isStreaming ? 'border-green-500 text-green-500 animate-pulse' : 'border-zinc-600 text-zinc-500'}`}>
                {isStreaming ? '[LIVE]' : '[STATIC]'}
              </span>
            </h1>
            <p className="text-sm text-zinc-500 font-mono">
              [container: {containerName}] [ns: {namespace}]
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tail Lines:</span>
              <Input
                type="number"
                value={tailLines}
                onChange={e => setTailLines(parseInt(e.target.value) || 0)}
                className="w-16 h-8 text-xs font-mono px-2"
              />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Since (secs):</span>
              <Input
                type="number"
                value={sinceSeconds}
                onChange={e => setSinceSeconds(parseInt(e.target.value) || 0)}
                className="w-16 h-8 text-xs font-mono px-2"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={isStreaming}
              className="h-8 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              Refresh
            </Button>
            <Button
              variant={isStreaming ? "destructive" : "default"}
              size="sm"
              onClick={isStreaming ? stopStreaming : startStreaming}
              className="h-8 shadow-sm"
            >
              {isStreaming ? "Stop Stream" : "Stream Logs"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={copyToClipboard}
              className="h-8"
            >
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadLogs}
              className="h-8 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              Download
            </Button>
          </div>
        </div>

        <div
          ref={logContainerRef}
          onMouseUp={handleSelection}
          className="flex-1 bg-zinc-950 text-zinc-300 font-mono p-4 rounded-lg overflow-y-auto whitespace-pre-wrap text-xs border border-zinc-800 scrollbar-thin scrollbar-thumb-zinc-700 shadow-inner relative"
        >
          {logs.length === 0 ? (
            <div className="text-zinc-600 italic">No logs found.</div>
          ) : (
            logs.map((line, i) => (
              <div key={i} className="hover:bg-zinc-900/50 min-h-[1.2rem] px-1 transition-colors">
                <span className="text-zinc-600 mr-3 select-none inline-block w-8 text-right">{i + 1}</span>
                {line}
              </div>
            ))
          )}
          <div ref={logEndRef} />

          {selection && (
            <div
              style={{
                position: "fixed",
                left: selection.x,
                top: selection.y,
                transform: "translate(-50%, -100%)",
                zIndex: 100,
              }}
              className="bg-zinc-800 border border-zinc-700 shadow-xl rounded-md p-1 flex gap-1 animate-in fade-in zoom-in duration-150"
            >
              <Button
                size="sm"
                variant="ghost"
                onClick={addToChat}
                className="h-7 text-[10px] px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
              >
                <MessageSquarePlus className="w-3 h-3 mr-1" />
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
