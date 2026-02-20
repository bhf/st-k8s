"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
    useEffect,
} from "react";

// ---------- shared types ----------

export interface AttachedResource {
    id: string;
    name: string;
    type: string;
    data: unknown;
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ChatSession {
    id: string;
    /** Title derived from the first user message (truncated). */
    title: string;
    timestamp: number;
    messages: ChatMessage[];
    attachments: AttachedResource[];
}

// ---------- context shape ----------

interface ChatContextType {
    // Active messages
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;

    // Attachments
    attachedResources: AttachedResource[];
    addAttachment: (resource: Omit<AttachedResource, "id">) => void;
    removeAttachment: (id: string) => void;
    clearAttachments: () => void;

    // Session history
    chatHistory: ChatSession[];
    startNewSession: () => void;
    resumeSession: (session: ChatSession) => void;
    deleteSession: (id: string) => void;
    clearAllHistory: () => void;
}

const STORAGE_KEY_ATTACHMENTS = "chat_attachments";
const STORAGE_KEY_SESSIONS = "chat_sessions";

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ---------- helpers ----------

function loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function sessionTitle(messages: ChatMessage[]): string {
    const first = messages.find((m) => m.role === "user");
    if (!first) return "Untitled session";
    return first.content.length > 50
        ? first.content.slice(0, 50) + "…"
        : first.content;
}

// ---------- provider ----------

export function ChatProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<ChatMessage[]>(() =>
        loadFromStorage<ChatMessage[]>("chat_active_messages", [])
    );

    const [attachedResources, setAttachedResources] = useState<AttachedResource[]>(() =>
        loadFromStorage<AttachedResource[]>(STORAGE_KEY_ATTACHMENTS, [])
    );

    const [chatHistory, setChatHistory] = useState<ChatSession[]>(() =>
        loadFromStorage<ChatSession[]>(STORAGE_KEY_SESSIONS, [])
    );

    // Persist active messages
    useEffect(() => {
        localStorage.setItem("chat_active_messages", JSON.stringify(messages));
    }, [messages]);

    // Persist attachments
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_ATTACHMENTS, JSON.stringify(attachedResources));
    }, [attachedResources]);

    // Persist history
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(chatHistory));
    }, [chatHistory]);

    // Cross-tab sync for attachments
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY_ATTACHMENTS && e.newValue) {
                try {
                    setAttachedResources(JSON.parse(e.newValue));
                } catch (err) {
                    console.error("Sync error (attachments)", err);
                }
            }
            if (e.key === STORAGE_KEY_SESSIONS && e.newValue) {
                try {
                    setChatHistory(JSON.parse(e.newValue));
                } catch (err) {
                    console.error("Sync error (sessions)", err);
                }
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    // ----- attachment operations -----

    const addAttachment = useCallback((resource: Omit<AttachedResource, "id">) => {
        setAttachedResources((prev) => {
            const exists = prev.some(
                (r) => r.name === resource.name && r.type === resource.type
            );
            if (exists) return prev;
            return [
                ...prev,
                { ...resource, id: `${resource.type}-${resource.name}-${Date.now()}` },
            ];
        });
    }, []);

    const removeAttachment = useCallback((id: string) => {
        setAttachedResources((prev) => prev.filter((r) => r.id !== id));
    }, []);

    const clearAttachments = useCallback(() => {
        setAttachedResources([]);
    }, []);

    // ----- session operations -----

    const startNewSession = useCallback(() => {
        // Archive current session only if it has at least one message
        setMessages((currentMessages) => {
            if (currentMessages.length > 0) {
                const session: ChatSession = {
                    id: `session-${Date.now()}`,
                    title: sessionTitle(currentMessages),
                    timestamp: Date.now(),
                    messages: currentMessages,
                    attachments: [],
                };
                // Capture current attachments snapshot for the archive
                setAttachedResources((currentAttachments) => {
                    session.attachments = [...currentAttachments];
                    setChatHistory((prev) => [session, ...prev]);
                    return []; // clear attachments
                });
            }
            return []; // clear messages
        });
    }, []);

    const resumeSession = useCallback((session: ChatSession) => {
        // Archive the current active session first (if non-empty), then load the chosen one
        setMessages((currentMessages) => {
            if (currentMessages.length > 0) {
                const archived: ChatSession = {
                    id: `session-${Date.now()}`,
                    title: sessionTitle(currentMessages),
                    timestamp: Date.now(),
                    messages: currentMessages,
                    attachments: [],
                };
                setAttachedResources((currentAttachments) => {
                    archived.attachments = [...currentAttachments];
                    setChatHistory((prev) => [
                        archived,
                        ...prev.filter((s) => s.id !== session.id),
                    ]);
                    return session.attachments; // restore session attachments
                });
            } else {
                // Just remove the session from history and load it
                setChatHistory((prev) => prev.filter((s) => s.id !== session.id));
                setAttachedResources(session.attachments);
            }
            return session.messages;
        });
    }, []);

    const deleteSession = useCallback((id: string) => {
        setChatHistory((prev) => prev.filter((s) => s.id !== id));
    }, []);

    const clearAllHistory = useCallback(() => {
        setChatHistory([]);
    }, []);

    return (
        <ChatContext.Provider
            value={{
                messages,
                setMessages,
                attachedResources,
                addAttachment,
                removeAttachment,
                clearAttachments,
                chatHistory,
                startNewSession,
                resumeSession,
                deleteSession,
                clearAllHistory,
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
