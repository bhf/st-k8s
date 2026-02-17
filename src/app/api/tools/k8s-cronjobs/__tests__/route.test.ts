/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'
import * as k8s from '@/lib/k8s'

// Mock the k8s library
vi.mock('@/lib/k8s', () => ({
  getCronJobs: vi.fn()
}))

describe('API: k8s-cronjobs', () => {
  it('returns cronjobs data on success', async () => {
    const mockData = [{ 
      name: 'test-cronjob', 
      schedule: '* * * * *',
      suspend: false,
      active: 0,
      lastScheduleTime: new Date().toISOString(),
      created: '2023-01-01' 
    }]
    vi.mocked(k8s.getCronJobs).mockResolvedValue(mockData as any)

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-cronjobs?namespace=default')
    const res = await GET(req)
    
    expect(res.status).toBe(200)
    const json = await res.json()
    // JSON parse/stringify might affect Date, so we match loosely inside data or ensure mockData has strings
    // In k8s.ts it returns Date objects but GET returns NextResponse.json which serializes to string.
    // The client parses JSON, getting strings.
    // Our mockExisting returns strings (if I used strings in mockData above, but I used `new Date().toISOString()`)
    // mockData above has strings for Dates.
    expect(json).toEqual({ data: mockData })
    expect(k8s.getCronJobs).toHaveBeenCalledWith('default', undefined)
  })

  it('uses default namespace if not provided', async () => {
    vi.mocked(k8s.getCronJobs).mockResolvedValue([])

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-cronjobs')
    await GET(req)
    
    expect(k8s.getCronJobs).toHaveBeenCalledWith('default', undefined)
  })

  it('returns 500 on error', async () => {
    vi.mocked(k8s.getCronJobs).mockRejectedValue(new Error('K8s error'))

    const req = new NextRequest('http://localhost:3000/api/tools/k8s-cronjobs?namespace=test')
    const res = await GET(req)
    
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ error: 'K8s error' })
  })
})
