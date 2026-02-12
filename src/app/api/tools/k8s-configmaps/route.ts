import { NextRequest, NextResponse } from "next/server";
import { getConfigMaps } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let namespace = searchParams.get("namespace");
  if (!namespace || !namespace.trim()) {
    namespace = "default";
  } else {
    namespace = namespace.trim();
  }

  try {
    const items = await getConfigMaps(namespace);
    return NextResponse.json({ data: items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch ConfigMaps";
    console.error("Error fetching ConfigMaps:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
