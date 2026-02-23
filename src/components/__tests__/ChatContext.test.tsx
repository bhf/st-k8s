import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ChatProvider, useChat } from '../ChatContext';
import type { ChatSession } from '../ChatContext';
import React from 'react';

// ----------------------------------------------------------------
// Helper component that exercises all context operations
// ----------------------------------------------------------------
const TestComponent = () => {
    const {
        messages, setMessages,
        attachedResources, addAttachment, removeAttachment, clearAttachments,
        chatHistory, startNewSession, resumeSession, deleteSession, clearAllHistory,
    } = useChat();

    return (
        <div>
            {/* Messages */}
            <div data-testid="msg-count">{messages.length}</div>
            <div data-testid="messages">{messages.map((m, i) => <div key={i}>{m.content}</div>)}</div>

            {/* Attachments */}
            <div data-testid="att-count">{attachedResources.length}</div>
            <div data-testid="resources">{attachedResources.map(r => <div key={r.id}>{r.name}</div>)}</div>

            {/* History */}
            <div data-testid="history-count">{chatHistory.length}</div>
            <div data-testid="history">{chatHistory.map(s => <div key={s.id} data-testid={`session-${s.id}`}>{s.title}</div>)}</div>

            {/* Actions */}
            <button onClick={() => setMessages([{ role: 'user', content: 'hello' }])}>AddMsg</button>
            <button onClick={() => addAttachment({ name: 'res-1', type: 'pod', data: {} })}>AddAtt</button>
            <button onClick={() => removeAttachment(attachedResources[0]?.id)}>RemoveAtt</button>
            <button onClick={() => clearAttachments()}>ClearAtt</button>
            <button onClick={() => startNewSession()}>NewChat</button>
            <button onClick={() => chatHistory[0] && resumeSession(chatHistory[0])}>Resume</button>
            <button onClick={() => chatHistory[0] && deleteSession(chatHistory[0].id)}>Delete</button>
            <button onClick={() => clearAllHistory()}>ClearHistory</button>
        </div>
    );
};

// ----------------------------------------------------------------
// Tests
// ----------------------------------------------------------------
describe('ChatProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    // ---- attachments (backwards-compatible) ----

    it('loads initial attachments from localStorage', () => {
        const initialData = [{ id: '1', name: 'saved-res', type: 'pod', data: {} }];
        localStorage.setItem('chat_attachments', JSON.stringify(initialData));

        render(<ChatProvider><TestComponent /></ChatProvider>);

        expect(screen.getByTestId('att-count').textContent).toBe('1');
        expect(screen.getByText('saved-res')).toBeInTheDocument();
    });

    it('adds and persists attachments', () => {
        render(<ChatProvider><TestComponent /></ChatProvider>);

        act(() => { screen.getByText('AddAtt').click(); });

        expect(screen.getByTestId('att-count').textContent).toBe('1');
        expect(localStorage.setItem).toHaveBeenCalledWith('chat_attachments', expect.stringContaining('res-1'));
    });

    it('prevents duplicate attachments', () => {
        render(<ChatProvider><TestComponent /></ChatProvider>);

        act(() => {
            screen.getByText('AddAtt').click();
            screen.getByText('AddAtt').click();
        });

        expect(screen.getByTestId('att-count').textContent).toBe('1');
    });

    it('removes attachments', () => {
        render(<ChatProvider><TestComponent /></ChatProvider>);

        act(() => { screen.getByText('AddAtt').click(); });
        expect(screen.getByTestId('att-count').textContent).toBe('1');

        act(() => { screen.getByText('RemoveAtt').click(); });
        expect(screen.getByTestId('att-count').textContent).toBe('0');
    });

    it('clears all attachments', () => {
        render(<ChatProvider><TestComponent /></ChatProvider>);

        act(() => { screen.getByText('AddAtt').click(); });
        act(() => { screen.getByText('ClearAtt').click(); });

        expect(screen.getByTestId('att-count').textContent).toBe('0');
    });

    it('syncs attachments across tabs via storage event', () => {
        render(<ChatProvider><TestComponent /></ChatProvider>);

        const newData = [{ id: 'sync-1', name: 'synced-res', type: 'pod', data: {} }];

        act(() => {
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'chat_attachments',
                newValue: JSON.stringify(newData),
            }));
        });

        expect(screen.getByTestId('att-count').textContent).toBe('1');
        expect(screen.getByText('synced-res')).toBeInTheDocument();
    });

    // ---- session / history ----

    it('startNewSession archives current messages and clears them', () => {
        render(<ChatProvider><TestComponent /></ChatProvider>);

        act(() => { screen.getByText('AddMsg').click(); });
        expect(screen.getByTestId('msg-count').textContent).toBe('1');

        act(() => { screen.getByText('NewChat').click(); });

        expect(screen.getByTestId('msg-count').textContent).toBe('0');
        expect(screen.getByTestId('history-count').textContent).toBe('1');
    });

    it('startNewSession does NOT archive when messages are empty', () => {
        render(<ChatProvider><TestComponent /></ChatProvider>);

        // No messages added
        act(() => { screen.getByText('NewChat').click(); });

        expect(screen.getByTestId('history-count').textContent).toBe('0');
    });

    it('deleteSession removes the correct session', () => {
        render(<ChatProvider><TestComponent /></ChatProvider>);

        // Create two sessions
        act(() => { screen.getByText('AddMsg').click(); });
        act(() => { screen.getByText('NewChat').click(); });
        act(() => { screen.getByText('AddMsg').click(); });
        act(() => { screen.getByText('NewChat').click(); });

        expect(screen.getByTestId('history-count').textContent).toBe('2');

        act(() => { screen.getByText('Delete').click(); }); // deletes most-recent (index 0)

        expect(screen.getByTestId('history-count').textContent).toBe('1');
    });

    it('clearAllHistory removes all sessions', () => {
        render(<ChatProvider><TestComponent /></ChatProvider>);

        act(() => { screen.getByText('AddMsg').click(); });
        act(() => { screen.getByText('NewChat').click(); });

        act(() => { screen.getByText('ClearHistory').click(); });

        expect(screen.getByTestId('history-count').textContent).toBe('0');
    });

    it('resumeSession restores messages and removes session from history', () => {
        render(<ChatProvider><TestComponent /></ChatProvider>);

        // Create an archived session
        act(() => { screen.getByText('AddMsg').click(); });
        act(() => { screen.getByText('NewChat').click(); });

        expect(screen.getByTestId('history-count').textContent).toBe('1');
        expect(screen.getByTestId('msg-count').textContent).toBe('0');

        act(() => { screen.getByText('Resume').click(); });

        expect(screen.getByTestId('msg-count').textContent).toBe('1');
        expect(screen.getByTestId('history-count').textContent).toBe('0');
    });

    it('loads chatHistory from localStorage on init', () => {
        const session: ChatSession = {
            id: 'test-session',
            title: 'Test session',
            timestamp: Date.now(),
            messages: [{ role: 'user', content: 'hi' }],
            attachments: [],
        };
        localStorage.setItem('chat_sessions', JSON.stringify([session]));

        render(<ChatProvider><TestComponent /></ChatProvider>);

        expect(screen.getByTestId('history-count').textContent).toBe('1');
        expect(screen.getByText('Test session')).toBeInTheDocument();
    });

    it('syncs chatHistory across tabs via storage event', () => {
        render(<ChatProvider><TestComponent /></ChatProvider>);

        const session: ChatSession = {
            id: 'tab-session',
            title: 'Tab session',
            timestamp: Date.now(),
            messages: [{ role: 'user', content: 'cross-tab' }],
            attachments: [],
        };

        act(() => {
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'chat_sessions',
                newValue: JSON.stringify([session]),
            }));
        });

        expect(screen.getByTestId('history-count').textContent).toBe('1');
        expect(screen.getByText('Tab session')).toBeInTheDocument();
    });

    it('throws error when useChat is used outside of Provider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => render(<TestComponent />)).toThrow('useChat must be used within a ChatProvider');
        consoleSpy.mockRestore();
    });
});
