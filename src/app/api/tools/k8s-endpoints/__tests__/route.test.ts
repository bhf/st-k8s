/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'
import * as k8s from '@/lib/k8s'

// Mock the k8s library
vi.mock('@/lib/k8s', () => ({
  getEndpoints: vi.fn()
}))

describe('API: k8s-endpoints', () => {
  it('returns endpoints data on success', async () => {
    const mockData = [{ 
      name: 'test-ep', 
      subsets: [],
      created: '2023-01-01' 
    }]
    vi.mocked(k8s.getEndpoints).mockResolvedValue(mockData as any)

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-endpoints?namespace=default')
    const res = await GET(req)
    
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ data: mockData })
    expect(k8s.getEndpoints).toHaveBeenCalledWith('default', undefined)
  })

  it('uses default namespace if not provided', async () => {
    vi.mocked(k8s.getEndpoints).mockResolvedValue([])

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-endpoints')
    await GET(req)
    
    expect(k8s.getEndpoints).toHaveBeenCalledWith('default', undefined)
  })

  it('returns 500 on error', async () => {
    vi.mocked(k8s.getEndpoints).mockRejectedValue(new Error('K8s error'))

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-endpoints?namespace=test')
    const res = await GET(req)
    
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ error: 'K8s error' })
  })
})
