import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ChatProvider, useChat } from '../ChatContext';
import React from 'react';

const TestComponent = () => {
    const { attachedResources, addAttachment, removeAttachment, clearAttachments } = useChat();
    return (
        <div>
            <div data-testid="count">{attachedResources.length}</div>
            <div data-testid="resources">
                {attachedResources.map(r => <div key={r.id}>{r.name}</div>)}
            </div>
            <button onClick={() => addAttachment({ name: 'res-1', type: 'pod', data: {} })}>Add</button>
            <button onClick={() => removeAttachment(attachedResources[0]?.id)}>Remove</button>
            <button onClick={() => clearAttachments()}>Clear</button>
        </div>
    );
};

describe('ChatProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const store: Record<string, string> = {};
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { store[key] = value; });
    });

    it('loads initial state from localStorage', () => {
        const initialData = [{ id: '1', name: 'saved-res', type: 'pod', data: {} }];
        localStorage.setItem('chat_attachments', JSON.stringify(initialData));

        render(
            <ChatProvider>
                <TestComponent />
            </ChatProvider>
        );

        expect(screen.getByTestId('count').textContent).toBe('1');
        expect(screen.getByText('saved-res')).toBeInTheDocument();
    });

    it('adds and persists attachments', () => {
        render(
            <ChatProvider>
                <TestComponent />
            </ChatProvider>
        );

        act(() => {
            screen.getByText('Add').click();
        });

        expect(screen.getByTestId('count').textContent).toBe('1');
        expect(localStorage.setItem).toHaveBeenCalledWith('chat_attachments', expect.stringContaining('res-1'));
    });

    it('prevents duplicate attachments', () => {
        render(
            <ChatProvider>
                <TestComponent />
            </ChatProvider>
        );

        act(() => {
            screen.getByText('Add').click();
            screen.getByText('Add').click();
        });

        expect(screen.getByTestId('count').textContent).toBe('1');
    });

    it('removes attachments', () => {
        render(
            <ChatProvider>
                <TestComponent />
            </ChatProvider>
        );

        act(() => {
            screen.getByText('Add').click();
        });
        expect(screen.getByTestId('count').textContent).toBe('1');

        act(() => {
            screen.getByText('Remove').click();
        });
        expect(screen.getByTestId('count').textContent).toBe('0');
    });

    it('clears all attachments', () => {
        render(
            <ChatProvider>
                <TestComponent />
            </ChatProvider>
        );

        act(() => {
            screen.getByText('Add').click();
        });

        act(() => {
            screen.getByText('Clear').click();
        });
        expect(screen.getByTestId('count').textContent).toBe('0');
    });

    it('syncs across tabs via storage event', () => {
        render(
            <ChatProvider>
                <TestComponent />
            </ChatProvider>
        );

        const newData = [{ id: 'sync-1', name: 'synced-res', type: 'pod', data: {} }];

        act(() => {
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'chat_attachments',
                newValue: JSON.stringify(newData)
            }));
        });

        expect(screen.getByTestId('count').textContent).toBe('1');
        expect(screen.getByText('synced-res')).toBeInTheDocument();
    });

    it('throws error when useChat is used outside of Provider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => render(<TestComponent />)).toThrow('useChat must be used within a ChatProvider');
        consoleSpy.mockRestore();
    });
});
