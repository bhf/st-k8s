"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolType } from "./Sidebar";
import { Grid, List, Download, Zap, XCircle, MessageSquarePlus, Terminal, ChevronRight, ChevronDown } from "lucide-react";
import { MetricsDashboard } from "@/components/MetricsCharts";
import { useChat } from "@/components/ChatContext";
import { JsonRenderer } from "@/components/JsonRenderer";
import { RefreshSelector } from "@/components/RefreshSelector";
import { useRefresh } from "@/lib/refresh-context";
import { toast } from "sonner";
import { KubectlCheatSheet } from "@/components/KubectlCheatSheet";
import { isEqual, parseCpu, parseMemory, formatCpu, formatMemory, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ExpandedState,
  getExpandedRowModel,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface DashboardContentProps {
  namespace: string;
  context?: string;
  tool: ToolType;
}

export default function DashboardContent({ namespace, context, tool }: DashboardContentProps) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const dataRef = useRef<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const { autoRefresh, interval, triggerRefresh, setLastUpdated } = useRefresh();
  const { addAttachment } = useChat();

  const downloadCSV = () => {
    if (!data || data.length === 0) return;

    // Determine columns (same logic as ResourceTable)
    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'metadata') {
          allKeys.add(key);
        }
      });
    });

    const columns = Array.from(allKeys);
    // Sort columns: name/podName first
    const nameCols = columns.filter(c => c.toLowerCase().includes('name'));
    const otherCols = columns.filter(c => !c.toLowerCase().includes('name'));
    const sortedColumns = [...nameCols, ...otherCols];

    // Create CSV content
    const headers = sortedColumns.join(",");
    const rows = data.map(item => {
      return sortedColumns.map(col => {
        let val = item[col];
        if (typeof val === "object" && val !== null) {
          val = JSON.stringify(val);
        }
        val = String(val ?? "");
        // Escape quotes
        // @ts-expect-error: Replacement requires string type
        val = val.replace(/"/g, '""');
        // Wrap in quotes if it contains comma, quote or newline
        // @ts-expect-error: Search requires string type
        if (val.search(/("|,|\n)/g) >= 0) {
          val = `"${val}"`;
        }
        return val;
      }).join(",");
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${tool}-${namespace}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchData = useCallback(async () => {
    if (!namespace && tool !== "nodes") return;

    // Only show full loading state if we don't have data yet
    if (dataRef.current.length === 0) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const endpointMap: Record<ToolType, string> = {
        "pod-resources": "k8s-pod-resources",
        "deployments": "k8s-deployments",
        "replicasets": "k8s-replicasets",
        "statefulsets": "k8s-statefulsets",
        "daemonsets": "k8s-daemonsets",
        "services": "k8s-services",
        "ingresses": "k8s-ingresses",
        "endpoints": "k8s-endpoints",
        "events": "k8s-events",
        "volumes": "k8s-volumes",
        "nodes": "k8s-nodes",
        "configmaps": "k8s-configmaps",
        "jobs": "k8s-jobs",
        "cronjobs": "k8s-cronjobs",
        "serviceaccounts": "k8s-serviceaccounts",
        "roles": "k8s-roles",
        "rolebindings": "k8s-rolebindings",
        "port-forwards": "k8s-port-forward",
        "metrics": "k8s-metrics-pods", // Default to metrics tool if namespace selected
      };

      let endpoint = endpointMap[tool];
      if (tool === "metrics" && (!namespace || namespace === "all")) {
        endpoint = "k8s-metrics-nodes";
      }
      const url = new URL(`/api/tools/${endpoint}`, window.location.origin);
      if (namespace) {
        url.searchParams.set("namespace", namespace);
      }
      if (context) {
        url.searchParams.set("context", context);
      }

      const res = await fetch(url.toString());

      if (!res.ok) {
        throw new Error(`Failed to fetch ${tool}: ${res.statusText}`);
      }

      const json = await res.json();

      // Handle different response structures
      let newData: Record<string, unknown>[] = [];
      if (json.data) {
        newData = Array.isArray(json.data) ? json.data : [json.data];
      } else if (Array.isArray(json)) {
        newData = json;
      } else if (json.items) {
        newData = json.items;
      } else {
        // Fallback logic
        const keys = Object.keys(json);
        const arrayKey = keys.find(k => Array.isArray(json[k]));
        if (arrayKey) {
          newData = json[arrayKey];
        } else {
          newData = [];
          console.warn("Could not find array data in response", json);
        }
      }

      // Deep equality check to prevent unnecessary re-renders
      setData(prev => {
        if (isEqual(prev, newData)) {
          return prev;
        }
        dataRef.current = newData;
        return newData;
      });

      setLastUpdated(new Date());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [namespace, context, tool, setLastUpdated]);

  useEffect(() => {
    // Reset data when tool or namespace changes to show full loading state
    setData([]);
    dataRef.current = [];
  }, [tool, namespace]);

  useEffect(() => {
    fetchData();
  }, [fetchData, triggerRefresh]);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    }, interval * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoRefresh, interval, fetchData]);

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold capitalize text-foreground  dark:text-[oklch(0.78_0.19_70)]">
            {tool.replace("-", " ")}
          </h1>
          <p className="text-sm font-medium text-foreground  dark:text-[oklch(0.78_0.19_70)]">
            Namespace:{" "}
            <span className="font-normal text-foreground dark:text-[oklch(0.7_0.12_70)]">
              {namespace}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshSelector isRefreshing={isRefreshing} />
          <div className="flex items-center border rounded-md overflow-hidden bg-background">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("grid")}
              className="rounded-none h-8 w-8"
              title="Grid View"
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("table")}
              className="rounded-none h-8 w-8"
              title="Table View"
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={downloadCSV}
            size="sm"
            disabled={data.length === 0 || loading}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-500 hover:text-blue-400 border-blue-500/20 hover:bg-blue-500/10"
            disabled={data.length === 0 || loading}
            onClick={() => {
              addAttachment({
                name: `All ${tool.replace("-", " ")}`,
                type: 'collection',
                data: data
              });
              toast.success(`Attached all ${data.length} ${tool.replace("-", " ")} to chat`);
            }}
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Add All to Chat
          </Button>
        </div>
      </div>

      {loading && data.length === 0 && (
        <div className="flex items-center justify-center h-64" role="status" aria-label="Loading contents...">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <Card className="border-red-900/20 bg-red-900/20 mb-6" role="alert">
          <CardContent className="pt-6 text-red-400">
            Error: {error}
          </CardContent>
        </Card>
      )}

      {data.length === 0 && !loading && !error && (
        <div className="text-center py-12 text-zinc-500">
          No resources found in this namespace.
        </div>
      )}

      {data.length > 0 && (
        <>
          {tool === "metrics" ? (
            <MetricsDashboard
              nodes={((!namespace || namespace === "all") ? data : []) as any}
              pods={(namespace && namespace !== "all" ? data : []) as any}
            />
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {data.map((item, i) => {
                const id = String(item.name || item.podName || (item.metadata as { name?: string })?.name || i);
                return <ResourceCard key={id} item={item} tool={tool} namespace={namespace} />;
              })}
            </div>
          ) : (
            <ResourceTable data={data} tool={tool} namespace={namespace} />
          )}
        </>
      )}
    </div>
  );
}

function ResourceTable({ data, tool, namespace }: { data: Record<string, unknown>[], tool?: ToolType, namespace?: string }) {
  const { refresh } = useRefresh();
  const { addAttachment } = useChat();
  const [pfTarget, setPfTarget] = useState<{ podName?: string, serviceName?: string } | null>(null);
  const [pfPorts, setPfPorts] = useState({ remote: "8080", local: "8080", address: "127.0.0.1" });
  const [cheatSheetTarget, setCheatSheetTarget] = useState<{ name: string, type: string } | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const handlePortForward = useCallback(async (params: { podName?: string, serviceName?: string, containerPort: number, localPort?: number, localAddress?: string }) => {
    try {
      const res = await fetch('/api/tools/k8s-port-forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespace,
          ...params
        })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || res.statusText);
      }
      const json = await res.json();
      toast.success(`Port forward started: localhost:${json.data.localPort} -> ${params.podName || params.serviceName}:${params.containerPort}`);
      setPfTarget(null);
      refresh();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [namespace, refresh]);

  const handleStopPortForward = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/tools/k8s-port-forward', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || res.statusText);
      }
      toast.success("Port forward stopped");
      refresh();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [refresh]);

  // Transform data for pod-resources tool to group by pod
  const processedData = useMemo(() => {
    if (tool !== 'pod-resources') return data;

    const pods: Record<string, any> = {};
    data.forEach((item: any) => {
      const podName = String(item.podName || '');
      if (!pods[podName]) {
        pods[podName] = {
          ...item,
          subRows: [],
          _cpuReqVal: 0,
          _cpuLimVal: 0,
          _memReqVal: 0,
          _memLimVal: 0,
        };
      }
      
      const cpuReq = parseCpu(String(item.cpuRequest || '-'));
      const cpuLim = parseCpu(String(item.cpuLimit || '-'));
      const memReq = parseMemory(String(item.memoryRequest || '-'));
      const memLim = parseMemory(String(item.memoryLimit || '-'));

      pods[podName]._cpuReqVal += cpuReq;
      pods[podName]._cpuLimVal += cpuLim;
      pods[podName]._memReqVal += memReq;
      pods[podName]._memLimVal += memLim;
      
      pods[podName].subRows.push({
        ...item,
        subRows: undefined,
        _isSub: true
      });
    });

    return Object.values(pods)
      .sort((a: any, b: any) => String(a.podName).localeCompare(String(b.podName)))
      .map(pod => {
        if (pod.subRows.length <= 1) {
          return { ...pod.subRows[0], subRows: undefined };
        }

      return {
        ...pod,
        cpuRequest: formatCpu(pod._cpuReqVal),
        cpuLimit: formatCpu(pod._cpuLimVal),
        memoryRequest: formatMemory(pod._memReqVal),
        memoryLimit: formatMemory(pod._memLimVal),
        containerName: `${pod.subRows.length} containers`,
      };
    });
  }, [data, tool]);

  // Determine columns from ALL items to handle sparse data
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const allKeys = new Set<string>();
    // Use processedData to ensure all keys are shown
    processedData.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== "metadata" && key !== "subRows" && !key.startsWith('_')) {
          allKeys.add(key);
        }
      });
    });

    const cols = Array.from(allKeys);
    const nameCols = cols.filter((c) => c.toLowerCase().includes("name"));
    const otherCols = cols.filter((c) => !c.toLowerCase().includes("name"));
    const sortedColumns = [...nameCols, ...otherCols];

    const baseCols: ColumnDef<Record<string, unknown>>[] = sortedColumns.map((key) => ({
      accessorKey: key,
      header: key,
      cell: (info) => {
        const val = info.getValue();
        const row = info.row;

        // Custom renderer for name columns with expansion toggle
        if ((key === 'podName' || key === 'name') && tool === 'pod-resources' && row.getCanExpand()) {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  row.toggleExpanded();
                }}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-blue-500"
                title={row.getIsExpanded() ? "Collapse" : "Expand"}
              >
                {row.getIsExpanded() ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
              </button>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{String(val)}</span>
            </div>
          );
        }

        if (typeof val === "object" && val !== null) {
          if (Object.keys(val).length === 0) return "";
          return <JsonRenderer value={val} label={key} />;
        }
        if (key === 'status' || key === 'phase') {
          const status = String(val);
          return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${status === 'Running' || status === 'Active' || status === 'Succeeded' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
              status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
              {status}
            </span>
          );
        }
        return String(val);
      },
      size: 150,
    }));

    if (tool === 'pod-resources' && namespace) {
      baseCols.push({
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const row = info.row.original;
          const podName = String(row.podName || '');
          const containerName = String(row.containerName || '');
          const isExpandable = info.row.getCanExpand();

          return (
            <div className="flex gap-2 items-center">
              {!isExpandable && (
                <a
                  href={`/tools/k8s-pod-logs?namespace=${namespace}&podName=${podName}&containerName=${containerName}`}
                  className="text-blue-500 hover:text-blue-400 text-[10px] font-semibold underline underline-offset-2"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                >
                  Logs
                </a>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setPfTarget({ podName });
                  setPfPorts({ remote: "8080", local: "8080", address: "127.0.0.1" });
                }}
                title="Port Forward"
                aria-label={`Port forward for pod ${podName}`}
              >
                <Zap className="h-3 w-3" />
              </Button>
            </div>
          );
        },
        size: 100
      });
    }

    if (tool === 'services' && namespace) {
      baseCols.push({
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const row = info.row.original;
          const serviceName = String(row.name || '');
          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
              onClick={() => {
                setPfTarget({ serviceName });
                setPfPorts({ remote: "80", local: "8080", address: "127.0.0.1" });
              }}
              title="Port Forward"
              aria-label={`Port forward for service ${serviceName}`}
            >
              <Zap className="h-3 w-3" />
            </Button>
          );
        },
        size: 80
      });
    }

    if (tool === 'port-forwards') {
      baseCols.push({
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const row = info.row.original;
          const id = String(row.id || '');
          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={() => handleStopPortForward(id)}
              title="Stop Forward"
              aria-label={`Stop port forward ${id}`}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          );
        },
        size: 80
      });
    }

    // Kubectl Cheat Sheet action
    baseCols.push({
      id: 'cheat-sheet',
      header: '',
      cell: (info) => {
        const row = info.row.original;
        const name = String(row.name || row.podName || (row.metadata as { name?: string })?.name || '');
        if (!name || tool === 'port-forwards' || tool === 'metrics') return null;
        return (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-500/10"
            onClick={(e) => {
              e.stopPropagation();
              setCheatSheetTarget({ name, type: tool || 'resource' });
            }}
            title="Kubectl Cheat Sheet"
            aria-label={`Show kubectl cheat sheet for ${name}`}
          >
            <Terminal className="h-4 w-4" />
          </Button>
        );
      },
      size: 40
    });

    // Add to Chat action
    baseCols.push({
      id: 'chat',
      header: '',
      cell: (info) => {
        const row = info.row.original;
        const name = String(row.name || row.podName || (row.metadata as { name?: string })?.name || '');
        return (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
            onClick={(e) => {
              e.stopPropagation();
              addAttachment({
                name,
                type: tool || 'resource',
                data: row
              });
              toast.success(`Attached ${name} to chat`);
            }}
            title="Add to Chat"
            aria-label={`Add resource ${name} to chat`}
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        );
      },
      size: 40
    });

    return baseCols;
  }, [processedData, tool, namespace, handleStopPortForward, addAttachment]);

  const table = useReactTable({
    data: processedData,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getSubRows: (row) => (row as any).subRows,
    getExpandedRowModel: getExpandedRowModel(),
    columnResizeMode: "onChange",
    getRowId: (row, index) => {
      const id = String(row.name || row.podName || (row.metadata as { name?: string })?.name || index);
      return (row as any)._isSub ? `${id}-${index}` : id;
    },
    getCoreRowModel: getCoreRowModel(),
  });

  if (processedData.length === 0) return null;

  return (
    <div className="rounded-md border bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="overflow-x-auto">
        <Table style={{ width: table.getTotalSize() }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative uppercase whitespace-nowrap group text-xs font-bold text-zinc-500"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-zinc-400 bg-zinc-200 opacity-0 group-hover:opacity-100 ${header.column.getIsResizing()
                        ? "bg-blue-500 opacity-100 w-1"
                        : ""
                        }`}
                    />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow 
                key={row.id}
                className={cn(
                  row.depth > 0 ? "bg-zinc-50/50 dark:bg-zinc-800/20 border-l-4 border-l-blue-500/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                  row.getCanExpand() && "cursor-pointer"
                )}
                onClick={() => row.getCanExpand() && row.toggleExpanded()}
              >
                {row.getVisibleCells().map((cell) => {
                  const val = cell.getValue();
                  const isObject = typeof val === "object" && val !== null;
                  
                  return (
                    <TableCell
                      key={cell.id}
                      className={isObject ? "" : "truncate max-w-[200px] py-2"}
                      title={isObject ? undefined : String(val)}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <style jsx global>{`
        th:hover .cursor-col-resize {
            opacity: 1;
        }
      `}</style>

      <Dialog open={!!pfTarget} onOpenChange={(open) => !open && setPfTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Port Forwarding</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="remote-port" className="text-right text-xs font-semibold uppercase text-zinc-500">
                Remote Port
              </label>
              <Input
                id="remote-port"
                className="col-span-3 h-8"
                value={pfPorts.remote}
                onChange={(e) => setPfPorts({ ...pfPorts, remote: e.target.value, local: e.target.value })}
                placeholder="e.g. 8080"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="local-port" className="text-right text-xs font-semibold uppercase text-zinc-500">
                Local Port
              </label>
              <Input
                id="local-port"
                className="col-span-3 h-8"
                value={pfPorts.local}
                onChange={(e) => setPfPorts({ ...pfPorts, local: e.target.value })}
                placeholder="Random if empty"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="local-address" className="text-right text-xs font-semibold uppercase text-zinc-500">
                Local Address
              </label>
              <Input
                id="local-address"
                className="col-span-3 h-8"
                value={pfPorts.address}
                onChange={(e) => setPfPorts({ ...pfPorts, address: e.target.value })}
                placeholder="e.g. 127.0.0.1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPfTarget(null)}>Cancel</Button>
            <Button
              onClick={() => handlePortForward({
                ...pfTarget,
                containerPort: parseInt(pfPorts.remote),
                localPort: pfPorts.local ? parseInt(pfPorts.local) : undefined,
                localAddress: pfPorts.address || "127.0.0.1"
              })}
              disabled={!pfPorts.remote}
            >
              Start Forwarding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {cheatSheetTarget && (
        <KubectlCheatSheet
          open={!!cheatSheetTarget}
          onOpenChange={(open) => !open && setCheatSheetTarget(null)}
          resourceName={cheatSheetTarget.name}
          resourceType={cheatSheetTarget.type}
          namespace={namespace}
        />
      )}
    </div>
  );
}

function ResourceCard({ item, tool, namespace }: { item: Record<string, unknown>, tool?: string, namespace?: string }) {
  const { addAttachment } = useChat();
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  // Helper to render object properties
  const renderValue = (val: unknown, key?: string) => {
    if (typeof val === "object" && val !== null) {
      if (Object.keys(val).length === 0) return "";
      return <JsonRenderer value={val} label={key} maxItems={1} />;
    }
    return String(val);
  };

  // Determine what to show based on tool type or generic fallback
  const name = String(item.name || item.podName || (item.metadata as { name?: string })?.name || "Unknown");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-zinc-50 dark:bg-zinc-800/50 pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium truncate" title={name}>
          {name}
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-500/10"
            onClick={() => setShowCheatSheet(true)}
            title="Kubectl Cheat Sheet"
            aria-label={`Show kubectl cheat sheet for ${name}`}
          >
            <Terminal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
            onClick={() => {
              addAttachment({
                name,
                type: tool || 'resource',
                data: item
              });
              toast.success(`Attached ${name} to chat`);
            }}
            title="Add to Chat"
            aria-label={`Add resource ${name} to chat`}
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4 text-sm">
        <div className="grid gap-2">
          {Object.entries(item).slice(0, 6).map(([key, value]) => {
            if (key === "name" || key === "podName" || key === "metadata") return null;
            if (typeof value === 'object' && value !== null && Object.keys(value as object).length === 0) return null;

            return (
              <div key={key} className="flex justify-between border-b pb-1 last:border-0 last:pb-0">
                <span className="font-medium text-zinc-500 capitalize px-1">{key}</span>
                <span className="text-right truncate max-w-[150px]" title={typeof value === 'object' ? undefined : String(value)}>
                  {renderValue(value, key)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
      {showCheatSheet && (
        <KubectlCheatSheet
          open={showCheatSheet}
          onOpenChange={setShowCheatSheet}
          resourceName={name}
          resourceType={tool || 'resource'}
          namespace={namespace}
        />
      )}
    </Card>
  );
}
