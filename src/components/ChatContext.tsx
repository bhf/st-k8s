"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

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
    const [attachedResources, setAttachedResources] = useState<AttachedResource[]>([]);

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
