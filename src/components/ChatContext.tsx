"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

export interface AttachedResource {
    id: string;
    name: string;
    type: string;
    data: unknown;
}

interface ChatContextType {
    attachedResources: AttachedResource[];
    addAttachment: (resource: Omit<AttachedResource, "id">) => void;
    removeAttachment: (id: string) => void;
    clearAttachments: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [attachedResources, setAttachedResources] = useState<AttachedResource[]>(() => {
        // Initial load from localStorage
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("chat_attachments");
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error("Failed to parse saved chat attachments", e);
                }
            }
        }
        return [];
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem("chat_attachments", JSON.stringify(attachedResources));
    }, [attachedResources]);

    // Sync across tabs
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === "chat_attachments" && e.newValue) {
                try {
                    setAttachedResources(JSON.parse(e.newValue));
                } catch (err) {
                    console.error("Sync error", err);
                }
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const addAttachment = useCallback((resource: Omit<AttachedResource, "id">) => {
        setAttachedResources((prev) => {
            // Avoid duplicates based on name and type
            const exists = prev.some(
                (r) => r.name === resource.name && r.type === resource.type
            );
            if (exists) return prev;

            const newAttachment: AttachedResource = {
                ...resource,
                id: `${resource.type}-${resource.name}-${Date.now()}`,
            };
            return [...prev, newAttachment];
        });
    }, []);

    const removeAttachment = useCallback((id: string) => {
        setAttachedResources((prev) => prev.filter((r) => r.id !== id));
    }, []);

    const clearAttachments = useCallback(() => {
        setAttachedResources([]);
    }, []);

    return (
        <ChatContext.Provider
            value={{
                attachedResources,
                addAttachment,
                removeAttachment,
                clearAttachments,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}
