import { NextRequest, NextResponse } from "next/server";
import { getPVCs } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const namespace = searchParams.get("namespace")?.trim() || "default";

  try {
    const pvcs = await getPVCs(namespace);
    return NextResponse.json({ data: pvcs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch PVCs";
    console.error("Error fetching PVCs:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
