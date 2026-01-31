import { NextRequest, NextResponse } from "next/server";
import { getServices } from "@/lib/k8s";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const namespace = searchParams.get("namespace")?.trim() || "default";

  try {
    const items = await getServices(namespace);
    return NextResponse.json({ data: items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch Services";
    console.error("Error fetching Services:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
