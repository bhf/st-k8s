import { NextResponse } from "next/server";
import { z } from "zod";

function getToolDefinitions(isReadOnly: boolean) {
    // Define tools schema matching the backend
    const tools: any[] = [
        {
            type: "function",
            function: {
                name: "list_contexts",
                description: "List all available Kubernetes contexts from kubeconfig",
                parameters: { type: "object", properties: {} },
            },
        },
        {
            type: "function",
            function: {
                name: "list_namespaces",
                description: "List all Kubernetes namespaces",
                parameters: {
                    type: "object",
                    properties: {
                        context: { type: "string", description: "Kubernetes context (optional)" },
                    },
                },
            },
        },
        {
            type: "function",
            function: {
                name: "list_pods",
                description: "List pods and their resources in a namespace",
                parameters: {
                    type: "object",
                    properties: {
                        namespace: { type: "string", description: "Kubernetes namespace" },
                        context: { type: "string", description: "Kubernetes context (optional)" },
                    },
                    required: ["namespace"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "list_deployments",
                description: "List deployments in a namespace",
                parameters: {
                    type: "object",
                    properties: {
                        namespace: { type: "string", description: "Kubernetes namespace" },
                        context: { type: "string", description: "Kubernetes context (optional)" },
                    },
                    required: ["namespace"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "list_services",
                description: "List services in a namespace",
                parameters: {
                    type: "object",
                    properties: {
                        namespace: { type: "string", description: "Kubernetes namespace" },
                        context: { type: "string", description: "Kubernetes context (optional)" },
                    },
                    required: ["namespace"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "get_pod_logs",
                description: "Get logs for a specific pod and container",
                parameters: {
                    type: "object",
                    properties: {
                        namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
                        podName: { type: "string", description: "Name of the pod" },
                        containerName: { type: "string", description: "Name of the container (optional)" },
                        tailLines: { type: "number", description: "Number of lines to return from the end of the logs (optional)" },
                        sinceSeconds: { type: "number", description: "How many seconds ago to start logs from (optional)" },
                        context: { type: "string", description: "Kubernetes context (optional)" },
                    },
                    required: ["podName"],
                },
            },
        },
        // We only expose a subset for WebLLM for brevity, or add the rest as needed.
    ];

    if (!isReadOnly) {
        tools.push({
            type: "function",
            function: {
                name: "start_port_forward",
                description: "Initiate port forwarding to a Pod or Service",
                parameters: {
                    type: "object",
                    properties: {
                        namespace: { type: "string", description: "Kubernetes namespace" },
                        podName: { type: "string", description: "Name of the pod" },
                        serviceName: { type: "string", description: "Name of the service" },
                        containerPort: { type: "number", description: "Target container port" },
                        localPort: { type: "number", description: "Local port to listen on" },
                        localAddress: { type: "string", description: "Local address" },
                        context: { type: "string", description: "Kubernetes context" },
                    },
                    required: ["containerPort"],
                },
            },
        });
        // Add additional tools here if needed
    }

    return tools;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const isReadOnly = searchParams.get("isReadOnly") !== "false";
    return NextResponse.json({ tools: getToolDefinitions(isReadOnly) });
}
