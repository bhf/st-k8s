import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
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
  findPodForService,
  getNodeMetrics,
  getPodMetrics
} from "./lib/k8s"; // Using relative path to ensure resolution without extra alias config if needed

const server = new Server(
  {
    name: "k8s-tools-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper to handle arguments
const getK8sArgs = (args: unknown) => {
  const parsed = z.object({
    namespace: z.string().optional(),
    context: z.string().optional()
  }).safeParse(args);

  return {
    namespace: parsed.success ? (parsed.data.namespace?.trim() || "default") : "default",
    context: parsed.success ? (parsed.data.context?.trim() || undefined) : undefined
  };
};

// Tool Definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_contexts",
        description: "List all available Kubernetes contexts from kubeconfig",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_namespaces",
        description: "List all Kubernetes namespaces",
        inputSchema: {
          type: "object",
          properties: {
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_pods",
        description: "List pods and their resources in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_deployments",
        description: "List deployments in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_services",
        description: "List services in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_daemonsets",
        description: "List daemonsets in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_replicasets",
        description: "List replicasets in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_statefulsets",
        description: "List statefulsets in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_ingresses",
        description: "List ingresses in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_endpoints",
        description: "List endpoints in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_events",
        description: "List events in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_pvcs",
        description: "List persistent volume claims in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_nodes",
        description: "List Kubernetes nodes",
        inputSchema: {
          type: "object",
          properties: {
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_configmaps",
        description: "List Kubernetes ConfigMaps in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: {
              type: "string",
              description: "Kubernetes namespace (default: default)",
            },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_jobs",
        description: "List Kubernetes Jobs in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: {
              type: "string",
              description: "Kubernetes namespace (default: default)",
            },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_cronjobs",
        description: "List Kubernetes CronJobs in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: {
              type: "string",
              description: "Kubernetes namespace (default: default)",
            },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_serviceaccounts",
        description: "List Kubernetes ServiceAccounts in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: {
              type: "string",
              description: "Kubernetes namespace (default: default)",
            },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_roles",
        description: "List Kubernetes Roles in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: {
              type: "string",
              description: "Kubernetes namespace (default: default)",
            },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "list_rolebindings",
        description: "List Kubernetes RoleBindings in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: {
              type: "string",
              description: "Kubernetes namespace (default: default)",
            },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "get_pod_logs",
        description: "Get logs for a specific pod and container",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            podName: { type: "string", description: "Name of the pod" },
            containerName: { type: "string", description: "Name of the container (optional)" },
            tailLines: { type: "number", description: "Number of lines to return from the end of the logs (optional)" },
            sinceSeconds: { type: "number", description: "How many seconds ago to start logs from (optional)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
          required: ["podName"],
        },
      },
      {
        name: "start_port_forward",
        description: "Initiate port forwarding to a Pod or Service",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            podName: { type: "string", description: "Name of the pod (optional, if serviceName is provided)" },
            serviceName: { type: "string", description: "Name of the service (optional, if podName is provided)" },
            containerPort: { type: "number", description: "Target container port" },
            localPort: { type: "number", description: "Local port to listen on (optional, choice by system if omitted)" },
            localAddress: { type: "string", description: "Local address to bind to (default: 127.0.0.1)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
          required: ["containerPort"],
        },
      },
      {
        name: "stop_port_forward",
        description: "Terminate an active port forwarding session",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique ID of the port forward session" },
          },
          required: ["id"],
        },
      },
      {
        name: "list_port_forwards",
        description: "List all active port forwarding sessions",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_node_metrics",
        description: "Get resource usage metrics for cluster nodes (CPU/Memory)",
        inputSchema: {
          type: "object",
          properties: {
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
      {
        name: "get_pod_metrics",
        description: "Get resource usage metrics for pods in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
            context: { type: "string", description: "Kubernetes context name (optional)" },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "list_contexts": {
        const contexts = await getContexts();
        return {
          content: [{ type: "text", text: JSON.stringify(contexts, null, 2) }],
        };
      }

      case "list_namespaces": {
        const { context } = getK8sArgs(args);
        const namespaces = await getNamespaces(context);
        return {
          content: [{ type: "text", text: JSON.stringify(namespaces, null, 2) }],
        };
      }

      case "list_pods": {
        const { namespace, context } = getK8sArgs(args);
        const result = await getPods(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "list_deployments": {
        const { namespace, context } = getK8sArgs(args);
        const items = await getDeployments(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_services": {
        const { namespace, context } = getK8sArgs(args);
        const items = await getServices(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_daemonsets": {
        const { namespace, context } = getK8sArgs(args);
        const items = await getDaemonSets(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_replicasets": {
        const { namespace, context } = getK8sArgs(args);
        const items = await getReplicaSets(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_statefulsets": {
        const { namespace, context } = getK8sArgs(args);
        const items = await getStatefulSets(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_ingresses": {
        const { namespace, context } = getK8sArgs(args);
        const items = await getIngresses(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_endpoints": {
        const { namespace, context } = getK8sArgs(args);
        const items = await getEndpoints(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_events": {
        const { namespace, context } = getK8sArgs(args);
        const items = await getEvents(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_pvcs": {
        const { namespace, context } = getK8sArgs(args);
        const pvcs = await getPVCs(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(pvcs, null, 2) }],
        };
      }

      case "list_nodes": {
        const { context } = getK8sArgs(args);
        const nodes = await getNodes(context);
        return {
          content: [{ type: "text", text: JSON.stringify(nodes, null, 2) }],
        };
      }

      case "list_configmaps": {
        const { namespace, context } = getK8sArgs(args);
        const configMaps = await getConfigMaps(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(configMaps, null, 2) }],
        };
      }

      case "list_jobs": {
        const { namespace, context } = getK8sArgs(args);
        const data = await getJobs(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "list_cronjobs": {
        const { namespace, context } = getK8sArgs(args);
        const data = await getCronJobs(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "list_serviceaccounts": {
        const { namespace, context } = getK8sArgs(args);
        const serviceAccounts = await getServiceAccounts(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(serviceAccounts, null, 2) }],
        };
      }

      case "list_roles": {
        const { namespace, context } = getK8sArgs(args);
        const roles = await getRoles(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(roles, null, 2) }],
        };
      }

      case "list_rolebindings": {
        const { namespace, context } = getK8sArgs(args);
        const roleBindings = await getRoleBindings(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(roleBindings, null, 2) }],
        };
      }

      case "get_pod_logs": {
        const parsed = z.object({
          namespace: z.string().optional(),
          podName: z.string(),
          containerName: z.string().optional(),
          tailLines: z.number().optional(),
          sinceSeconds: z.number().optional(),
          context: z.string().optional(),
        }).safeParse(args);

        if (!parsed.success) {
          throw new Error("Invalid arguments for get_pod_logs");
        }

        const { namespace, podName, containerName, tailLines, sinceSeconds, context } = parsed.data;
        const logs = await getPodLogs(namespace || "default", podName, containerName, tailLines, sinceSeconds, context);
        return {
          content: [{ type: "text", text: logs }],
        };
      }

      case "start_port_forward": {
        const parsed = z.object({
          namespace: z.string().optional(),
          podName: z.string().optional(),
          serviceName: z.string().optional(),
          containerPort: z.number(),
          localPort: z.number().optional(),
          localAddress: z.string().optional(),
          context: z.string().optional(),
        }).safeParse(args);

        if (!parsed.success) {
          throw new Error("Invalid arguments for start_port_forward");
        }

        const { namespace, podName, serviceName, containerPort, localPort, localAddress, context } = parsed.data;
        let targetPod = podName;
        if (serviceName && !podName) {
          targetPod = await findPodForService(namespace || "default", serviceName, context) || undefined;
          if (!targetPod) {
            throw new Error(`No pods found for service ${serviceName}`);
          }
        }

        if (!targetPod) {
          throw new Error("Either podName or serviceName must be provided");
        }

        const forward = await startPortForward(namespace || "default", targetPod, containerPort, localPort, localAddress, context);
        return {
          content: [{ type: "text", text: JSON.stringify(forward, null, 2) }],
        };
      }

      case "stop_port_forward": {
        const parsed = z.object({
          id: z.string(),
        }).safeParse(args);

        if (!parsed.success) {
          throw new Error("Invalid arguments for stop_port_forward");
        }

        const { id } = parsed.data;
        const success = await stopPortForward(id);
        return {
          content: [{ type: "text", text: JSON.stringify({ success }, null, 2) }],
        };
      }

      case "list_port_forwards": {
        const forwards = listPortForwards();
        return {
          content: [{ type: "text", text: JSON.stringify(forwards, null, 2) }],
        };
      }

      case "get_node_metrics": {
        const { context } = getK8sArgs(args);
        const metrics = await getNodeMetrics(context);
        return {
          content: [{ type: "text", text: JSON.stringify(metrics, null, 2) }],
        };
      }

      case "get_pod_metrics": {
        const { namespace, context } = getK8sArgs(args);
        const metrics = await getPodMetrics(namespace, context);
        return {
          content: [{ type: "text", text: JSON.stringify(metrics, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();

async function runServer() {
  await server.connect(transport);
}

runServer().catch(console.error);
