import { NextRequest, NextResponse } from "next/server";
import { getJobs } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const namespace = req.nextUrl.searchParams.get("namespace") || "default";
    const data = await getJobs(namespace);
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
