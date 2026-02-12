// src/lib/__tests__/k8s.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as k8sClient from '@kubernetes/client-node'

// Define mocks that need to be accessed in both the mock factory and the tests
const mocks = vi.hoisted(() => {
  return {
    coreApi: {
      listNamespace: vi.fn(),
      listNamespacedPod: vi.fn(),
      listNamespacedService: vi.fn(),
      listNode: vi.fn(),
    },
    appsApi: {
      listNamespacedDeployment: vi.fn(),
      listNamespacedDaemonSet: vi.fn(),
    },
    networkingApi: {
      listNamespacedIngress: vi.fn(),
    }
  }
})

// Mock the kubernetes client
vi.mock('@kubernetes/client-node', async (importOriginal) => {
  const actual = await importOriginal<typeof k8sClient>()
  
  return {
    ...actual,
    KubeConfig: class {
      loadFromDefault = vi.fn()
      makeApiClient = (cls: any) => {
        if (cls === actual.CoreV1Api) return mocks.coreApi
        if (cls === actual.AppsV1Api) return mocks.appsApi
        if (cls === actual.NetworkingV1Api) return mocks.networkingApi
        return {}
      }
    },
  }
})

// Import the module under test
import { getNamespaces, getPods, getDeployments, getNodes } from '../k8s'

describe('k8s library', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set default successful responses to avoid crashes
    mocks.coreApi.listNamespace.mockResolvedValue({ items: [] })
    mocks.coreApi.listNamespacedPod.mockResolvedValue({ items: [] })
    mocks.coreApi.listNamespacedService.mockResolvedValue({ items: [] })
    mocks.appsApi.listNamespacedDeployment.mockResolvedValue({ items: [] })
    mocks.networkingApi.listNamespacedIngress.mockResolvedValue({ items: [] })
  })

  describe('getNamespaces', () => {
    it('returns a list of namespace names', async () => {
      mocks.coreApi.listNamespace.mockResolvedValue({
        items: [
          { metadata: { name: 'default' } },
          { metadata: { name: 'kube-system' } },
        ],
      })

      const namespaces = await getNamespaces()
      expect(namespaces).toEqual(['default', 'kube-system'])
      expect(mocks.coreApi.listNamespace).toHaveBeenCalled()
    })
  })

  describe('getPods', () => {
    it('returns formatted pod data', async () => {
      mocks.coreApi.listNamespacedPod.mockResolvedValue({
        items: [
          {
            metadata: { name: 'pod-1' },
            status: { phase: 'Running' },
            spec: {
              containers: [
                {
                  name: 'container-1',
                  resources: {
                    requests: { cpu: '100m', memory: '128Mi' },
                    limits: { cpu: '200m', memory: '256Mi' },
                  },
                },
              ],
            },
          },
        ],
      })

      const pods = await getPods('default')
      expect(pods).toHaveLength(1)
      expect(pods[0]).toMatchObject({
        podName: 'pod-1',
        containerName: 'container-1',
        status: 'Running',
      })
      expect(mocks.coreApi.listNamespacedPod).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getDeployments', () => {
    it('returns formatted deployment data', async () => {
      mocks.appsApi.listNamespacedDeployment.mockResolvedValue({
        items: [
          {
            metadata: { name: 'deploy-1', creationTimestamp: new Date('2023-01-01') },
            spec: { replicas: 3 },
            status: {
              readyReplicas: 3,
              updatedReplicas: 3,
              availableReplicas: 3,
            },
          },
        ],
      })

      const deployments = await getDeployments('default')
      expect(deployments).toHaveLength(1)
      expect(deployments[0].name).toBe('deploy-1')
      expect(deployments[0].replicas).toBe(3)
      expect(mocks.appsApi.listNamespacedDeployment).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getNodes', () => {
    it('returns formatted node data', async () => {
      mocks.coreApi.listNode.mockResolvedValue({
        items: [
          {
            metadata: { name: 'node-1', creationTimestamp: '2023-01-01T00:00:00Z', labels: { 'node-role.kubernetes.io/control-plane': '' } },
            status: {
              conditions: [{ type: 'Ready', status: 'True' }],
              nodeInfo: { kubeletVersion: 'v1.29.0', architecture: 'amd64', operatingSystem: 'linux' },
              capacity: { cpu: '4', memory: '16Gi' }
            }
          }
        ]
      })

      const nodes = await getNodes()
      expect(nodes).toHaveLength(1)
      expect(nodes[0]).toEqual({
        name: 'node-1',
        status: 'Ready',
        role: 'control-plane',
        version: 'v1.29.0',
        cpuCapacity: '4',
        memoryCapacity: '16Gi',
        arch: 'amd64',
        os: 'linux',
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.coreApi.listNode).toHaveBeenCalled()
    })
  })
})
