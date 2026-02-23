import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

/**
 * Robust mock for localStorage and sessionStorage.
 * This handles environments where window might be missing (Node)
 * or where JSDOM's localStorage is incomplete or read-only.
 */
const createStorageMock = () => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value ? value.toString() : '';
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
        get length() {
            return Object.keys(store).length;
        },
    };
};

const mockStorage = createStorageMock();

if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: mockStorage });
    Object.defineProperty(window, 'sessionStorage', { value: mockStorage });
} else {
    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('sessionStorage', mockStorage);
}

// Cleanup after each test
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockStorage.clear();
});

// Global mocks for Next.js
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
    usePathname: () => '',
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
);

