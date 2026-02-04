import { NextRequest, NextResponse } from "next/server";
import { getReplicaSets } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const namespace = searchParams.get("namespace")?.trim() || "default";

  try {
    const items = await getReplicaSets(namespace);
    return NextResponse.json({ data: items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch ReplicaSets";
    console.error("Error fetching ReplicaSets:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
