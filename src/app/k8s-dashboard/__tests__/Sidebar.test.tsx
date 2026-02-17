
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Sidebar, { ToolType } from '../Sidebar'

describe('Sidebar', () => {
  const defaultProps = {
    contexts: [{ name: 'ctx-1', isCurrent: true }],
    selectedContext: 'ctx-1',
    onSelectContext: vi.fn(),
    namespaces: ['default', 'kube-system'],
    selectedNamespace: 'default',
    onSelectNamespace: vi.fn(),
    selectedTool: 'pod-resources' as ToolType,
    onSelectTool: vi.fn(),
    isLoadingNamespaces: false,
    isLoadingContexts: false
  }

  it('renders namespaces when not loading', () => {
    render(<Sidebar {...defaultProps} />)
    const select = screen.getByLabelText(/namespace/i) as HTMLSelectElement
    expect(select.options.length).toBe(2)
    expect(select.options[0].text).toBe('default')
  })

  it('renders loading indicator in namespaces dropdown when loading', () => {
    render(<Sidebar {...defaultProps} isLoadingNamespaces={true} />)
    const select = screen.getByLabelText(/namespace/i) as HTMLSelectElement
    expect(select.options.length).toBe(1)
    expect(select.options[0].text).toBe('Loading namespaces...')
    expect(select).toBeDisabled()
  })
})
