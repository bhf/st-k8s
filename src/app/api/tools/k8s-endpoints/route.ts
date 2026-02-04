import { NextRequest, NextResponse } from "next/server";
import { getEndpoints } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const namespace = searchParams.get("namespace")?.trim() || "default";

  try {
    const items = await getEndpoints(namespace);
    return NextResponse.json({ data: items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch Endpoints";
    console.error("Error fetching Endpoints:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
