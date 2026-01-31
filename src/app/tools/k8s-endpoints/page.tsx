"use client";

import { useState, Suspense } from "react";
import useSWR from "swr";

function fetcher(url: string) {
  return fetch(url).then((res) => res.json());
}

interface EndpointSubset {
  addresses?: { ip: string; nodeName?: string; targetRef?: { kind: string; name: string } }[];
  notReadyAddresses?: { ip: string; nodeName?: string }[];
  ports?: { port: number; protocol: string; name?: string }[];
}

interface Endpoint {
  name: string;
  subsets: EndpointSubset[];
  created: string;
}

function EndpointsTable({ data }: { data: Endpoint[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Internal Endpoints (IP:Port)</th>
            <th className="px-4 py-2 text-left">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
             const endpoints: string[] = [];
             row.subsets?.forEach(subset => {
                const ports = subset.ports?.map(p => p.port) || [];
                const addresses = subset.addresses?.map(a => a.ip) || [];
                 addresses.forEach(ip => {
                     ports.forEach(port => {
                         endpoints.push(`${ip}:${port}`);
                     });
                 });
             });

             return (
            <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
              <td className="px-4 py-2 font-medium">{row.name}</td>
              <td className="px-4 py-2">
                <div className="flex flex-wrap gap-1">
                {endpoints.length > 0 ? (
                    endpoints.map((ep, j) => (
                        <span key={j} className="px-1 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-800 dark:text-zinc-200">{ep}</span>
                    ))
                ) : (
                    <span className="text-zinc-400 italic">None</span>
                )}
                </div>
              </td>
              <td className="px-4 py-2 whitespace-nowrap">{row.created ? new Date(row.created).toLocaleDateString() : '-'}</td>
            </tr>
          );
          })}
          {data.length === 0 && (
            <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">No endpoints found in this namespace</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function EndpointsFetcher({ namespace }: { namespace: string }) {
  const { data, error } = useSWR(`/api/tools/k8s-endpoints?namespace=${namespace}`, fetcher, {
      suspense: true,
      fallbackData: { data: [] }
  });
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!data || !data.data) return <div>No data found.</div>;
  return <EndpointsTable data={data.data} />;
}

function NamespaceSelect({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const { data, error } = useSWR("/api/tools/k8s-namespaces", fetcher, {
      suspense: true,
      fallbackData: { namespaces: ["default"] }
  });

  if (error) return <div className="text-red-600 text-sm">Error loading namespaces</div>;

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

export default function K8sEndpointsPage() {
  const [namespace, setNamespace] = useState("default");
  const [fetchKey, setFetchKey] = useState(0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-6xl flex-col gap-8 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">K8s Endpoints</h1>
        <form
          className="flex gap-4 items-end"
          onSubmit={e => {
            e.preventDefault();
            setFetchKey(k => k + 1);
          }}
        >
          <div>
            <label htmlFor="namespace" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Namespace
            </label>
            <Suspense fallback={<div className="w-48 h-8 bg-zinc-200 animate-pulse rounded"></div>}>
                <NamespaceSelect value={namespace} onChange={setNamespace} />
            </Suspense>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm transition-colors"
          >
            Refresh
          </button>
        </form>

        <Suspense fallback={<div className="text-center py-10">Loading endpoints...</div>}>
            <EndpointsFetcher key={`${namespace}-${fetchKey}`} namespace={namespace} />
        </Suspense>
      </main>
    </div>
  );
}

