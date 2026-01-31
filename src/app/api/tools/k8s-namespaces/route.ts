import { NextRequest, NextResponse } from "next/server";
import { getNamespaces } from "@/lib/k8s";

export async function GET(req: NextRequest) {
  try {
    const namespaces = await getNamespaces();
    return NextResponse.json({ namespaces });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch namespaces";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
