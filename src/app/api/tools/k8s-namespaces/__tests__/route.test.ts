/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'
import * as k8s from '@/lib/k8s'

// Mock the k8s library
vi.mock('@/lib/k8s', () => ({
  getNamespaces: vi.fn()
}))

describe('API: k8s-namespaces', () => {
  it('returns namespaces data on success', async () => {
    const mockData = ['default', 'kube-system']
    vi.mocked(k8s.getNamespaces).mockResolvedValue(mockData)

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-namespaces')
    const res = await GET(req)
    
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ namespaces: mockData })
    expect(k8s.getNamespaces).toHaveBeenCalled()
  })

  it('returns 500 on error', async () => {
    vi.mocked(k8s.getNamespaces).mockRejectedValue(new Error('K8s error'))

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-namespaces')
    const res = await GET(req)
    
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ error: 'K8s error' })
  })
})
