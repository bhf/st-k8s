"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import {
  Send,
  X,
  MessageCircle,
  Loader2,
  ChevronDown,
  FileText,
  Boxes,
  Database,
  Terminal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChat } from "./ChatContext";

// Message type
type Message = {
  role: "user" | "assistant";
  content: string;
};

interface ChatComponentProps {
  isOpen?: boolean; // If parent controls visibility
  onClose?: () => void;
}

export default function ChatComponent({
  isOpen: controlledIsOpen,
  onClose,
}: ChatComponentProps) {
  // If controlled, use prop; else manage local state
  const [isOpen, setIsOpen] = useState<boolean>(!!controlledIsOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState("gpt-4o");
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(true);

  const { attachedResources, removeAttachment } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync controlled prop
  useEffect(() => {
    if (controlledIsOpen !== undefined) setIsOpen(controlledIsOpen);
  }, [controlledIsOpen]);

  // Fetch available models
  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch("/api/models");
        if (res.ok) {
          const data = await res.json();
          if (data.models && Array.isArray(data.models)) {
            setAvailableModels(data.models);
            // Verify if current default model exists in the list?
            // Not strictly necessary, but good UX.
          }
        }
      } catch (err) {
        console.error("Failed to fetch models", err);
      }
    }
    fetchModels();
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Handle open/close
  const handleToggle = () => {
    if (controlledIsOpen === undefined) setIsOpen((v) => !v);
    else if (onClose && isOpen) onClose();
  };

  // Send message to /api/chat
  const sendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    setError(null);

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          model,
          isReadOnly,
          attachments: attachedResources.map(r => ({
            name: r.name,
            type: r.type,
            data: r.data
          }))
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      if (!data || !data.response) throw new Error("Invalid response");

      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: data.response as string },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard: Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      sendMessage();
    }
  };

  // If closed, show floating button
  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 right-6 md:bottom-12 z-[60] rounded-full p-0 w-14 h-14 bg-zinc-900 hover:bg-zinc-800 shadow-lg border border-zinc-700"
        onClick={handleToggle}
        aria-label="Open chat"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </Button>
    );
  }

  return (
    <Card
      className="fixed bottom-0 right-0 z-[60] w-full max-w-sm sm:max-w-md md:max-w-md h-[70vh] sm:h-[80vh] flex flex-col bg-zinc-900 border border-zinc-800 shadow-2xl rounded-tl-xl p-1 gap-0"
      style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.45)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 rounded-tl-xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white text-lg">ST-K8s Chat</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <button
              onClick={() => setIsReadOnly(!isReadOnly)}
              className={`flex items-center gap-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border transition-colors ${isReadOnly
                ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                : "text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20"
                }`}
              title={isReadOnly ? "Click to enable write operations" : "Click to enforce read-only mode"}
            >
              <Boxes className="w-2.5 h-2.5" />
              {isReadOnly ? "Read-only" : "Write Enabled"}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase font-medium">
                  View Capabilities
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-zinc-800 border-zinc-700 text-zinc-200 z-[70] w-56 p-2">
                <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1.5 px-2">Active Tools</div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {[
                    "list_namespaces", "list_pods", "list_deployments", "list_services",
                    "list_nodes", "get_pod_logs", "list_events", "list_contexts",
                    "list_configmaps", "list_jobs", "list_pvc",
                    ...(isReadOnly ? [] : ["start_port_forward", "stop_port_forward", "list_port_forwards"])
                  ].map(t => (
                    <div key={t} className="text-[11px] px-2 py-1 rounded bg-zinc-900/50 border border-zinc-700/50 text-zinc-300">
                      {t}
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-700 px-2">
                  <p className="text-[10px] text-zinc-400 italic">
                    {isReadOnly
                      ? "All tools are restricted to read-only cluster operations for security."
                      : "Writing operations and sensitive tools are enabled."}
                  </p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 bg-zinc-800 border-zinc-700 text-zinc-200 text-xs px-2 hover:bg-zinc-700 hover:text-white"
                aria-label="Select AI model"
              >
                {model}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700 text-zinc-200 z-[70] max-h-60 overflow-y-auto">
              {availableModels.length > 0 ? (
                availableModels.map((m) => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className="focus:bg-zinc-700 focus:text-white cursor-pointer text-xs"
                  >
                    {m.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() => setModel("gpt-4o")}
                    className="focus:bg-zinc-700 focus:text-white cursor-pointer text-xs"
                  >
                    GPT-4o
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setModel("claude-3.5-sonnet")}
                    className="focus:bg-zinc-700 focus:text-white cursor-pointer text-xs"
                  >
                    Claude 3.5 Sonnet
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setModel("o1-mini")}
                    className="focus:bg-zinc-700 focus:text-white cursor-pointer text-xs"
                  >
                    o1 Mini
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={handleToggle}
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-zinc-900"
      >
        {messages.length === 0 && (
          <div className="text-zinc-400 text-center mt-8">
            Start a conversation about your Kubernetes cluster.
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-line ${msg.role === "user"
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700"
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg border border-zinc-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Assistant is typing...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center" role="alert">
            <div className="text-red-400 text-xs mt-2">{error}</div>
          </div>
        )}
      </div>

      {/* Attachments Area */}
      {attachedResources.length > 0 && (
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {attachedResources.map((res) => {
            const getIcon = () => {
              switch (res.type) {
                case 'log-snippet': return <Terminal className="w-3 h-3" />;
                case 'collection': return <Boxes className="w-3 h-3" />;
                case 'resource': return <Database className="w-3 h-3" />;
                default: return <FileText className="w-3 h-3" />;
              }
            };
            return (
              <div
                key={res.id}
                className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium animate-in fade-in zoom-in duration-200"
              >
                {getIcon()}
                <span className="opacity-70 uppercase truncate max-w-[40px]">{res.type}</span>
                <span className="font-bold truncate max-w-[80px]">{res.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(res.id)}
                  className="hover:text-white transition-colors p-0.5"
                  aria-label={`Remove ${res.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-4 py-3 border-t border-zinc-800 bg-zinc-950"
      >
        <Input
          className="flex-1 bg-zinc-800 text-white border-zinc-700 placeholder:text-zinc-400"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoComplete="off"
          aria-label="Chat input"
        />
        <Button
          type="submit"
          size="icon"
          className="bg-[#368dab] hover:bg-[#2a6f87] text-white"
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>
    </Card>
  );
}
