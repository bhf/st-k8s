import { NextRequest, NextResponse } from "next/server";
import { getDaemonSets } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let namespace = searchParams.get("namespace");
  if (!namespace || !namespace.trim()) {
    namespace = "default";
  } else {
    namespace = namespace.trim();
  }
  const context = searchParams.get("context") || undefined;

  try {
    const items = await getDaemonSets(namespace, context);
    return NextResponse.json({ data: items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch DaemonSets";
    console.error("Error fetching DaemonSets:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
