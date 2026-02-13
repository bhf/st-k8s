/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'
import * as k8s from '@/lib/k8s'

// Mock the k8s library
vi.mock('@/lib/k8s', () => ({
  getPVCs: vi.fn()
}))

describe('API: k8s-volumes', () => {
  it('returns PVC data on success', async () => {
    const mockData = [{ 
      name: 'test-pvc', 
      status: 'Bound',
      volume: 'test-vol',
      capacity: '1Gi',
      accessModes: 'RWO',
      storageClass: 'standard',
      created: '2023-01-01' 
    }]
    vi.mocked(k8s.getPVCs).mockResolvedValue(mockData as any)

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-volumes?namespace=default')
    const res = await GET(req)
    
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ data: mockData })
    expect(k8s.getPVCs).toHaveBeenCalledWith('default')
  })

  it('uses default namespace if not provided', async () => {
    vi.mocked(k8s.getPVCs).mockResolvedValue([])

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-volumes')
    await GET(req)
    
    expect(k8s.getPVCs).toHaveBeenCalledWith('default')
  })

  it('returns 500 on error', async () => {
    vi.mocked(k8s.getPVCs).mockRejectedValue(new Error('K8s error'))

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-volumes?namespace=test')
    const res = await GET(req)
    
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ error: 'K8s error' })
  })
})
