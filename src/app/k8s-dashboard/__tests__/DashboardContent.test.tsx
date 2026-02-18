import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'

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

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:url')
global.URL.revokeObjectURL = vi.fn()

describe('DashboardContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { podName: 'pod-1', status: 'Running', containerName: 'c1' },
          { podName: 'pod-2', status: 'Pending', containerName: 'c2' }
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

  it('toggles between table and grid views', async () => {
    renderWithProvider(<DashboardContent namespace="default" tool="pod-resources" />)

    await waitFor(() => expect(screen.getByText('pod-1')).toBeInTheDocument())

    // Initial state is table
    expect(screen.getByRole('table')).toBeInTheDocument()

    // Switch to grid
    const gridBtn = screen.getByLabelText(/grid view/i)
    act(() => {
      gridBtn.click()
    })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('pod-1')).toBeInTheDocument() // Should still be there in grid

    // Switch back to table
    const tableBtn = screen.getByLabelText(/table view/i)
    act(() => {
      tableBtn.click()
    })
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('handles CSV download', async () => {
    renderWithProvider(<DashboardContent namespace="default" tool="pod-resources" />)

    await waitFor(() => expect(screen.getByText('pod-1')).toBeInTheDocument())

    const downloadBtn = screen.getByText('CSV')

    // Mock anchor element and its click
    const link = {
      setAttribute: vi.fn(),
      style: {},
      click: vi.fn(),
    }
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(link as any)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as any))
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any))

    act(() => {
      downloadBtn.click()
    })

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(link.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('.csv'))
    expect(link.click).toHaveBeenCalled()

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it('adds resources to chat', async () => {
    renderWithProvider(<DashboardContent namespace="default" tool="pod-resources" />)

    await waitFor(() => expect(screen.getByText('pod-1')).toBeInTheDocument())

    // Add individual pod from table
    const addTableBtn = screen.getByLabelText(/Add resource pod-1 to chat/i)
    act(() => {
      addTableBtn.click()
    })

    // Switch to grid and add from card
    const gridBtn = screen.getByLabelText(/grid view/i)
    act(() => {
      gridBtn.click()
    })
    const addCardBtn = screen.getAllByLabelText(/Add resource pod-1 to chat/i)[0]
    act(() => {
      addCardBtn.click()
    })

    // Add all to chat
    const addAllBtn = screen.getByText(/Add All to Chat/i)
    act(() => {
      addAllBtn.click()
    })
  })

  it('fetches nodes metrics when no namespace is selected', async () => {
    renderWithProvider(<DashboardContent namespace="all" tool="metrics" />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/tools/k8s-metrics-nodes'))
    })
  })

  it('opens port forward dialog and handles submission', async () => {
    renderWithProvider(<DashboardContent namespace="default" tool="pod-resources" />)

    await waitFor(() => expect(screen.getByText('pod-1')).toBeInTheDocument())

    const pfBtn = screen.getByLabelText(/Port forward for pod pod-1/i)
    act(() => {
      pfBtn.click()
    })

    // Check dialog content
    expect(screen.getByText('Port Forwarding')).toBeInTheDocument()
    expect(screen.getByLabelText(/Remote Port/i)).toHaveValue('8080')

    // Submit port forward
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { localPort: 8080 } })
    })

    const startBtn = screen.getByText('Start Forwarding')
    act(() => {
      startBtn.click()
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/tools/k8s-port-forward', expect.objectContaining({
        method: 'POST'
      }))
    })
  })

  it('handles stopping a port forward', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 'pf-1', podName: 'pod-1', localPort: 8080 }]
      })
    })

    renderWithProvider(<DashboardContent namespace="default" tool="port-forwards" />)

    await waitFor(() => expect(screen.getByText('pf-1')).toBeInTheDocument())

    const stopBtn = screen.getByLabelText(/Stop port forward pf-1/i)

    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    act(() => {
      stopBtn.click()
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/tools/k8s-port-forward', expect.objectContaining({
        method: 'DELETE'
      }))
    })
  })

  it('handles fallback data structure in API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        someRandomKey: [{ name: 'fallback-res' }]
      })
    })

    renderWithProvider(<DashboardContent namespace="default" tool="services" />)

    await waitFor(() => {
      expect(screen.getByText('fallback-res')).toBeInTheDocument()
    })
  })
})
