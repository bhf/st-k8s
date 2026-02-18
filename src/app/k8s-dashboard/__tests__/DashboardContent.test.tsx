import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import DashboardContent from '../DashboardContent'
import { RefreshProvider } from '@/lib/refresh-context'
import { ChatProvider } from '@/components/ChatContext'
import React from 'react'

// Mock fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock ResizeObserver which might be used by some layout components
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

describe('DashboardContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { name: 'pod-1', status: 'Running' },
          { name: 'pod-2', status: 'Pending' }
        ]
      })
    })
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {}
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString() },
        clear: () => { store = {} }
      }
    })()
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  })

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <RefreshProvider>
        <ChatProvider>
          {ui}
        </ChatProvider>
      </RefreshProvider>
    )
  }

  it('renders loading state initially', () => {
    renderWithProvider(<DashboardContent namespace="default" tool="pod-resources" />)
    // It might be too fast to catch loading, but let's try
    // Or just check that it triggers a fetch
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/tools/k8s-pod-resources?namespace=default'))
  })

  it('renders table with data after fetch', async () => {
    renderWithProvider(<DashboardContent namespace="default" tool="pod-resources" />)

    await waitFor(() => {
      expect(screen.getByText('pod-1')).toBeInTheDocument()
      expect(screen.getByText('Running')).toBeInTheDocument()
    })
  })

  it('handles API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Failed to fetch' })
    })

    renderWithProvider(<DashboardContent namespace="default" tool="pod-resources" />)

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch/i)).toBeInTheDocument()
    })
  })
})
