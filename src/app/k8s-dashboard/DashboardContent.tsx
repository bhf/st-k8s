"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolType } from "./Sidebar";
import { Grid, List, Download } from "lucide-react";
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
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface DashboardContentProps {
  namespace: string;
  tool: ToolType;
}

export default function DashboardContent({ namespace, tool }: DashboardContentProps) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

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
        // @ts-expect-error
          val = val.replace(/"/g, '""');
        // Wrap in quotes if it contains comma, quote or newline
        // @ts-expect-error
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

  useEffect(() => {
    async function fetchData() {
      if (!namespace) return;

      setLoading(true);
      setError(null);
      setData([]);

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
        };

        const endpoint = endpointMap[tool];
        const res = await fetch(`/api/tools/${endpoint}?namespace=${namespace}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch ${tool}: ${res.statusText}`);
        }

        const json = await res.json();

        // Handle different response structures
        if (json.data) {
          setData(Array.isArray(json.data) ? json.data : [json.data]);
        } else if (Array.isArray(json)) {
          setData(json);
        } else if (json.items) {
          setData(json.items);
        } else {
          // Fallback logic
          const keys = Object.keys(json);
          const arrayKey = keys.find(k => Array.isArray(json[k]));
          if (arrayKey) {
            setData(json[arrayKey]);
          } else {
             setData([]);
             console.warn("Could not find array data in response", json);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unknown error occurred";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [namespace, tool]);

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
          <div className="flex items-center border rounded-md overflow-hidden bg-background">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("grid")}
              className="rounded-none h-8 w-8"
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("table")}
              className="rounded-none h-8 w-8"
              title="Table View"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()} size="sm">
            Refresh
          </Button>
          <Button variant="outline" onClick={downloadCSV} size="sm" disabled={data.length === 0 || loading}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6 text-red-600 dark:text-red-400">
            Error: {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No resources found in this namespace.
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {data.map((item, i) => (
                <ResourceCard key={i} item={item} />
              ))}
            </div>
          ) : (
            <ResourceTable data={data} />
          )}
        </>
      )}
    </div>
  );
}

function ResourceTable({ data }: { data: Record<string, unknown>[] }) {
  if (data.length === 0) return null;

  // Determine columns from ALL items to handle sparse data
    // eslint-disable-next-line react-hooks/rules-of-hooks
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const allKeys = new Set<string>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== "metadata") {
          allKeys.add(key);
        }
      });
    });

    const cols = Array.from(allKeys);
    const nameCols = cols.filter((c) => c.toLowerCase().includes("name"));
    const otherCols = cols.filter((c) => !c.toLowerCase().includes("name"));
    const sortedColumns = [...nameCols, ...otherCols];

    return sortedColumns.map((key) => ({
      accessorKey: key,
      header: key,
      cell: (info) => {
        const val = info.getValue();
        if (typeof val === "object" && val !== null) {
          if (Object.keys(val).length === 0) return "";
          return JSON.stringify(val);
        }
        return String(val);
      },
      size: 150,
    }));
  }, [data]);

    // eslint-disable-next-line react-hooks/rules-of-hooks
  const table = useReactTable({
    data,
    columns,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
  });

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
                    className="relative uppercase whitespace-nowrap group"
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
                      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-zinc-400 bg-zinc-200 opacity-0 group-hover:opacity-100 ${
                        header.column.getIsResizing()
                          ? "bg-blue-500 opacity-100 w-1"
                          : ""
                      }`}
                      // Hack to show resizer always on hover of header, need 'group' on TableHead
                    />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="truncate max-w-[200px]"
                    title={String(cell.getValue())}
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
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
      <style jsx global>{`
        th:hover .cursor-col-resize {
            opacity: 1;
        }
      `}</style>
    </div>
  );
}

function ResourceCard({ item }: { item: Record<string, unknown> }) {
  // Helper to render object properties
  const renderValue = (val: unknown) => {
    if (typeof val === "object" && val !== null) {
      if (Object.keys(val).length === 0) return "";
      return JSON.stringify(val);
    }
    return String(val);
  };

  // Determine what to show based on tool type or generic fallback
  // @ts-expect-error
    const name = String(item.name || item.podName || (item.metadata as unknown)?.name || "Unknown");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-zinc-50 dark:bg-zinc-800/50 pb-3">
        <CardTitle className="text-base font-medium truncate" title={name}>
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 text-sm">
        <div className="grid gap-2">
           {Object.entries(item).slice(0, 6).map(([key, value]) => {
             if (key === "name" || key === "podName" || key === "metadata") return null;
             if (typeof value === 'object' && value !== null && Object.keys(value as object).length === 0) return null;

             return (
               <div key={key} className="flex justify-between border-b pb-1 last:border-0 last:pb-0">
                 <span className="font-medium text-zinc-500 capitalize px-1">{key}</span>
                 <span className="text-right truncate max-w-[150px]" title={String(value)}>
                   {renderValue(value)}
                 </span>
               </div>
             );
           })}
        </div>
      </CardContent>
    </Card>
  );
}
