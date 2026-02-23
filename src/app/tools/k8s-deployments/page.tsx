"use client";

import { useState, Suspense } from "react";
import useSWR from "swr";
import { RefreshSelector } from "@/components/RefreshSelector";
import { useRefresh } from "@/lib/refresh-context";

function fetcher(url: string) {
  return fetch(url).then((res) => res.json());
}

interface Deployment {
  name: string;
  ready: string;
  upToDate: number;
  available: number;
  age: string;
}

function DeploymentsTable({ data }: { data: Deployment[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Ready</th>
            <th className="px-4 py-2 text-left">Up-to-date</th>
            <th className="px-4 py-2 text-left">Available</th>
            <th className="px-4 py-2 text-left">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
              <td className="px-4 py-2">{row.name}</td>
              <td className="px-4 py-2">{row.ready}</td>
              <td className="px-4 py-2">{row.upToDate}</td>
              <td className="px-4 py-2">{row.available}</td>
              <td className="px-4 py-2">{row.age ? new Date(row.age).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No deployments found in this namespace</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DeploymentsFetcher({ namespace }: { namespace: string }) {
  const { autoRefresh, interval, triggerRefresh, setLastUpdated } = useRefresh();
  const { data, error } = useSWR(
    \`/api/tools/k8s-deployments?namespace=\${namespace}&t=\${triggerRefresh}\`, 
    fetcher, 
    {
      suspense: true,
      fallbackData: { data: [] },
      refreshInterval: autoRefresh ? interval * 1000 : 0,
      onSuccess: () => setLastUpdated(new Date()),
    }
  );
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!data || !data.data) return <div>No data found.</div>;
  return <DeploymentsTable data={data.data} />;
}

function NamespaceSelect({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const { data, error } = useSWR("/api/tools/k8s-namespaces", fetcher, {
      suspense: true,
      fallbackData: { namespaces: ["default"] } // Handle SSR/Suspense fallback
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

export default function K8sDeploymentsPage() {
  const [namespace, setNamespace] = useState("default");
  const [fetchKey, setFetchKey] = useState(0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-sans p-4">
      <main className="flex w-full max-w-4xl flex-col gap-8 p-8 bg-zinc-900 rounded-xl shadow-lg border border-zinc-800">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">K8s Deployments</h1>
            <p className="text-zinc-400 text-sm italic">Manage and monitor cluster deployments</p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshSelector />
          </div>
        </div>
        <form
          className="flex gap-4 items-end"
          onSubmit={e => {
            e.preventDefault();
            setFetchKey(k => k + 1);
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="namespace">Namespace</label>
            <Suspense fallback={<div className="h-9 w-48 bg-gray-200 animate-pulse rounded dark:bg-zinc-800"></div>}>
              <NamespaceSelect value={namespace} onChange={setNamespace} />
            </Suspense>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Fetch
          </button>
        </form>
        {fetchKey >= 0 && (
          <Suspense fallback={<div className="text-gray-500">Loading deployments...</div>}>
            <DeploymentsFetcher key={namespace + fetchKey} namespace={namespace} />
          </Suspense>
        )}
      </main>
    </div>
  );
}
