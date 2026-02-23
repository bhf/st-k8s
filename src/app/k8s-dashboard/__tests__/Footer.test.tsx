
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Footer from '../Footer'

describe('Footer', () => {
  const defaultProps = {
    contexts: [{ name: 'ctx-1', isCurrent: true }],
    selectedContext: 'ctx-1',
    onSelectContext: vi.fn(),
    namespaces: ['default', 'kube-system'],
    selectedNamespace: 'default',
    onSelectNamespace: vi.fn(),
    isLoadingNamespaces: false,
    isLoadingContexts: false
  }

  beforeEach(() => {
    // Provide a default mock for fetch to avoid errors in tests that don't mock it explicitly
    global.fetch = vi.fn().mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({})
      })
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders fixed text elements', () => {
    render(<Footer {...defaultProps} />)
    expect(screen.getByText('ST-K8S')).toBeDefined()
    expect(screen.getByText('CONNECTED')).toBeDefined()
  })

  it('renders context and namespace indicators', () => {
    render(<Footer {...defaultProps} />)
    expect(screen.getByText(/Context/i)).toBeDefined()
    expect(screen.getByText(/Namespace/i)).toBeDefined()
    expect(screen.getByText('ctx-1')).toBeDefined()
    expect(screen.getByText('default')).toBeDefined()
  })

  it('shows loading state for contexts', () => {
    render(<Footer {...defaultProps} isLoadingContexts={true} />)
    // When using shadcn Select, it might show the value or "Loading..." 
    // depending on how it's implemented when disabled.
    // In our Footer, we pass disabled to Select.
    expect(screen.getByRole('combobox', { name: /context/i })).toBeDisabled()
  })

  it('shows loading state for namespaces', () => {
    render(<Footer {...defaultProps} isLoadingNamespaces={true} />)
    expect(screen.getByRole('combobox', { name: /namespace/i })).toBeDisabled()
  })

  it('renders current version', async () => {
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/version')) {
        return Promise.resolve({
          json: () => Promise.resolve({ version: '1.0.0', latestVersion: '1.0.0', updateAvailable: false })
        })
      }
      return Promise.resolve({ json: () => Promise.resolve({}) })
    })
    global.fetch = mockFetch

    render(<Footer {...defaultProps} />)
    expect(await screen.findByText('v1.0.0')).toBeDefined()
  })

  it('triggers update check when clicking version label', async () => {
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/version')) {
        return Promise.resolve({
          json: () => Promise.resolve({ version: '1.0.0', latestVersion: '1.0.0', updateAvailable: false })
        })
      }
      return Promise.resolve({ json: () => Promise.resolve({}) })
    })
    global.fetch = mockFetch

    const { fireEvent } = await import('@testing-library/react')

    render(<Footer {...defaultProps} />)
    const versionLabel = await screen.findByText('v1.0.0')
    
    // Reset call count to check only the click trigger
    mockFetch.mockClear()
    fireEvent.click(versionLabel)

    // Should fetch version again
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/version'))
  })

  it('renders update available badge', async () => {
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/version')) {
        return Promise.resolve({
          json: () => Promise.resolve({ version: '1.0.0', latestVersion: '1.1.0', updateAvailable: true })
        })
      }
      return Promise.resolve({ json: () => Promise.resolve({}) })
    })
    global.fetch = mockFetch

    render(<Footer {...defaultProps} />)
    expect(await screen.findByText('↑ v1.1.0')).toBeDefined()
  })

  it('opens update modal when clicking the update badge', async () => {
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/version')) {
        return Promise.resolve({
          json: () => Promise.resolve({ version: '1.0.0', latestVersion: '1.1.0', updateAvailable: true })
        })
      }
      return Promise.resolve({ json: () => Promise.resolve({}) })
    })
    global.fetch = mockFetch

    const { fireEvent } = await import('@testing-library/react')

    render(<Footer {...defaultProps} />)
    const badge = await screen.findByText('↑ v1.1.0')
    fireEvent.click(badge)

    expect(await screen.findByText(/Update Available: v1.1.0/i)).toBeDefined()
    expect(screen.getByText(/brew update && brew upgrade st-k8s/i)).toBeDefined()
  })
})
