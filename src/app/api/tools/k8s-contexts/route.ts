import { NextRequest, NextResponse } from "next/server";
import { getContexts } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const contexts = getContexts();
    return NextResponse.json({ data: contexts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch Contexts";
    console.error("Error fetching Contexts:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
