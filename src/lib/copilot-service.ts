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
  getCronJobs
} from "./k8s";

// Define tools
const listNamespacesTool = defineTool("list_namespaces", {
  description: "List all Kubernetes namespaces",
  parameters: z.object({}),
  handler: async () => {
    const namespaces = await getNamespaces();
    return JSON.stringify(namespaces);
  },
});

const listPodsTool = defineTool("list_pods", {
  description: "List pods and their resources in a namespace",
  parameters: z.object({
    namespace: z.string().describe("Kubernetes namespace"),
  }),
  handler: async ({ namespace }) => {
    const pods = await getPods(namespace);
    return JSON.stringify(pods);
  },
});

const listDeploymentsTool = defineTool("list_deployments", {
    description: "List deployments in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
    }),
    handler: async ({ namespace }) => {
        const deployments = await getDeployments(namespace);
        return JSON.stringify(deployments);
    }
});

const listServicesTool = defineTool("list_services", {
    description: "List services in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
    }),
    handler: async ({ namespace }) => {
        const services = await getServices(namespace);
        return JSON.stringify(services);
    }
});

const listDaemonSetsTool = defineTool("list_daemonsets", {
    description: "List DaemonSets in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
    }),
    handler: async ({ namespace }) => {
        const daemonSets = await getDaemonSets(namespace);
        return JSON.stringify(daemonSets);
    }
});

const listReplicaSetsTool = defineTool("list_replicasets", {
    description: "List ReplicaSets in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
    }),
    handler: async ({ namespace }) => {
        const replicaSets = await getReplicaSets(namespace);
        return JSON.stringify(replicaSets);
    }
});

const listStatefulSetsTool = defineTool("list_statefulsets", {
    description: "List StatefulSets in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
    }),
    handler: async ({ namespace }) => {
        const statefulSets = await getStatefulSets(namespace);
        return JSON.stringify(statefulSets);
    }
});

const listIngressesTool = defineTool("list_ingresses", {
    description: "List Ingresses in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
    }),
    handler: async ({ namespace }) => {
        const ingresses = await getIngresses(namespace);
        return JSON.stringify(ingresses);
    }
});

const listEndpointsTool = defineTool("list_endpoints", {
    description: "List Endpoints in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
    }),
    handler: async ({ namespace }) => {
        const endpoints = await getEndpoints(namespace);
        return JSON.stringify(endpoints);
    }
});

const listEventsTool = defineTool("list_events", {
    description: "List Events in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
    }),
    handler: async ({ namespace }) => {
        const events = await getEvents(namespace);
        return JSON.stringify(events);
    }
});

const listPVCsTool = defineTool("list_pvcs", {
    description: "List PersistentVolumeClaims in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
    }),
    handler: async ({ namespace }) => {
        const pvcs = await getPVCs(namespace);
        return JSON.stringify(pvcs);
    }
});

const listNodesTool = defineTool("list_nodes", {
    description: "List Kubernetes nodes",
    parameters: z.object({}),
    handler: async () => {
        const nodes = await getNodes();
        return JSON.stringify(nodes);
    }
});

const listConfigMapsTool = defineTool("list_configmaps", {
    description: "List Kubernetes ConfigMaps in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
    }),
    handler: async ({ namespace }) => {
        const configMaps = await getConfigMaps(namespace);
        return JSON.stringify(configMaps);
    }
});

const listJobsTool = defineTool("list_jobs", {
    description: "List Kubernetes Jobs in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
    }),
    handler: async ({ namespace }) => {
        const jobs = await getJobs(namespace);
        return JSON.stringify(jobs);
    }
});

const listCronJobsTool = defineTool("list_cronjobs", {
    description: "List Kubernetes CronJobs in a namespace",
    parameters: z.object({
        namespace: z.string().describe("Kubernetes namespace"),
    }),
    handler: async ({ namespace }) => {
        const cronJobs = await getCronJobs(namespace);
        return JSON.stringify(cronJobs);
    }
});

// Singleton client/session management
// Note: In serverless environment, this might be re-initialized.
// Ideally, for a robust app, we'd persist session state or use a persistent server.
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
        listCronJobsTool
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
      console.error("Failed to list models:", error);
      return [];
  }
}

