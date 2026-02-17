import { NextRequest, NextResponse } from "next/server";
import { getDeployments } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const context = searchParams.get("context") || undefined;
  let namespace = searchParams.get("namespace");
  if (!namespace || !namespace.trim()) {
    namespace = "default";
  } else {
    namespace = namespace.trim();
  }

  try {
    const items = await getDeployments(namespace, context ?? undefined);
    return NextResponse.json({ data: items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch Deployments";
    console.error("Error fetching Deployments:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
