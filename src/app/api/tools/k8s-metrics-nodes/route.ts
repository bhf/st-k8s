import { NextRequest, NextResponse } from "next/server";
import { getNodeMetrics } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const context = searchParams.get("context") || undefined;

    try {
        const result = await getNodeMetrics(context);
        return NextResponse.json({ data: result });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch node metrics";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
