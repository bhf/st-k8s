"use client";

import { useRefresh } from "@/lib/refresh-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { RefreshCcw, Timer, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export function RefreshSelector() {
  const { autoRefresh, setAutoRefresh, interval, setInterval: setRefreshInterval, lastUpdated, refresh } = useRefresh();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeSince = lastUpdated
    ? Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)
    : null;

  return (
    <div className="flex items-center gap-2">
      {lastUpdated && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeSince !== null && (timeSince < 5 ? "Just now" : `${timeSince}s ago`)}
        </span>
      )}

      <div className="flex items-center border rounded-md overflow-hidden bg-background h-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          className="h-full w-8 p-0 rounded-none border-r hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Refresh Now"
          aria-label="Refresh now"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-full px-2 rounded-none gap-1 font-mono text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Auto refresh settings"
            >
              <Timer className="h-3 w-3" />
              {autoRefresh ? `${interval}s` : "OFF"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px] font-sans">
            <DropdownMenuLabel className="text-xs">Auto Refresh Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              className="text-xs"
            >
              Enable Auto Refresh
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">Refresh Interval</DropdownMenuLabel>
            {[5, 10, 30, 60, 300].map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => setRefreshInterval(s)}
                className={`text-xs ${interval === s ? "bg-accent" : ""}`}
              >
                {s >= 60 ? `${s / 60} minute${s > 60 ? 's' : ''}` : `${s} seconds`}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
