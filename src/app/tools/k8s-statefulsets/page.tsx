"use client";

import { useState, Suspense } from "react";
import useSWR from "swr";

function fetcher(url: string) {
  return fetch(url).then((res) => res.json());
}

interface StatefulSet {
  name: string;
  ready: string;
  serviceName: string;
  age: string;
}

function StatefulSetsTable({ data }: { data: StatefulSet[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Ready</th>
            <th className="px-4 py-2 text-left">Service Name</th>
            <th className="px-4 py-2 text-left">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
              <td className="px-4 py-2">{row.name}</td>
              <td className="px-4 py-2">{row.ready}</td>
              <td className="px-4 py-2">{row.serviceName}</td>
              <td className="px-4 py-2">{row.age ? new Date(row.age).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
           {data.length === 0 && (
            <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">No statefulsets found in this namespace</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatefulSetsFetcher({ namespace }: { namespace: string }) {
  const { data, error } = useSWR(`/api/tools/k8s-statefulsets?namespace=${namespace}`, fetcher, {
      suspense: true,
      fallbackData: { data: [] }
  });
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!data || !data.data) return <div>No data found.</div>;
  return <StatefulSetsTable data={data.data} />;
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

export default function K8sStatefulSetsPage() {
  const [namespace, setNamespace] = useState("default");
  const [fetchKey, setFetchKey] = useState(0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col gap-8 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">K8s StatefulSets</h1>
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
          <Suspense fallback={<div className="text-gray-500">Loading statefulsets...</div>}>
            <StatefulSetsFetcher key={namespace + fetchKey} namespace={namespace} />
          </Suspense>
        )}
      </main>
    </div>
  );
}

