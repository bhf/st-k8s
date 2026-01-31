"use client";

import useSWR from "swr";

function fetcher(url: string) {
  return fetch(url).then((res) => res.json());
}

function NamespacesTable({ namespaces }: { namespaces: string[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-4 py-2 text-left">Namespace Name</th>
          </tr>
        </thead>
        <tbody>
          {namespaces.map((ns, i) => (
            <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
              <td className="px-4 py-2">{ns}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NamespacesFetcher() {
  const { data, error, isLoading } = useSWR("/api/tools/k8s-namespaces", fetcher);

  if (isLoading) return <div className="text-gray-500">Loading namespaces...</div>;
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!data || !data.namespaces) return <div>No namespaces found.</div>;
  return <NamespacesTable namespaces={data.namespaces} />;
}

export default function K8sNamespacesPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col gap-8 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">Kubernetes Namespaces</h1>
        <p className="text-gray-600 dark:text-gray-400">List of all available namespaces in the cluster.</p>

        <NamespacesFetcher />
      </main>
    </div>
  );
}
