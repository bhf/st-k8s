import { ChatProvider } from "./types";
import { ZodTypeAny, ZodObject, ZodOptional, ZodString, ZodNumber } from "zod";

function zodToJsonSchema(schema: ZodTypeAny): any {
    let description = schema.description;

    if (schema instanceof ZodOptional) {
        const inner = zodToJsonSchema(schema.unwrap() as ZodTypeAny) as any;
        if (description) inner.description = description;
        return inner;
    }
    const base: any = {};
    if (description) {
        base.description = description;
    }
    if (schema instanceof ZodString) {
        return { ...base, type: "string" };
    }
    if (schema instanceof ZodNumber) {
        return { ...base, type: "number" };
    }
    if (schema instanceof ZodObject) {
        const shape = schema.shape;
        const properties: any = {};
        const required: string[] = [];
        for (const [key, val] of Object.entries(shape)) {
            const propSchema = val as ZodTypeAny;
            properties[key] = zodToJsonSchema(propSchema);
            if (!(propSchema instanceof ZodOptional)) {
                required.push(key);
            }
        }
        return {
            ...base,
            type: "object",
            properties,
            required,
            additionalProperties: false,
        };
    }
    return { ...base, type: "string" }; // default fallback
}

export class OpenAICompatibleProvider implements ChatProvider {
    private baseUrl: string;
    private apiKey: string;
    private tools: any[];

    constructor(baseUrl: string, apiKey: string, tools: any[]) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.apiKey = apiKey;
        this.tools = tools;
    }

    private getOpenAITools() {
        return this.tools.map((t) => {
            const parameters = t.parameters
                ? zodToJsonSchema(t.parameters as any)
                : { type: "object", properties: {}, required: [], additionalProperties: false };

            return {
                type: "function",
                function: {
                    name: t.name,
                    description: t.description || "",
                    parameters,
                },
            };
        });
    }

    async getModels(): Promise<any[]> {
        const url = `${this.baseUrl}/models`;
        const headers: Record<string, string> = {};
        if (this.apiKey) {
            headers["Authorization"] = `Bearer ${this.apiKey}`;
        }
        const res = await fetch(url, { headers });
        if (!res.ok) {
            throw new Error(`Failed to map models: ${res.statusText}`);
        }
        const data = await res.json();
        return data.data || [];
    }

    async sendMessage(
        message: string,
        model: string,
        attachments?: { name: string; type: string; data: unknown }[],
        isReadOnly: boolean = true
    ): Promise<string> {
        let fullPrompt = message;
        if (attachments && attachments.length > 0) {
            const contextStr = attachments
                .map((a) => `[Attached ${a.type}: ${a.name}]\n${JSON.stringify(a.data, null, 2)}`)
                .join("\n\n");
            fullPrompt = `I have attached the following Kubernetes resource context to this conversation:\n\n${contextStr}\n\nUser Message: ${message}`;
        }

        const messages: any[] = [];

        if (isReadOnly) {
            messages.push({
                role: "system",
                content: `You are an expert Kubernetes assistant for the ST-K8s dashboard. 
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
- Use the provided tools to fetch real-time data from the cluster.`,
            });
        }

        messages.push({ role: "user", content: fullPrompt });

        const openAiTools = this.getOpenAITools();
        const availableToolsMap = Object.fromEntries(this.tools.map(t => [t.name, t]));

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (this.apiKey) {
            headers["Authorization"] = `Bearer ${this.apiKey}`;
        }

        while (true) {
            const payload: any = {
                model,
                messages,
                tools: openAiTools.length > 0 ? openAiTools : undefined,
                tool_choice: openAiTools.length > 0 ? "auto" : undefined,
            };

            const res = await fetch(`${this.baseUrl}/chat/completions`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`OpenAI API error: ${res.statusText} - ${text}`);
            }

            const data = await res.json();
            const responseMessage = data.choices[0].message;

            messages.push(responseMessage);

            if (responseMessage.tool_calls) {
                for (const toolCall of responseMessage.tool_calls) {
                    const funcName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);

                    const tool = availableToolsMap[funcName];
                    if (!tool) {
                        messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: funcName,
                            content: `Error: Tool ${funcName} not found.`,
                        });
                        continue;
                    }

                    try {
                        const result = await tool.handler(args, { toolCallId: toolCall.id, sessionId: "openai-session", toolName: funcName, arguments: args });
                        messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: funcName,
                            content: typeof result === "string" ? result : JSON.stringify(result),
                        });
                    } catch (e: any) {
                        messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: funcName,
                            content: `Error executing tool ${funcName}: ${e.message}`,
                        });
                    }
                }
                // Loop continues, will make another API call to get the final response
            } else {
                return responseMessage.content || "";
            }
        }
    }
}
