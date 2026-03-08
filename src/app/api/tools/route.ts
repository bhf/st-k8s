import { NextRequest, NextResponse } from "next/server";
import {
    getNamespaces,
    getPods,
    getDeployments,
    getServices,
    getDaemonSets,
    getReplicaSets,
    getStatefulSets,
    getIngresses,
    getEndpoints,
    getEvents,
    getPVCs,
    getNodes,
    getConfigMaps,
    getJobs,
    getCronJobs,
    getServiceAccounts,
    getRoles,
    getRoleBindings,
    getPodLogs,
    getContexts,
    startPortForward,
    stopPortForward,
    listPortForwards,
    findPodForService
} from "@/lib/k8s";

export async function POST(req: NextRequest) {
    try {
        const { tool, params, isReadOnly } = await req.json();

        // Handle tool executions
        let result: any = null;

        switch (tool) {
            case "list_contexts":
                result = await getContexts();
                break;
            case "list_namespaces":
                result = await getNamespaces(params.context);
                break;
            case "list_pods":
                result = await getPods(params.namespace, params.context);
                break;
            case "list_deployments":
                result = await getDeployments(params.namespace, params.context);
                break;
            case "list_services":
                result = await getServices(params.namespace, params.context);
                break;
            case "list_daemonsets":
                result = await getDaemonSets(params.namespace, params.context);
                break;
            case "list_replicasets":
                result = await getReplicaSets(params.namespace, params.context);
                break;
            case "list_statefulsets":
                result = await getStatefulSets(params.namespace, params.context);
                break;
            case "list_ingresses":
                result = await getIngresses(params.namespace, params.context);
                break;
            case "list_endpoints":
                result = await getEndpoints(params.namespace, params.context);
                break;
            case "list_events":
                result = await getEvents(params.namespace, params.context);
                break;
            case "list_pvcs":
                result = await getPVCs(params.namespace, params.context);
                break;
            case "list_nodes":
                result = await getNodes(params.context);
                break;
            case "list_configmaps":
                result = await getConfigMaps(params.namespace, params.context);
                break;
            case "list_jobs":
                result = await getJobs(params.namespace, params.context);
                break;
            case "list_cronjobs":
                result = await getCronJobs(params.namespace, params.context);
                break;
            case "list_serviceaccounts":
                result = await getServiceAccounts(params.namespace, params.context);
                break;
            case "list_roles":
                result = await getRoles(params.namespace, params.context);
                break;
            case "list_rolebindings":
                result = await getRoleBindings(params.namespace, params.context);
                break;
            case "get_pod_logs":
                result = await getPodLogs(params.namespace || "default", params.podName, params.containerName, params.tailLines, params.sinceSeconds, params.context);
                break;
            case "start_port_forward":
                if (isReadOnly) throw new Error("start_port_forward is not allowed in read-only mode");
                let targetPod = params.podName;
                if (params.serviceName && !params.podName) {
                    targetPod = await findPodForService(params.namespace || "default", params.serviceName, params.context) || undefined;
                    if (!targetPod) {
                        return NextResponse.json({ error: `No pods found for service ${params.serviceName}` });
                    }
                }
                if (!targetPod) {
                    return NextResponse.json({ error: "Either podName or serviceName must be provided" });
                }
                result = await startPortForward(params.namespace || "default", targetPod, params.containerPort, params.localPort, params.localAddress, params.context);
                break;
            case "stop_port_forward":
                if (isReadOnly) throw new Error("stop_port_forward is not allowed in read-only mode");
                result = { success: await stopPortForward(params.id) };
                break;
            case "list_port_forwards":
                if (isReadOnly) throw new Error("list_port_forwards is not allowed in read-only mode");
                result = listPortForwards();
                break;
            default:
                return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
        }

        return NextResponse.json({ result: JSON.stringify(result) });
    } catch (err: unknown) {
        console.error("Tool execution error:", err);
        const message = err instanceof Error ? err.message : "Failed to execute tool";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
