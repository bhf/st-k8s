"use client";

import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from "react";
import * as webllm from "@mlc-ai/web-llm";

export interface WebLLMSession {
    engine: webllm.MLCEngineInterface | null;
    loading: boolean;
    progress: webllm.InitProgressReport | null;
    error: string | null;
    loadModel: (modelId: string) => Promise<void>;
    sendMessage: (
        messages: webllm.ChatCompletionMessageParam[],
        onUpdate?: (chunk: string) => void
    ) => Promise<string>;
}

const WebLLMContext = createContext<WebLLMSession | null>(null);

export const useWebLLM = () => {
    const context = useContext(WebLLMContext);
    if (!context) {
        throw new Error("useWebLLM must be used within a WebLLMProvider");
    }
    return context;
};

export const WebLLMProvider = ({ children }: { children: ReactNode }) => {
    const [engine, setEngine] = useState<webllm.MLCEngineInterface | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState<webllm.InitProgressReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    const engineRef = useRef<webllm.MLCEngineInterface | null>(null);

    const loadModel = useCallback(async (modelId: string) => {
        try {
            setLoading(true);
            setError(null);
            setProgress(null);

            // Initialize engine
            console.log(`[WebLLM] Requesting load for model: \${modelId}`);
            
            // Custom model list for Qwen and other small models
            const appConfig: webllm.AppConfig = {
                model_list: [
                    ...webllm.prebuiltAppConfig.model_list.filter(m => 
                        m.model_id.startsWith('Qwen2.5-7B') ||
                        (m.model_id.startsWith('Llama-3.1-8B-') && !m.model_id.endsWith('-1k')) ||
                        m.model_id.startsWith('Llama-3.2-1B') ||
                        m.model_id.startsWith('Hermes-3-Llama-3.1') ||
                        m.model_id.startsWith('Qwen3-1.7B') ||
                        m.model_id.startsWith('Qwen3-4B') ||
                        m.model_id.startsWith('Qwen3-8B')
                    ),
                    {
                        model: "https://huggingface.co/smalinin/Qwen2.5-14B-Instruct_q4f16_1-MLC",
                        model_id: "Qwen2.5-14B-Instruct_q4f16_1-MLC",
                        model_lib: "https://huggingface.co/smalinin/Qwen2.5-14B-Instruct_q4f16_1-MLC/resolve/main/Qwen2.5-14B-Instruct_q4f16_1-webgpu.wasm",
                        low_resource_required: false,
                        vram_required_MB: 10900.0,
                        required_features: ["shader-f16"],
                        overrides: {
                            context_window_size: 4096,
                        },
                    },
                    {
                        model: "https://huggingface.co/cfahlgren1/SmolLM-360M-q016-MLC",
                        model_id: "SmolLM-360M-q016-MLC",
                        model_lib: `\${webllm.modelLibURLPrefix}\${webllm.modelVersion}/SmolLM-360M-Instruct-q0f16-ctx2k_cs1k-webgpu.wasm`,
                        overrides: { context_window_size: 2048 },
                    }
                ]
            };

            const mlcEngine = new webllm.MLCEngine({ appConfig });

            mlcEngine.setInitProgressCallback((p: webllm.InitProgressReport) => {
                console.log(`[WebLLM Progress]`, p);
                setProgress(p);
            });

            await mlcEngine.reload(modelId);
            console.log(`[WebLLM] Successfully loaded model: \${modelId}`);

            engineRef.current = mlcEngine;
            setEngine(mlcEngine);
        } catch (err: unknown) {
            console.error("Failed to load WebLLM model", err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }, []);

    const sendMessage = useCallback(
        async (
            messages: webllm.ChatCompletionMessageParam[],
            onUpdate?: (chunk: string) => void
        ) => {
            const currentEngine = engineRef.current;
            if (!currentEngine) {
                throw new Error("WebLLM engine is not initialized");
            }

            const stream = await currentEngine.chat.completions.create({
                messages,
                stream: true,
            });

            let response = "";
            for await (const chunk of stream) {
                if (chunk.choices[0]?.delta.content) {
                    response += chunk.choices[0].delta.content;
                    if (onUpdate) {
                        onUpdate(response);
                    }
                }
            }

            return response;
        },
        []
    );

    return (
        <WebLLMContext.Provider
            value={{
                engine,
                loading,
                progress,
                error,
                loadModel,
                sendMessage,
            }}
        >
            {children}
        </WebLLMContext.Provider>
    );
};
