"use client";

import { useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { ModeToggle } from "@/components/ui/mode-toggle";

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
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-2 text-left">Pod Name</th>
            <th className="px-4 py-2 text-left">Container Name</th>
            <th className="px-4 py-2 text-left">CPU Request</th>
            <th className="px-4 py-2 text-left">CPU Limit</th>
            <th className="px-4 py-2 text-left">Memory Request</th>
            <th className="px-4 py-2 text-left">Memory Limit</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <td className="px-4 py-2 font-medium">{row.podName}</td>
              <td className="px-4 py-2">{row.containerName}</td>
              <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{row.cpuRequest}</td>
              <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{row.cpuLimit}</td>
              <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{row.memoryRequest}</td>
              <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{row.memoryLimit}</td>
              <td className="px-4 py-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  row.status === 'Running' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  row.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-2">
                <a 
                  href={`/tools/k8s-pod-logs?namespace=${namespace}&podName=${row.podName}&containerName=${row.containerName}`}
                  className="text-blue-600 hover:underline dark:text-blue-400 text-sm font-semibold"
                >
                  View Logs
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PodResourcesFetcher({ namespace }: { namespace: string }) {
  const { data, error, isLoading } = useSWR(`/api/tools/k8s-pod-resources?namespace=${namespace}`, fetcher);

  if (isLoading) return <div className="text-gray-500">Loading pod resources...</div>;
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!data || !data.data) return <div>No data found.</div>;
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
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black font-sans">
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
        <ModeToggle />
      </header>

      <main className="flex-1 p-8 flex flex-col items-center">
        <div className="w-full max-w-5xl flex flex-col gap-8 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border dark:border-zinc-800">
          <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">K8s Pod Resource Requests & Limits</h1>
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
