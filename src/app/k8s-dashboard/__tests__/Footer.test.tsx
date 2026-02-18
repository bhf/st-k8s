
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
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
})
