import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { RefreshProvider, useRefresh } from '../refresh-context';
import React from 'react';

// Helper component to test the hook
const TestComponent = () => {
    const { autoRefresh, interval, setAutoRefresh, setInterval, refresh, triggerRefresh } = useRefresh();
    return (
        <div>
            <div data-testid="auto-refresh">{String(autoRefresh)}</div>
            <div data-testid="interval">{interval}</div>
            <div data-testid="trigger">{triggerRefresh}</div>
            <button onClick={() => setAutoRefresh(true)}>Set Auto</button>
            <button onClick={() => setInterval(60)}>Set Interval</button>
            <button onClick={() => refresh()}>Trigger Refresh</button>
        </div>
    );
};

describe('RefreshProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock localStorage
        const store: Record<string, string> = {};
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { store[key] = value; });
    });

    it('loads initial state from localStorage', () => {
        localStorage.setItem('k8s-auto-refresh', 'true');
        localStorage.setItem('k8s-refresh-interval', '45');

        render(
            <RefreshProvider>
                <TestComponent />
            </RefreshProvider>
        );

        expect(screen.getByTestId('auto-refresh').textContent).toBe('true');
        expect(screen.getByTestId('interval').textContent).toBe('45');
    });

    it('updates state and persists to localStorage', () => {
        render(
            <RefreshProvider>
                <TestComponent />
            </RefreshProvider>
        );

        act(() => {
            screen.getByText('Set Auto').click();
        });
        expect(screen.getByTestId('auto-refresh').textContent).toBe('true');
        expect(localStorage.setItem).toHaveBeenCalledWith('k8s-auto-refresh', 'true');

        act(() => {
            screen.getByText('Set Interval').click();
        });
        expect(screen.getByTestId('interval').textContent).toBe('60');
        expect(localStorage.setItem).toHaveBeenCalledWith('k8s-refresh-interval', '60');
    });

    it('triggers refresh', () => {
        render(
            <RefreshProvider>
                <TestComponent />
            </RefreshProvider>
        );

        expect(screen.getByTestId('trigger').textContent).toBe('0');

        act(() => {
            screen.getByText('Trigger Refresh').click();
        });

        expect(screen.getByTestId('trigger').textContent).toBe('1');
    });

    it('throws error when useRefresh is used outside of Provider', () => {
        // Suppress console.error for this test as we expect an error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => render(<TestComponent />)).toThrow('useRefresh must be used within a RefreshProvider');

        consoleSpy.mockRestore();
    });
});
