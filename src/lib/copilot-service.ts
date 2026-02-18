import { z } from "zod";
import { CopilotClient, defineTool } from "@github/copilot-sdk";
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
const listContextsTool = defineTool("list_contexts", {
  description: "List all available Kubernetes contexts from kubeconfig",
  parameters: z.object({}),
  handler: async () => {
    const contexts = await getContexts();
    return JSON.stringify(contexts);
  },
});

const listNamespacesTool = defineTool("list_namespaces", {
  description: "List all Kubernetes namespaces",
  parameters: z.object({
    context: z.string().optional().describe("Kubernetes context (optional)"),
  }),
  handler: async ({ context }) => {
    const namespaces = await getNamespaces(context);
    return JSON.stringify(namespaces);
  },
});

const listPodsTool = defineTool("list_pods", {
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

const listDeploymentsTool = defineTool("list_deployments", {
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

const listServicesTool = defineTool("list_services", {
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

const listDaemonSetsTool = defineTool("list_daemonsets", {
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

const listReplicaSetsTool = defineTool("list_replicasets", {
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

const listStatefulSetsTool = defineTool("list_statefulsets", {
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

const listIngressesTool = defineTool("list_ingresses", {
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

const listEndpointsTool = defineTool("list_endpoints", {
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

const listEventsTool = defineTool("list_events", {
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

const listPVCsTool = defineTool("list_pvcs", {
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

const listNodesTool = defineTool("list_nodes", {
    description: "List Kubernetes nodes",
    parameters: z.object({
        context: z.string().optional().describe("Kubernetes context (optional)"),
    }),
    handler: async ({ context }) => {
        const nodes = await getNodes(context);
        return JSON.stringify(nodes);
    }
});

const listConfigMapsTool = defineTool("list_configmaps", {
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

const listJobsTool = defineTool("list_jobs", {
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

const listCronJobsTool = defineTool("list_cronjobs", {
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

const listServiceAccountsTool = defineTool("list_serviceaccounts", {
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

const listRolesTool = defineTool("list_roles", {
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

const listRoleBindingsTool = defineTool("list_rolebindings", {
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

const startPortForwardTool = defineTool("start_port_forward", {
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

const stopPortForwardTool = defineTool("stop_port_forward", {
    description: "Terminate an active port forwarding session",
    parameters: z.object({
        id: z.string().describe("Unique ID of the port forward session"),
    }),
    handler: async ({ id }) => {
        const success = await stopPortForward(id);
        return JSON.stringify({ success });
    }
});

const listPortForwardsTool = defineTool("list_port_forwards", {
    description: "List all active port forwarding sessions",
    parameters: z.object({}),
    handler: async () => {
        const forwards = listPortForwards();
        return JSON.stringify(forwards);
    }
});

const getPodLogsTool = defineTool("get_pod_logs", {
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

// Singleton client/session management
// Note: In serverless environment, this might be re-initialized.
// Ideally, for a robust app, we-d persist session state or use a persistent server.
// For this local dashboard, this global variable approach might work if next dev is used.
let client: CopilotClient | null = null;
type CopilotSession = Awaited<ReturnType<CopilotClient["createSession"]>>;
let session: CopilotSession | null = null;
let currentModel: string | null = null;

export async function getSession(model: string = "gpt-4o") {
  console.log(`[CopilotService] getSession called with model: ${model}`);
  console.log(`[CopilotService] Current active model: ${currentModel}`);
  
  if (session && currentModel === model) {
    console.log(`[CopilotService] Reusing existing session for model: ${model}`);
    return session;
  }

  // If we have an existing session but need a different model, destroy the old one
  if (session) {
    console.log(`[CopilotService] Destroying old session (model: ${currentModel}) to switch to ${model}`);
    try {
      await session.destroy();
    } catch (err) {
      console.warn("[CopilotService] Error destroying old session:", err);
    }
    session = null;
  }

  console.log(`[CopilotService] Creating NEW session for model: ${model}`);

  if (!client) {
    client = new CopilotClient({ logLevel: "info" });
  }

  session = await client.createSession({
    model,
    tools: [
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
        startPortForwardTool,
        stopPortForwardTool,
        listPortForwardsTool
    ]
  });
  currentModel = model;
  console.log(`[CopilotService] Session created. currentModel updated to: ${currentModel}`);

  return session;
}

export async function sendMessage(message: string, model: string = "gpt-4o") {
    const sess = await getSession(model);
    // Use sendAndWait as per example
    const result = await sess.sendAndWait({ prompt: message });

    if (!result) {
        throw new Error("Failed to get response from Copilot");
    }

    return result.data.content;
}

export async function getModels() {
  if (!client) {
    client = new CopilotClient({ logLevel: "info" });
  }
  
  try {
      if (client.getState() === "disconnected") {
           await client.start();
      }

      const models = await client.listModels();
      return models;
  } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Not authenticated")) {
          console.warn("[CopilotService] Not authenticated with GitHub Copilot. Chat features will be disabled until authenticated.");
      } else {
          console.error("Failed to list models:", error);
      }
      return [];
  }
}
