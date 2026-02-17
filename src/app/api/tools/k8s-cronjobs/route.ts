import { NextRequest, NextResponse } from "next/server";
import { getCronJobs } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const namespace = req.nextUrl.searchParams.get("namespace") || "default";
    const context = req.nextUrl.searchParams.get("context") || undefined;
    const data = await getCronJobs(namespace, context);
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch cronjobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
