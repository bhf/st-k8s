import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession, resetService } from "../chat-service";
import { CopilotClient } from "@github/copilot-sdk";

// Mock the CopilotClient
vi.mock("@github/copilot-sdk", () => {
    const createSession = vi.fn().mockResolvedValue({
        destroy: vi.fn(),
    });
    return {
        CopilotClient: vi.fn().mockImplementation(function () {
            return {
                createSession,
                getState: vi.fn().mockReturnValue("disconnected"),
                start: vi.fn(),
                listModels: vi.fn(),
            };
        }),
        defineTool: vi.fn((name, config) => ({ name, ...config })),
    };
});

describe("CopilotService Guardrails", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetService();
    });

    it("should include the strict system prompt during session creation", async () => {
        await getSession("gpt-4o");

        const CopilotClientMock = CopilotClient as any;
        const clientInstance = CopilotClientMock.mock.results[0].value;
        const createSessionSpy = clientInstance.createSession;

        expect(createSessionSpy).toHaveBeenCalled();
        const config = createSessionSpy.mock.calls[0][0];

        expect(config.systemMessage).toBeDefined();
        expect(config.systemMessage.mode).toBe("append");
        expect(config.systemMessage.content).toContain("SECURITY GUARDRAILS");
        expect(config.systemMessage.content).toContain("STRICTLY READ-ONLY");
    });

    it("should filter tools to read-only by default", async () => {
        await getSession("gpt-4o", { readOnly: true });

        const CopilotClientMock = CopilotClient as any;
        const clientInstance = CopilotClientMock.mock.results[0].value;
        const createSessionSpy = clientInstance.createSession;

        const config = createSessionSpy.mock.calls[0][0];
        const toolNames = config.tools.map((t: any) => t.name);

        expect(toolNames).not.toContain("start_port_forward");
        expect(toolNames).not.toContain("stop_port_forward");
        expect(toolNames).toContain("list_pods");
    });

    it("should include operational tools when readOnly is false", async () => {
        await getSession("gpt-4o", { readOnly: false });

        const CopilotClientMock = CopilotClient as any;
        const clientInstance = CopilotClientMock.mock.results[0].value; // Note: Singleton might cause issues here if not careful
        const createSessionSpy = clientInstance.createSession;

        // Since getSession uses a singleton, we might need to trigger a session change
        // In the real implementation, changing options triggers a new session.

        const config = createSessionSpy.mock.calls[createSessionSpy.mock.calls.length - 1][0];
        const toolNames = config.tools.map((t: any) => t.name);

        expect(toolNames).toContain("start_port_forward");
        expect(toolNames).toContain("list_pods");
    });
});
