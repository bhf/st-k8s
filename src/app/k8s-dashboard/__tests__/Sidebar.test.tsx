
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Sidebar, { ToolType } from '../Sidebar'

describe('Sidebar', () => {
  const defaultProps = {
    selectedTool: 'pod-resources' as ToolType,
    onSelectTool: vi.fn()
  }

  it('renders tool list', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getByText(/Pod Resources/i)).toBeDefined()
    expect(screen.getByText(/Deployments/i)).toBeDefined()
  })

  it('calls onSelectTool when a tool is clicked', async () => {
    render(<Sidebar {...defaultProps} />)
    const button = screen.getByText(/Deployments/i).closest('button')
    button?.click()
    expect(defaultProps.onSelectTool).toHaveBeenCalledWith('deployments')
  })
})
