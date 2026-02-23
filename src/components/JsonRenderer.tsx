"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Maximize2, ExternalLink, Copy, Check } from "lucide-react";

interface JsonRendererProps {
  value: unknown;
  label?: string;
  maxItems?: number;
}

export function JsonRenderer({ value, label, maxItems = 2 }: JsonRendererProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (value === null || value === undefined) return null;

  if (typeof value !== "object") {
    return <span className="text-sm">{String(value)}</span>;
  }

  if (Object.keys(value as object).length === 0) return null;

  const isArray = Array.isArray(value);
  const entries = isArray ? (value as any[]) : Object.entries(value as object);
  const totalCount = entries.length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy JSON:", err);
    }
  };

  // Helper to render inline items
  const renderInline = () => {
    if (isArray) {
      if (totalCount === 0) return null;
      if (typeof entries[0] !== 'object') {
        return (
          <div className="flex flex-wrap gap-1">
            {entries.slice(0, maxItems).map((v, i) => (
              <span
                key={i}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border"
              >
                {String(v)}
              </span>
            ))}
            {totalCount > maxItems && (
              <span className="text-[10px] text-muted-foreground">+{totalCount - maxItems} more</span>
            )}
          </div>
        );
      }
    } else {
      const items = entries as [string, any][];
      // Only render small flat objects inline
      const isFlat = items.every(([_, v]) => typeof v !== 'object' || v === null);
      
      if (isFlat && totalCount <= maxItems) {
        return (
          <div className="flex flex-wrap gap-1">
            {items.map(([k, v], i) => (
              <span
                key={i}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 max-w-[150px] truncate"
                title={`${k}: ${String(v)}`}
              >
                <span className="opacity-70 mr-1">{k}:</span> {String(v)}
              </span>
            ))}
          </div>
        );
      }
    }
    
    return (
      <span className="text-[11px] text-muted-foreground font-medium">
        {isArray ? `${totalCount} items` : `${totalCount} keys`}
      </span>
    );
  };

  return (
    <div className="flex items-center gap-2 group">
      <div className="flex-1 overflow-hidden">
        {renderInline()}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            title="View full details"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center justify-between mr-8">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 capitalize">
                {label?.replace(/([A-Z])/g, ' $1').trim() || "Resource Details"}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1.5"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy JSON
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1.5 text-muted-foreground"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Raw JSON
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-6 bg-zinc-50 dark:bg-zinc-950/50">
            <div className="rounded-lg border bg-background overflow-hidden">
                <pre className="p-6 text-xs font-mono leading-relaxed overflow-x-auto text-foreground dark:text-zinc-300">
                  {JSON.stringify(value, null, 2)}
                </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
