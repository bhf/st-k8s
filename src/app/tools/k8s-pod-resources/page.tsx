"use client";

import { useState, Fragment } from "react";
import useSWR from "swr";
import Image from "next/image";
import { ChevronRight, ChevronDown } from "lucide-react";
import { RefreshSelector } from "@/components/RefreshSelector";
import { useRefresh } from "@/lib/refresh-context";
import { parseCpu, parseMemory, formatCpu, formatMemory } from "@/lib/utils";

function fetcher(url: string) {
  return fetch(url).then((res) => res.json());
}

interface PodResource {
  podName: string;
  containerName: string;
  cpuRequest: string;
  cpuLimit: string;
  memoryRequest: string;
  memoryLimit: string;
  status: string;
}

function PodResourcesTable({ data, namespace }: { data: PodResource[], namespace: string }) {
  const [expandedPods, setExpandedPods] = useState<Record<string, boolean>>({});

  const togglePod = (podName: string) => {
    setExpandedPods(prev => ({
      ...prev,
      [podName]: !prev[podName]
    }));
  };

  // Group containers by pod
  const podGroups = data.reduce((acc, curr) => {
    if (!acc[curr.podName]) {
      acc[curr.podName] = {
        podName: curr.podName,
        status: curr.status,
        containers: [],
        cpuReq: 0,
        cpuLim: 0,
        memReq: 0,
        memLim: 0,
      };
    }
    acc[curr.podName].containers.push(curr);
    acc[curr.podName].cpuReq += parseCpu(curr.cpuRequest);
    acc[curr.podName].cpuLim += parseCpu(curr.cpuLimit);
    acc[curr.podName].memReq += parseMemory(curr.memoryRequest);
    acc[curr.podName].memLim += parseMemory(curr.memoryLimit);
    return acc;
  }, {} as Record<string, {
    podName: string;
    status: string;
    containers: PodResource[];
    cpuReq: number;
    cpuLim: number;
    memReq: number;
    memLim: number;
  }>);

  const sortedPodNames = Object.keys(podGroups).sort();

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-2 text-left w-10"></th>
            <th className="px-4 py-2 text-left">Pod / Container Name</th>
            <th className="px-4 py-2 text-left">CPU Request</th>
            <th className="px-4 py-2 text-left">CPU Limit</th>
            <th className="px-4 py-2 text-left">Memory Request</th>
            <th className="px-4 py-2 text-left">Memory Limit</th>
            <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-zinc-500">Status</th>
            <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-zinc-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {sortedPodNames.map((podName) => {
            const group = podGroups[podName];
            const isExpanded = !!expandedPods[podName];
            const hasMultipleContainers = group.containers.length > 1;

            return (
              <Fragment key={podName}>
                {/* Pod Summary Row */}
                <tr 
                  className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  onClick={() => togglePod(podName)}
                >
                  <td className="px-4 py-3">
                    {hasMultipleContainers && (
                      isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                    {podName} 
                    {!hasMultipleContainers && (
                      <span className="ml-2 text-xs font-normal text-zinc-500 italic">
                        ({group.containers[0].containerName})
                      </span>
                    )}
                    {hasMultipleContainers && (
                      <span className="ml-2 text-xs font-normal text-zinc-400">
                        {group.containers.length} containers
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCpu(group.cpuReq)}</td>
                  <td className="px-4 py-3 font-medium">{formatCpu(group.cpuLim)}</td>
                  <td className="px-4 py-3 font-medium">{formatMemory(group.memReq)}</td>
                  <td className="px-4 py-3 font-medium">{formatMemory(group.memLim)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      group.status === 'Running' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      group.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {group.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!hasMultipleContainers && (
                      <a 
                        href={`/tools/k8s-pod-logs?namespace=${namespace}&podName=${podName}&containerName=${group.containers[0].containerName}`}
                        className="text-xs text-blue-500 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        Logs
                      </a>
                    )}
                  </td>
                </tr>

                {/* Container Detail Rows */}
                {isExpanded && group.containers.map((container, idx) => (
                  <tr key={`${podName}-${container.containerName}-${idx}`} className="bg-zinc-50/50 dark:bg-zinc-800/20 border-l-4 border-l-blue-500/30">
                    <td className="px-4 py-2 text-right text-zinc-400 text-xs">
                    </td>
                    <td className="px-4 py-2 pl-8 pb-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {container.containerName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">{container.cpuRequest}</td>
                    <td className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">{container.cpuLimit}</td>
                    <td className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">{container.memoryRequest}</td>
                    <td className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">{container.memoryLimit}</td>
                    <td className="px-4 py-2">
                       {/* Container status if available, otherwise inherit pod status */}
                    </td>
                    <td className="px-4 py-2">
                      <a 
                        href={`/tools/k8s-pod-logs?namespace=${namespace}&podName=${podName}&containerName=${container.containerName}`}
                        className="text-xs text-blue-500 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        Logs
                      </a>
                    </td>
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PodResourcesFetcher({ namespace }: { namespace: string }) {
  const { autoRefresh, interval, triggerRefresh, setLastUpdated } = useRefresh();
  
  const { data, error, isLoading } = useSWR(
    `/api/tools/k8s-pod-resources?namespace=${namespace}&t=${triggerRefresh}`, 
    fetcher,
    {
      refreshInterval: autoRefresh ? interval * 1000 : 0,
      onSuccess: () => setLastUpdated(new Date()),
    }
  );

  if (isLoading) return <div className="text-gray-500 italic">Fetching resources...</div>;
  if (error) return <div className="text-red-600 font-mono text-sm p-4 bg-red-50 rounded border border-red-200">Error: {error.message}</div>;
  if (!data || !data.data) return <div className="text-zinc-500 py-8">No pods found in namespace "{namespace}".</div>;
  return <PodResourcesTable data={data.data} namespace={namespace} />;
}

function NamespaceSelect({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const { data, error, isLoading } = useSWR("/api/tools/k8s-namespaces", fetcher);

  if (isLoading) return <div className="h-9 w-48 bg-gray-200 animate-pulse rounded dark:bg-zinc-800"></div>;
  if (error) return <div className="text-red-600 text-sm">Error loading namespaces</div>;
  if (!data || !data.namespaces) return <div className="text-sm">No namespaces found.</div>;

  return (
    <select
      id="namespace"
      className="border px-2 py-1 rounded w-48 dark:bg-zinc-800 dark:text-white"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {data?.namespaces?.map((ns: string) => (
        <option key={ns} value={ns}>
          {ns}
        </option>
      ))}
    </select>
  );
}

export default function K8sPodResourcesPage() {
  const [namespace, setNamespace] = useState("default");
  const [fetchKey, setFetchKey] = useState(0);

  return (
    <div className="flex flex-col min-h-screen bg-black font-sans">
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
        <div className="flex items-center gap-2">
          <RefreshSelector />
        </div>
      </header>

      <main className="flex-1 p-8 flex flex-col items-center">
        <div className="w-full max-w-5xl flex flex-col gap-8 p-8 bg-zinc-900 rounded-xl shadow-lg border border-zinc-800">
          <h1 className="text-3xl font-bold mb-2 text-white">K8s Pod Resource Requests & Limits</h1>
          <form
            className="flex gap-4 items-end"
            onSubmit={e => {
              e.preventDefault();
              setFetchKey(k => k + 1);
            }}
          >
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="namespace">Namespace</label>
              <NamespaceSelect value={namespace} onChange={setNamespace} />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#368dab] text-white hover:bg-[#2d768f] font-semibold transition-colors"
            >
              Fetch
            </button>
          </form>
          {fetchKey > 0 && (
            <PodResourcesFetcher key={namespace + fetchKey} namespace={namespace} />
          )}
        </div>
      </main>
    </div>
  );
}
