"use client";

import { useState, Suspense } from "react";
import useSWR from "swr";

function fetcher(url: string) {
  return fetch(url).then((res) => res.json());
}

interface K8sEvent {
  name: string;
  involvedObject: { kind: string; name: string; namespace: string };
  message: string;
  reason: string;
  source: string;
  type: string;
  firstTimestamp: string;
  lastTimestamp: string;
  count: number;
}

function EventsTable({ data }: { data: K8sEvent[] }) {
  // Sort events by lastTimestamp descending
  const sortedData = [...data].sort((a, b) => {
    const timeA = a.lastTimestamp ? new Date(a.lastTimestamp).getTime() : 0;
    const timeB = b.lastTimestamp ? new Date(b.lastTimestamp).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-zinc-200 dark:border-zinc-700 text-sm">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Reason</th>
            <th className="px-4 py-2 text-left">Object</th>
            <th className="px-4 py-2 text-left w-1/3">Message</th>
            <th className="px-4 py-2 text-left">Last Seen</th>
            <th className="px-4 py-2 text-left">Count</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
              <td className="px-4 py-2">
                 <span className={`px-2 py-0.5 rounded text-xs font-semibold ${row.type === 'Warning' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                    {row.type}
                 </span>
              </td>
              <td className="px-4 py-2 font-medium">{row.reason}</td>
              <td className="px-4 py-2">
                <div className="text-zinc-800 dark:text-zinc-200">{row.involvedObject?.kind}</div>
                <div className="text-zinc-500 text-xs">{row.involvedObject?.name}</div>
              </td>
              <td className="px-4 py-2">{row.message}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                {row.lastTimestamp ? new Date(row.lastTimestamp).toLocaleString() : '-'}
              </td>
              <td className="px-4 py-2">{row.count}</td>
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No events found in this namespace</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function EventsFetcher({ namespace }: { namespace: string }) {
  const { data, error } = useSWR(`/api/tools/k8s-events?namespace=${namespace}`, fetcher, {
      suspense: true,
      fallbackData: { data: [] }
  });
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!data || !data.data) return <div>No data found.</div>;
  return <EventsTable data={data.data} />;
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

export default function K8sEventsPage() {
  const [namespace, setNamespace] = useState("default");
  const [fetchKey, setFetchKey] = useState(0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-6xl flex-col gap-8 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">K8s Events</h1>
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

        <Suspense fallback={<div className="text-center py-10">Loading events...</div>}>
            <EventsFetcher key={`${namespace}-${fetchKey}`} namespace={namespace} />
        </Suspense>
      </main>
    </div>
  );
}

