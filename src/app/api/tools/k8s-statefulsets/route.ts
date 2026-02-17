import { NextRequest, NextResponse } from "next/server";
import { getStatefulSets } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const namespace = searchParams.get("namespace")?.trim() || "default";
  const context = searchParams.get("context") || undefined;

  try {
    const items = await getStatefulSets(namespace, context);
    return NextResponse.json({ data: items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch StatefulSets";
    console.error("Error fetching StatefulSets:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
