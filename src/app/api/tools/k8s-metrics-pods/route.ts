import { NextRequest, NextResponse } from "next/server";
import { getPodMetrics } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const context = searchParams.get("context") || undefined;
    let namespace = searchParams.get("namespace");

    if (!namespace || !namespace.trim()) {
        namespace = "default";
    } else {
        namespace = namespace.trim();
    }

    try {
        const result = await getPodMetrics(namespace, context);
        return NextResponse.json({ data: result });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch pod metrics";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
