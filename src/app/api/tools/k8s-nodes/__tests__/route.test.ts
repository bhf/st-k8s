/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'
import * as k8s from '@/lib/k8s'

// Mock the k8s library
vi.mock('@/lib/k8s', () => ({
  getNodes: vi.fn()
}))

describe('API: k8s-nodes', () => {
  it('returns nodes data on success', async () => {
    const mockData = [{ 
      name: 'node-1', 
      status: 'Ready',
      role: 'worker',
      version: 'v1.20.0'
    }]
    vi.mocked(k8s.getNodes).mockResolvedValue(mockData as any)

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-nodes')
    // GET for nodes doesn't need params
    const res = await GET()
    
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ data: mockData })
    expect(k8s.getNodes).toHaveBeenCalled()
  })

  it('returns 500 on error', async () => {
    vi.mocked(k8s.getNodes).mockRejectedValue(new Error('K8s error'))

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-nodes')
    const res = await GET()
    
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ error: 'K8s error' })
  })
})
