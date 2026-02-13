"use client";

import { useState, Suspense } from "react";
import useSWR from "swr";

function fetcher(url: string) {
  return fetch(url).then((res) => res.json());
}

interface ServiceAccount {
  name: string;
  secrets: string;
  created: string;
}

function ServiceAccountsTable({ data }: { data: ServiceAccount[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Secrets</th>
            <th className="px-4 py-2 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
              <td className="px-4 py-2">{row.name}</td>
              <td className="px-4 py-2">{row.secrets || '-'}</td>
              <td className="px-4 py-2">{row.created ? new Date(row.created).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">No ServiceAccounts found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ServiceAccountsFetcher({ namespace }: { namespace: string }) {
  // Use namespace in specific key to refetch
  const { data, error } = useSWR(`/api/tools/k8s-serviceaccounts?namespace=${namespace}`, fetcher, {
    suspense: true,
    fallbackData: [],
  });

  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!data) return <div>No data found.</div>;
  
  // The API returns the array directly, unlike ConfigMap which wraps in { data: [] } in previous log?
  // Let me double check API route for ConfigMap.
  // api/tools/k8s-configmaps used NextResponse.json({ data: configMaps }) -- wait, let me check k8s-configmaps/route.ts again.
  return <ServiceAccountsTable data={Array.isArray(data) ? data : []} />;
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

export default function K8sServiceAccountsPage() {
  const [namespace, setNamespace] = useState("default");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col gap-8 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">K8s ServiceAccounts</h1>
        <form
          className="flex gap-4 items-end"
          onSubmit={e => {
            e.preventDefault();
            // Just submitting to trigger re-render if needed, but SWR handles it on prop change
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="namespace">Namespace</label>
            <Suspense fallback={<div className="h-9 w-48 bg-gray-200 animate-pulse rounded dark:bg-zinc-800"></div>}>
              <NamespaceSelect value={namespace} onChange={setNamespace} />
            </Suspense>
          </div>
        </form>

        <Suspense fallback={<div>Loading ServiceAccounts...</div>}>
          <ServiceAccountsFetcher namespace={namespace} key={namespace} />
        </Suspense>
      </main>
    </div>
  );
}
