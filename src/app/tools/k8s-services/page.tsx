"use client";

import { useState, Suspense } from "react";
import useSWR from "swr";

function fetcher(url: string) {
  return fetch(url).then((res) => res.json());
}

interface ServicePort {
  name?: string;
  port: number;
  protocol: string;
  targetPort?: number | string;
  nodePort?: number;
}

interface Service {
  name: string;
  type: string;
  clusterIP: string;
  ports: ServicePort[];
  selector: Record<string, string>;
  created: string;
}

function ServicesTable({ data }: { data: Service[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Cluster IP</th>
            <th className="px-4 py-2 text-left">Ports</th>
            <th className="px-4 py-2 text-left">Selectors</th>
            <th className="px-4 py-2 text-left">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
              <td className="px-4 py-2 font-medium">{row.name}</td>
              <td className="px-4 py-2">{row.type}</td>
              <td className="px-4 py-2 font-mono text-sm">{row.clusterIP}</td>
              <td className="px-4 py-2">
                <div className="flex flex-col gap-1">
                  {row.ports?.map((p, j) => (
                    <span key={j} className="text-sm">
                       {p.port}{p.nodePort ? `:${p.nodePort}` : ''}/{p.protocol}
                       {p.name ? <span className="text-xs text-zinc-500 ml-1">({p.name})</span> : ''}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-2">
                <div className="flex flex-wrap gap-1 max-w-xs">
                    {row.selector ? Object.entries(row.selector).map(([k, v], idx) => (
                        <span key={idx} className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs border border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                            {k}={v}
                        </span>
                    )) : <span className="text-zinc-400 italic">None</span>}
                </div>
              </td>
              <td className="px-4 py-2 whitespace-nowrap">{row.created ? new Date(row.created).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No services found in this namespace</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ServicesFetcher({ namespace }: { namespace: string }) {
  const { data, error } = useSWR(`/api/tools/k8s-services?namespace=${namespace}`, fetcher, {
      suspense: true,
      fallbackData: { data: [] }
  });
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!data || !data.data) return <div>No data found.</div>;
  return <ServicesTable data={data.data} />;
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

export default function K8sServicesPage() {
  const [namespace, setNamespace] = useState("default");
  const [fetchKey, setFetchKey] = useState(0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-6xl flex-col gap-8 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">K8s Services</h1>
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

        <Suspense fallback={<div className="text-center py-10">Loading services...</div>}>
            <ServicesFetcher key={`${namespace}-${fetchKey}`} namespace={namespace} />
        </Suspense>
      </main>
    </div>
  );
}

