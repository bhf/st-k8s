import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/k8s";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const namespace = searchParams.get("namespace")?.trim() || "default";

  try {
    const items = await getEvents(namespace);
    return NextResponse.json({ data: items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch Events";
    console.error("Error fetching Events:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
