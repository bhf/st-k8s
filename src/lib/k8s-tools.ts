import { z } from "zod";
import { defineTool } from "@github/copilot-sdk";
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
} from "./k8s";

// Define tools
export const listContextsTool = defineTool("list_contexts", {
    description: "List all available Kubernetes contexts from kubeconfig",
    parameters: z.object({}),
    handler: async () => {
        const contexts = await getContexts();
        return JSON.stringify(contexts);
    },
});

export const listNamespacesTool = defineTool("list_namespaces", {
    description: "List all Kubernetes namespaces",
    parameters: z.object({
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ context }) => {
        const namespaces = await getNamespaces(context);
        return JSON.stringify(namespaces);
    },
});

export const listPodsTool = defineTool("list_pods", {
    description: "List pods and their resources in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const pods = await getPods(namespace, context);
        return JSON.stringify(pods);
    },
});

export const listDeploymentsTool = defineTool("list_deployments", {
    description: "List deployments in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const deployments = await getDeployments(namespace, context);
        return JSON.stringify(deployments);
    }
});

export const listServicesTool = defineTool("list_services", {
    description: "List services in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const services = await getServices(namespace, context);
        return JSON.stringify(services);
    }
});

export const listDaemonSetsTool = defineTool("list_daemonsets", {
    description: "List DaemonSets in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const daemonSets = await getDaemonSets(namespace, context);
        return JSON.stringify(daemonSets);
    }
});

export const listReplicaSetsTool = defineTool("list_replicasets", {
    description: "List ReplicaSets in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const replicaSets = await getReplicaSets(namespace, context);
        return JSON.stringify(replicaSets);
    }
});

export const listStatefulSetsTool = defineTool("list_statefulsets", {
    description: "List StatefulSets in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const statefulSets = await getStatefulSets(namespace, context);
        return JSON.stringify(statefulSets);
    }
});

export const listIngressesTool = defineTool("list_ingresses", {
    description: "List Ingresses in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const ingresses = await getIngresses(namespace, context);
        return JSON.stringify(ingresses);
    }
});

export const listEndpointsTool = defineTool("list_endpoints", {
    description: "List Endpoints in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const endpoints = await getEndpoints(namespace, context);
        return JSON.stringify(endpoints);
    }
});

export const listEventsTool = defineTool("list_events", {
    description: "List Events in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const events = await getEvents(namespace, context);
        return JSON.stringify(events);
    }
});

export const listPVCsTool = defineTool("list_pvcs", {
    description: "List PersistentVolumeClaims in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const pvcs = await getPVCs(namespace, context);
        return JSON.stringify(pvcs);
    }
});

export const listNodesTool = defineTool("list_nodes", {
    description: "List Kubernetes nodes",
    parameters: z.object({
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ context }) => {
        const nodes = await getNodes(context);
        return JSON.stringify(nodes);
    }
});

export const listConfigMapsTool = defineTool("list_configmaps", {
    description: "List Kubernetes ConfigMaps in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const configMaps = await getConfigMaps(namespace, context);
        return JSON.stringify(configMaps);
    }
});

export const listJobsTool = defineTool("list_jobs", {
    description: "List Kubernetes Jobs in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const jobs = await getJobs(namespace, context);
        return JSON.stringify(jobs);
    }
});

export const listCronJobsTool = defineTool("list_cronjobs", {
    description: "List Kubernetes CronJobs in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const cronJobs = await getCronJobs(namespace, context);
        return JSON.stringify(cronJobs);
    }
});

export const listServiceAccountsTool = defineTool("list_serviceaccounts", {
    description: "List Kubernetes ServiceAccounts in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const serviceAccounts = await getServiceAccounts(namespace, context);
        return JSON.stringify(serviceAccounts);
    }
});

export const listRolesTool = defineTool("list_roles", {
    description: "List Kubernetes Roles in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const roles = await getRoles(namespace, context);
        return JSON.stringify(roles);
    }
});

export const listRoleBindingsTool = defineTool("list_rolebindings", {
    description: "List Kubernetes RoleBindings in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, context }) => {
        const roleBindings = await getRoleBindings(namespace, context);
        return JSON.stringify(roleBindings);
    }
});

export const startPortForwardTool = defineTool("start_port_forward", {
    description: "Initiate port forwarding to a Pod or Service",
    parameters: z.object({
        namespace: z.string().optional().describe("Kubernetes namespace (default: default)"),
        podName: z.string().optional().describe("Name of the pod (optional, if serviceName is provided)"),
        serviceName: z.string().optional().describe("Name of the service (optional, if podName is provided)"),
        containerPort: z.number().describe("Target container port"),
        localPort: z.number().optional().describe("Local port to listen on (optional)"),
        localAddress: z.string().optional().describe("Local address to bind to (default: 127.0.0.1)"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, podName, serviceName, containerPort, localPort, localAddress, context }) => {
        let targetPod = podName;
        if (serviceName && !podName) {
            targetPod = await findPodForService(namespace || "default", serviceName, context) || undefined;
            if (!targetPod) {
                return `Error: No pods found for service ${serviceName}`;
            }
        }
        if (!targetPod) {
            return "Error: Either podName or serviceName must be provided";
        }
        const forward = await startPortForward(namespace || "default", targetPod, containerPort, localPort, localAddress, context);
        return JSON.stringify(forward);
    }
});

export const stopPortForwardTool = defineTool("stop_port_forward", {
    description: "Terminate an active port forwarding session",
    parameters: z.object({
        id: z.string().describe("Unique ID of the port forward session"),
    }),
    handler: async ({ id }) => {
        const success = await stopPortForward(id);
        return JSON.stringify({ success });
    }
});

export const listPortForwardsTool = defineTool("list_port_forwards", {
    description: "List all active port forwarding sessions",
    parameters: z.object({}),
    handler: async () => {
        const forwards = listPortForwards();
        return JSON.stringify(forwards);
    }
});

export const getPodLogsTool = defineTool("get_pod_logs", {
    description: "Get logs for a specific pod and container",
    parameters: z.object({
        namespace: z.string().optional().describe("Kubernetes namespace (default: default)"),
        podName: z.string().describe("Name of the pod"),
        containerName: z.string().optional().describe("Name of the container (optional)"),
        tailLines: z.number().optional().describe("Number of lines to return from the end of the logs (optional)"),
        sinceSeconds: z.number().optional().describe("How many seconds ago to start logs from (optional)"),
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ namespace, podName, containerName, tailLines, sinceSeconds, context }) => {
        const logs = await getPodLogs(namespace || "default", podName, containerName, tailLines, sinceSeconds, context);
        return logs;
    }
});

export const READ_ONLY_TOOLS = [
    listContextsTool,
    listNamespacesTool,
    listPodsTool,
    listDeploymentsTool,
    listServicesTool,
    listDaemonSetsTool,
    listReplicaSetsTool,
    listStatefulSetsTool,
    listIngressesTool,
    listEndpointsTool,
    listEventsTool,
    listPVCsTool,
    listNodesTool,
    listConfigMapsTool,
    listJobsTool,
    listCronJobsTool,
    listServiceAccountsTool,
    listRolesTool,
    listRoleBindingsTool,
    getPodLogsTool,
];

export const OPERATIONAL_TOOLS = [
    startPortForwardTool,
    stopPortForwardTool,
    listPortForwardsTool
];
