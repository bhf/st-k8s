"use client";

import { useState, Suspense } from "react";
import useSWR from "swr";

function fetcher(url: string) {
  return fetch(url).then((res) => res.json());
}

interface Job {
  name: string;
  completions: number;
  parallelism: number;
  active: number;
  succeeded: number;
  failed: number;
  startTime: string;
  completionTime: string;
  created: string;
}

function JobsTable({ data }: { data: Job[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Completions</th>
            <th className="px-4 py-2 text-left">Active</th>
            <th className="px-4 py-2 text-left">Succeeded</th>
            <th className="px-4 py-2 text-left">Failed</th>
            <th className="px-4 py-2 text-left">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
              <td className="px-4 py-2">{row.name}</td>
              <td className="px-4 py-2">{row.completions}</td>
              <td className="px-4 py-2">{row.active}</td>
              <td className="px-4 py-2">{row.succeeded}</td>
              <td className="px-4 py-2">{row.failed}</td>
              <td className="px-4 py-2">{row.created ? new Date(row.created).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No jobs found in this namespace</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function JobsFetcher({ namespace }: { namespace: string }) {
  const { data, error } = useSWR(`/api/tools/k8s-jobs?namespace=${namespace}`, fetcher, {
      suspense: true,
      fallbackData: { data: [] }
  });
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!data || !data.data) return <div>No data found.</div>;
  return <JobsTable data={data.data} />;
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

export default function K8sJobsPage() {
  const [namespace, setNamespace] = useState("default");
  const [fetchKey, setFetchKey] = useState(0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col gap-8 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">K8s Jobs</h1>
        <form
          className="flex gap-4 items-end"
          onSubmit={e => {
            e.preventDefault();
            setFetchKey(k => k + 1);
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="namespace" className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Namespace
            </label>
            <Suspense fallback={<div className="w-48 h-8 bg-zinc-100 rounded animate-pulse" />}>
               <NamespaceSelect value={namespace} onChange={setNamespace} />
            </Suspense>
          </div>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:ring-offset-zinc-900"
          >
            Refresh
          </button>
        </form>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">Jobs List</h2>
          <Suspense fallback={<div className="text-zinc-500">Loading jobs...</div>}>
            <JobsFetcher key={`${namespace}-${fetchKey}`} namespace={namespace} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
