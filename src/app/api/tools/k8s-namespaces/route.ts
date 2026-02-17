import { NextRequest, NextResponse } from "next/server";
import { getNamespaces } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const context = searchParams.get("context") || undefined;

  try {
    const namespaces = await getNamespaces(context ?? undefined);
    return NextResponse.json({ namespaces });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch namespaces";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
