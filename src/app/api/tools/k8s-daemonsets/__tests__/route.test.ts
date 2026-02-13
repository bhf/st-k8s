/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'
import * as k8s from '@/lib/k8s'

// Mock the k8s library
vi.mock('@/lib/k8s', () => ({
  getDaemonSets: vi.fn()
}))

describe('API: k8s-daemonsets', () => {
  it('returns daemonsets data on success', async () => {
    const mockData = [{ 
      name: 'test-ds', 
      desired: 3, 
      current: 3, 
      ready: 3, 
      available: 3,
      created: '2023-01-01' 
    }]
    vi.mocked(k8s.getDaemonSets).mockResolvedValue(mockData as any)

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-daemonsets?namespace=default')
    const res = await GET(req)
    
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ data: mockData })
    expect(k8s.getDaemonSets).toHaveBeenCalledWith('default')
  })

  it('uses default namespace if not provided', async () => {
    vi.mocked(k8s.getDaemonSets).mockResolvedValue([])

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-daemonsets')
    await GET(req)
    
    expect(k8s.getDaemonSets).toHaveBeenCalledWith('default')
  })

  it('returns 500 on error', async () => {
    vi.mocked(k8s.getDaemonSets).mockRejectedValue(new Error('K8s error'))

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-daemonsets?namespace=test')
    const res = await GET(req)
    
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ error: 'K8s error' })
  })
})
