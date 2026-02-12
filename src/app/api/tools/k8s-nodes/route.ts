export const dynamic = "force-dynamic";

import { getNodes } from "@/lib/k8s";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getNodes();
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
