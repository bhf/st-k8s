import { NextRequest, NextResponse } from "next/server";
import { getPodLogs, getPodLogStream } from "@/lib/k8s";
import { PassThrough } from "node:stream";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const namespace = searchParams.get("namespace") || "default";
  const context = searchParams.get("context") || undefined;
  const podName = searchParams.get("podName");
  const containerName = searchParams.get("containerName") || undefined;
  const tailLines = searchParams.get("tailLines") ? parseInt(searchParams.get("tailLines")!) : undefined;
  const sinceSeconds = searchParams.get("sinceSeconds") ? parseInt(searchParams.get("sinceSeconds")!) : undefined;
  const stream = searchParams.get("stream") === "true";

  if (!podName) {
    return NextResponse.json({ error: "podName is required" }, { status: 400 });
  }

  try {
    if (stream) {
      if (!containerName) {
        return NextResponse.json({ error: "containerName is required for streaming" }, { status: 400 });
      }

      const responseStream = new TransformStream();
      const writer = responseStream.writable.getWriter();
      const encoder = new TextEncoder();

      const k8sStream = new PassThrough();
      k8sStream.on("data", (chunk) => {
        writer.write(encoder.encode(chunk.toString()));
      });
      k8sStream.on("end", () => {
        writer.close();
      });
      k8sStream.on("error", (err) => {
        console.error("K8s stream error:", err);
        writer.abort(err);
      });

      getPodLogStream(namespace, podName, containerName, k8sStream, tailLines, sinceSeconds, context ?? undefined).catch(err => {
        console.error("Failed to start log stream:", err);
        writer.abort(err);
      });

      return new Response(responseStream.readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } else {
      const logsResponse = await getPodLogs(namespace, podName, containerName, tailLines, sinceSeconds, context ?? undefined);
      return NextResponse.json({ data: logsResponse });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch logs";
    console.error("Error fetching logs:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
