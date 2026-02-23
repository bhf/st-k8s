import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { JsonRenderer } from '../JsonRenderer';
import React from 'react';

// Mock clipboard
const mockClipboard = {
  writeText: vi.fn().mockImplementation(() => Promise.resolve()),
};
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
});

describe('JsonRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders flat objects as badges', () => {
    const data = { status: 'Running', type: 'Pod' };
    render(<JsonRenderer value={data} label="Test Object" />);
    
    expect(screen.getByText('status:')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('type:')).toBeInTheDocument();
    expect(screen.getByText('Pod')).toBeInTheDocument();
  });

  it('renders summary for nested objects', () => {
    const data = { metadata: { name: 'test' }, spec: { replicas: 1 } };
    render(<JsonRenderer value={data} label="Test Nest" />);
    
    expect(screen.getByText('2 keys')).toBeInTheDocument();
  });

  it('opens modal and allows copying JSON', async () => {
    const data = { foo: 'bar' };
    render(<JsonRenderer value={data} label="TestCopy" />);
    
    // Hover and click expand button
    const expandBtn = screen.getByTitle('View full details');
    fireEvent.click(expandBtn);
    
    // Check if modal is open
    expect(screen.getByText('Test Copy')).toBeInTheDocument();
    
    // Click copy button
    const copyBtn = screen.getByText('Copy JSON');
    fireEvent.click(copyBtn);
    
    expect(mockClipboard.writeText).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    expect(await screen.findByText('Copied')).toBeInTheDocument();
    
    // Check if it reverts back
    await act(async () => {
      await new Promise(r => setTimeout(r, 2100));
    });
    
    expect(await screen.findByText('Copy JSON')).toBeInTheDocument();
  });
});
