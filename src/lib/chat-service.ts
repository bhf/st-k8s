import { CopilotClient } from "@github/copilot-sdk";
import { ChatProvider } from "./llm-providers/types";
import { READ_ONLY_TOOLS, OPERATIONAL_TOOLS } from "./k8s-tools";
import { ChatServiceManager } from "./chat-service-manager";

const SYSTEM_PROMPT = `
You are an expert Kubernetes assistant for the ST-K8s dashboard. 
Your primary goal is to help users understand, monitor, and troubleshoot their Kubernetes clusters. 

SECURITY GUARDRAILS:
- You operate in a STRICTLY READ-ONLY environment.
- You must NOT attempt to create, delete, or modify any resources, files or otherwise on the user's machine. This includes using tools which can modify the user's environment.
- You must NOT attempt to create, delete, or modify any Kubernetes resources (Pods, Deployments, Services, etc.).
- If a user asks you to perform a mutative operation, politely explain that you are restricted to read-only actions for security reasons.
- You can list resources, get logs, view configurations, and provide analysis based on the retrieved data.
- Sensitive operational tools like port forwarding are excluded from your default capabilities.

GUIDELINES:
- Be concise and technical.
- Provide YAML snippets or CLI commands for illustrative purposes when helpful, but always remind the user they must execute them manually if they intend to make changes.
- Use the provided tools to fetch real-time data from the cluster.
`;

// Singleton client/session management
let client: CopilotClient | null = null;
type CopilotSession = Awaited<ReturnType<CopilotClient["createSession"]>>;
let session: CopilotSession | null = null;
let currentModel: string | null = null;
let currentToolsHash: string | null = null;

function getToolsHash(tools: any[]) {
    return tools.map(t => t.name).sort().join(",");
}

export async function getSession(model: string = "gpt-4o", options: { readOnly?: boolean } = { readOnly: true }) {
    const readOnly = options.readOnly !== false;
    const tools = !readOnly ? [...READ_ONLY_TOOLS, ...OPERATIONAL_TOOLS] : READ_ONLY_TOOLS;
    const toolsHash = getToolsHash(tools) + (readOnly ? "-ro" : "-rw");

    console.log(`[ChatService] getSession called with model: ${model}, readOnly: ${readOnly}`);
    
    if (session && currentModel === model && currentToolsHash === toolsHash) {
        console.log(`[ChatService] Reusing existing session`);
        return session;
    }

    if (session) {
        console.log(`[ChatService] Destroying old session to re-configure`);
        try {
            await session.destroy();
        } catch (err) {
            console.warn("[ChatService] Error destroying old session:", err);
        }
        session = null;
    }

    if (!client) {
        client = new ChatServiceManager().getGitHubClient();
    }

    const sessionConfig: any = {
        model,
        tools,
    };

    if (readOnly) {
        sessionConfig.systemMessage = {
            mode: "append",
            content: SYSTEM_PROMPT
        };
    }

    session = await client.createSession(sessionConfig);

    currentModel = model;
    currentToolsHash = toolsHash;
    console.log(`[ChatService] Session created with ${tools.length} tools and readOnly=${readOnly}`);
    
    return session;
}

const manager = new ChatServiceManager();

export function resetService() {
    client = null;
    session = null;
    currentModel = null;
    currentToolsHash = null;
}

export function getProvider(isReadOnly: boolean): ChatProvider {
    return manager.getProvider(isReadOnly);
}

export async function sendMessage(message: string, model: string = "gpt-4o", attachments?: { name: string, type: string, data: unknown }[], isReadOnly: boolean = true) {
    const provider = getProvider(isReadOnly);
    return provider.sendMessage(message, model, attachments, isReadOnly);
}

export async function getModels() {
    const provider = getProvider(true);
    return provider.getModels();
}
