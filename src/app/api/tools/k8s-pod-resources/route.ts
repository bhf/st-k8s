import {NextRequest, NextResponse} from "next/server";
import {getPods} from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const context = searchParams.get("context") || undefined;
    // Robustly extract namespace: use 'default' if missing, empty, or whitespace
    let namespace = searchParams.get("namespace");
    if (!namespace || !namespace.trim()) {
        namespace = "default";
    } else {
        namespace = namespace.trim();
    }
    console.info("[K8S] Using namespace:", namespace);
    const namespaceClean = namespace && namespace.trim() ? namespace.trim() : "default";

    try {
        const result = await getPods(namespaceClean, context ?? undefined);
        return NextResponse.json({data: result});
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch pod resources";
        return NextResponse.json({error: message}, {status: 500});
    }
}
