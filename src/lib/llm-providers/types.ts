export interface ChatProvider {
    sendMessage(
        message: string,
        model: string,
        attachments?: { name: string; type: string; data: unknown }[],
        isReadOnly?: boolean
    ): Promise<string>;

    getModels(): Promise<any[]>;
}
