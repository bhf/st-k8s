/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'
import * as k8s from '@/lib/k8s'

// Mock the k8s library
vi.mock('@/lib/k8s', () => ({
  getPods: vi.fn()
}))

describe('API: k8s-pod-resources', () => {
  it('returns pods data on success', async () => {
    const mockData = [{ podName: 'test-pod', status: 'Running' }]
    vi.mocked(k8s.getPods).mockResolvedValue(mockData as any)

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-pod-resources?namespace=default')
    const res = await GET(req)
    
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ data: mockData })
    expect(k8s.getPods).toHaveBeenCalledWith('default', undefined)
  })

  it('uses default namespace if not provided', async () => {
    vi.mocked(k8s.getPods).mockResolvedValue([])

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-pod-resources')
    await GET(req)
    
    expect(k8s.getPods).toHaveBeenCalledWith('default', undefined)
  })

  it('returns 500 on error', async () => {
    vi.mocked(k8s.getPods).mockRejectedValue(new Error('K8s error'))

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-pod-resources?namespace=test')
    const res = await GET(req)
    
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ error: 'K8s error' })
  })
})
