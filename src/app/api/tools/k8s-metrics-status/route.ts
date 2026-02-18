import { NextRequest, NextResponse } from "next/server";
import { isMetricsAvailable } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const context = searchParams.get("context") || undefined;

    try {
        const available = await isMetricsAvailable();
        return NextResponse.json({ available });
    } catch (err: unknown) {
        return NextResponse.json({ available: false });
    }
}
