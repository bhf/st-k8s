import { CopilotClient } from "@github/copilot-sdk";
import { OpenAICompatibleProvider } from "./llm-providers/openai";
import { ChatProvider } from "./llm-providers/types";
import { READ_ONLY_TOOLS, OPERATIONAL_TOOLS } from "./k8s-tools";
import { getSession } from "./chat-service";

/**
 * Manager class to handle LLM provider selection and orchestration.
 */
export class ChatServiceManager {
    private client: CopilotClient | null = null;

    getGitHubClient(): CopilotClient {
        if (!this.client) {
            this.client = new CopilotClient({ logLevel: "info" });
        }
        return this.client;
    }

    getProvider(isReadOnly: boolean): ChatProvider {
        const providerType = process.env.CHAT_PROVIDER || "copilot";
        const tools = !isReadOnly ? [...READ_ONLY_TOOLS, ...OPERATIONAL_TOOLS] : READ_ONLY_TOOLS;
        
        if (providerType === "openai") {
            return new OpenAICompatibleProvider(
                process.env.OPENAI_API_URL || "https://api.openai.com/v1",
                process.env.OPENAI_API_KEY || "",
                tools
            );
        }

        // Default to GitHub Copilot
        return this.createGitHubProvider(isReadOnly);
    }

    private createGitHubProvider(isReadOnly: boolean): ChatProvider {
        return {
            async sendMessage(message: string, model: string = "gpt-4o", attachments?: { name: string, type: string, data: unknown }[], isReadOnly: boolean = true) {
                const sess = await getSession(model, { readOnly: isReadOnly });

                let fullPrompt = message;
                if (attachments && attachments.length > 0) {
                    const contextStr = attachments.map(a => `[Attached ${a.type}: ${a.name}]\n${JSON.stringify(a.data, null, 2)}`).join("\n\n");
                    fullPrompt = `I have attached the following Kubernetes resource context to this conversation:\n\n${contextStr}\n\nUser Message: ${message}`;
                }

                const result = await sess.sendAndWait({ prompt: fullPrompt });

                if (!result) {
                    throw new Error("Failed to get response from Copilot");
                }

                return result.data.content;
            },
            async getModels() {
                const client = new ChatServiceManager().getGitHubClient();
                try {
                    if (client.getState() === "disconnected") {
                        await client.start();
                    }

                    const models = await client.listModels();
                    return models;
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    if (message.includes("Not authenticated")) {
                        console.warn("[ChatService] Not authenticated with GitHub Copilot. Chat features will be disabled until authenticated.");
                    } else {
                        console.error("Failed to list models:", error);
                    }
                    return [];
                }
            }
        };
    }
}
