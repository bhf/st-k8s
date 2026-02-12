"use client";

import { Suspense } from "react";
import useSWR from "swr";

function fetcher(url: string) {
  return fetch(url).then((res) => res.json());
}

interface Node {
  name: string;
  status: string;
  role: string;
  version: string;
  cpuCapacity: string;
  memoryCapacity: string;
  arch: string;
  os: string;
  created: string;
}

function NodesTable({ data }: { data: Node[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Role</th>
            <th className="px-4 py-2 text-left">Version</th>
            <th className="px-4 py-2 text-left">CPU</th>
            <th className="px-4 py-2 text-left">Memory</th>
            <th className="px-4 py-2 text-left">OS/Arch</th>
            <th className="px-4 py-2 text-left">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
              <td className="px-4 py-2 font-medium">{row.name}</td>
              <td className="px-4 py-2">
                <span className={`px-2 py-1 rounded text-xs ${row.status === 'Ready' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-2">{row.role}</td>
              <td className="px-4 py-2">{row.version}</td>
              <td className="px-4 py-2">{row.cpuCapacity}</td>
              <td className="px-4 py-2">{row.memoryCapacity}</td>
              <td className="px-4 py-2">{row.os}/{row.arch}</td>
              <td className="px-4 py-2">{row.created ? new Date(row.created).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">No nodes found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function NodesPageContent() {
  const { data, error, isLoading } = useSWR(`/api/tools/k8s-nodes`, fetcher);

  if (error) return <div className="p-4 text-red-500">Failed to load nodes.</div>;
  if (isLoading) return <div className="p-4">Loading nodes...</div>;

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Kubernetes Nodes
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Cluster nodes and their resources.
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-black rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <NodesTable data={data?.data || []} />
        </div>
      </div>
    </main>
  );
}

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NodesPageContent />
        </Suspense>
    )
}
