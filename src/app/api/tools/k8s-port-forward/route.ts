import { NextRequest, NextResponse } from "next/server";
import { startPortForward, stopPortForward, listPortForwards, findPodForService } from "@/lib/k8s";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const forwards = listPortForwards();
    return NextResponse.json({ data: forwards });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to list port forwards";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { namespace = "default", podName, serviceName, containerPort, localPort, localAddress, context } = body;
    
    let targetPod = podName;
    if (serviceName && !podName) {
      targetPod = await findPodForService(namespace, serviceName, context);
      if (!targetPod) {
        return NextResponse.json({ error: `No pods found for service ${serviceName}` }, { status: 404 });
      }
    }
    
    if (!targetPod) {
      return NextResponse.json({ error: "podName or serviceName is required" }, { status: 400 });
    }
    
    if (!containerPort) {
      return NextResponse.json({ error: "containerPort is required" }, { status: 400 });
    }

    const forward = await startPortForward(namespace, targetPod, Number(containerPort), localPort ? Number(localPort) : undefined, localAddress || '127.0.0.1', context);
    return NextResponse.json({ data: forward });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to start port forward";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const success = await stopPortForward(id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to stop port forward";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
