"use client";

import { useState } from "react";
import useSWR from "swr";

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
}

function PodResourcesTable({ data }: { data: PodResource[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-2">Pod Name</th>
            <th className="px-4 py-2">Container Name</th>
            <th className="px-4 py-2">CPU Request</th>
            <th className="px-4 py-2">CPU Limit</th>
            <th className="px-4 py-2">Memory Request</th>
            <th className="px-4 py-2">Memory Limit</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
              <td className="px-4 py-2">{row.podName}</td>
              <td className="px-4 py-2">{row.containerName}</td>
              <td className="px-4 py-2">{row.cpuRequest}</td>
              <td className="px-4 py-2">{row.cpuLimit}</td>
              <td className="px-4 py-2">{row.memoryRequest}</td>
              <td className="px-4 py-2">{row.memoryLimit}</td>
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
  return <PodResourcesTable data={data.data} />;
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col gap-8 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg">
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
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Fetch
          </button>
        </form>
        {fetchKey > 0 && (
          <PodResourcesFetcher key={namespace + fetchKey} namespace={namespace} />
        )}
      </main>
    </div>
  );
}
