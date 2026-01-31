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
  getPVCs
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

// Helper to handle namespace argument
const getNamespace = (args: unknown) => {
  const parsed = z.object({ namespace: z.string().optional() }).safeParse(args);
  if (!parsed.success) return "default";
  return parsed.data.namespace?.trim() || "default";
};

// Tool Definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_namespaces",
        description: "List all Kubernetes namespaces",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_pods",
        description: "List pods and their resources in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: { type: "string", description: "Kubernetes namespace (default: default)" },
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
      case "list_namespaces": {
        const namespaces = await getNamespaces();
        return {
          content: [{ type: "text", text: JSON.stringify(namespaces, null, 2) }],
        };
      }

      case "list_pods": {
        const namespace = getNamespace(args);
        const result = await getPods(namespace);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "list_deployments": {
        const namespace = getNamespace(args);
        const items = await getDeployments(namespace);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_services": {
        const namespace = getNamespace(args);
        const items = await getServices(namespace);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_daemonsets": {
        const namespace = getNamespace(args);
        const items = await getDaemonSets(namespace);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_replicasets": {
        const namespace = getNamespace(args);
        const items = await getReplicaSets(namespace);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_statefulsets": {
        const namespace = getNamespace(args);
        const items = await getStatefulSets(namespace);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

       case "list_ingresses": {
        const namespace = getNamespace(args);
        const items = await getIngresses(namespace);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_endpoints": {
        const namespace = getNamespace(args);
        const items = await getEndpoints(namespace);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_events": {
        const namespace = getNamespace(args);
        const items = await getEvents(namespace);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        };
      }

      case "list_pvcs": {
        const namespace = getNamespace(args);
        const pvcs = await getPVCs(namespace);
        return {
          content: [{ type: "text", text: JSON.stringify(pvcs, null, 2) }],
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
