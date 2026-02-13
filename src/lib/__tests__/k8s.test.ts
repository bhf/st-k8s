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
      listNamespacedConfigMap: vi.fn(),
      listNamespacedEndpoints: vi.fn(),
      listNamespacedEvent: vi.fn(),
      listNamespacedPersistentVolumeClaim: vi.fn(),
      listNamespacedServiceAccount: vi.fn(),
    },
    appsApi: {
      listNamespacedDeployment: vi.fn(),
      listNamespacedDaemonSet: vi.fn(),
      listNamespacedReplicaSet: vi.fn(),
      listNamespacedStatefulSet: vi.fn(),
    },
    networkingApi: {
      listNamespacedIngress: vi.fn(),
    },
    batchApi: {
      listNamespacedCronJob: vi.fn(),
    },
    rbacApi: {
      listNamespacedRole: vi.fn(),
      listNamespacedRoleBinding: vi.fn(),
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
        if (cls === actual.BatchV1Api) return mocks.batchApi
        if (cls === actual.RbacAuthorizationV1Api) return mocks.rbacApi
        return {}
      }
    },
  }
})

// Import the module under test
import { 
  getNamespaces, getPods, getDeployments, getNodes, getConfigMaps,
  getServices, getDaemonSets, getReplicaSets, getStatefulSets, getIngresses,
  getEndpoints, getEvents, getPVCs, getCronJobs, getServiceAccounts,
  getRoles, getRoleBindings
} from '../k8s'

describe('k8s library', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set default successful responses to avoid crashes
    mocks.coreApi.listNamespace.mockResolvedValue({ items: [] })
    mocks.coreApi.listNamespacedPod.mockResolvedValue({ items: [] })
    mocks.coreApi.listNamespacedService.mockResolvedValue({ items: [] })
    mocks.coreApi.listNamespacedEndpoints.mockResolvedValue({ items: [] })
    mocks.coreApi.listNamespacedEvent.mockResolvedValue({ items: [] })
    mocks.coreApi.listNamespacedPersistentVolumeClaim.mockResolvedValue({ items: [] })
    mocks.coreApi.listNamespacedServiceAccount.mockResolvedValue({ items: [] })
    
    mocks.appsApi.listNamespacedDeployment.mockResolvedValue({ items: [] })
    mocks.appsApi.listNamespacedDaemonSet.mockResolvedValue({ items: [] })
    mocks.appsApi.listNamespacedReplicaSet.mockResolvedValue({ items: [] })
    mocks.appsApi.listNamespacedStatefulSet.mockResolvedValue({ items: [] })
    
    mocks.networkingApi.listNamespacedIngress.mockResolvedValue({ items: [] })
    mocks.batchApi.listNamespacedCronJob.mockResolvedValue({ items: [] })
    
    mocks.rbacApi.listNamespacedRole.mockResolvedValue({ items: [] })
    mocks.rbacApi.listNamespacedRoleBinding.mockResolvedValue({ items: [] })
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

  describe('getConfigMaps', () => {
    it('returns formatted configmaps data', async () => {
      mocks.coreApi.listNamespacedConfigMap.mockResolvedValue({
        items: [
          {
            metadata: { name: 'cm-1', namespace: 'default', creationTimestamp: '2023-01-01T00:00:00Z' },
            data: { key1: 'value1', key2: 'value2' }
          }
        ]
      })

      const cms = await getConfigMaps('default')
      expect(cms).toHaveLength(1)
      expect(cms[0]).toEqual({
        name: 'cm-1',
        namespace: 'default',
        dataCount: 2,
        data: { key1: 'value1', key2: 'value2' },
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.coreApi.listNamespacedConfigMap).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getServices', () => {
    it('returns formatted service data', async () => {
      mocks.coreApi.listNamespacedService.mockResolvedValue({
        items: [
          {
            metadata: { name: 'svc-1', creationTimestamp: '2023-01-01T00:00:00Z' },
            spec: { type: 'ClusterIP', clusterIP: '10.0.0.1', ports: [{ port: 80 }], selector: { app: 'web' } }
          }
        ]
      })
      const results = await getServices('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'svc-1',
        type: 'ClusterIP',
        clusterIP: '10.0.0.1',
        ports: [{ port: 80 }],
        selector: { app: 'web' },
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.coreApi.listNamespacedService).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getDaemonSets', () => {
    it('returns formatted daemonset data', async () => {
      mocks.appsApi.listNamespacedDaemonSet.mockResolvedValue({
        items: [
          {
            metadata: { name: 'ds-1', creationTimestamp: '2023-01-01T00:00:00Z' },
            status: { desiredNumberScheduled: 3, currentNumberScheduled: 3, numberReady: 3, numberAvailable: 3 }
          }
        ]
      })
      const results = await getDaemonSets('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'ds-1',
        desired: 3,
        current: 3,
        ready: 3,
        available: 3,
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.appsApi.listNamespacedDaemonSet).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getReplicaSets', () => {
    it('returns formatted replicaset data', async () => {
      mocks.appsApi.listNamespacedReplicaSet.mockResolvedValue({
        items: [
          {
            metadata: { name: 'rs-1', creationTimestamp: '2023-01-01T00:00:00Z' },
            spec: { replicas: 3 },
            status: { readyReplicas: 3, availableReplicas: 3 }
          }
        ]
      })
      const results = await getReplicaSets('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'rs-1',
        replicas: 3,
        ready: 3,
        available: 3,
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.appsApi.listNamespacedReplicaSet).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getStatefulSets', () => {
    it('returns formatted statefulset data', async () => {
      mocks.appsApi.listNamespacedStatefulSet.mockResolvedValue({
        items: [
          {
            metadata: { name: 'sts-1', creationTimestamp: '2023-01-01T00:00:00Z' },
            spec: { replicas: 2 },
            status: { readyReplicas: 2 }
          }
        ]
      })
      const results = await getStatefulSets('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'sts-1',
        replicas: 2,
        ready: 2,
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.appsApi.listNamespacedStatefulSet).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getIngresses', () => {
    it('returns formatted ingress data', async () => {
      mocks.networkingApi.listNamespacedIngress.mockResolvedValue({
        items: [
          {
            metadata: { name: 'ing-1', creationTimestamp: '2023-01-01T00:00:00Z' },
            spec: { ingressClassName: 'nginx', rules: [{ host: 'example.com' }] }
          }
        ]
      })
      const results = await getIngresses('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'ing-1',
        class: 'nginx',
        hosts: ['example.com'],
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.networkingApi.listNamespacedIngress).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getEndpoints', () => {
    it('returns formatted endpoint data', async () => {
      mocks.coreApi.listNamespacedEndpoints.mockResolvedValue({
        items: [
          {
            metadata: { name: 'ep-1', creationTimestamp: '2023-01-01T00:00:00Z' },
            subsets: [{ addresses: [{ ip: '1.2.3.4' }], ports: [{ port: 80 }] }]
          }
        ]
      })
      const results = await getEndpoints('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'ep-1',
        subsets: [{ addresses: [{ ip: '1.2.3.4' }], ports: [{ port: 80 }] }],
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.coreApi.listNamespacedEndpoints).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getEvents', () => {
    it('returns formatted event data', async () => {
      mocks.coreApi.listNamespacedEvent.mockResolvedValue({
        items: [
          {
            metadata: { name: 'evt-1' },
            involvedObject: { kind: 'Pod', name: 'pod-1', namespace: 'default' },
            message: 'Started container',
            reason: 'Started',
            source: { component: 'kubelet' },
            type: 'Normal',
            firstTimestamp: new Date('2023-01-01T00:00:00Z'),
            lastTimestamp: new Date('2023-01-01T00:01:00Z'),
            count: 1
          }
        ]
      })
      const results = await getEvents('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'evt-1',
        involvedObject: { kind: 'Pod', name: 'pod-1', namespace: 'default' },
        message: 'Started container',
        reason: 'Started',
        source: 'kubelet',
        type: 'Normal',
        firstTimestamp: new Date('2023-01-01T00:00:00Z'),
        lastTimestamp: new Date('2023-01-01T00:01:00Z'),
        count: 1
      })
      expect(mocks.coreApi.listNamespacedEvent).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getPVCs', () => {
    it('returns formatted pvc data', async () => {
      mocks.coreApi.listNamespacedPersistentVolumeClaim.mockResolvedValue({
        items: [
          {
            metadata: { name: 'pvc-1', creationTimestamp: '2023-01-01T00:00:00Z' },
            status: { phase: 'Bound', capacity: { storage: '10Gi' } },
            spec: { volumeName: 'pv-1', accessModes: ['ReadWriteOnce'], storageClassName: 'standard' }
          }
        ]
      })
      const results = await getPVCs('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'pvc-1',
        status: 'Bound',
        volume: 'pv-1',
        capacity: '10Gi',
        accessModes: 'ReadWriteOnce',
        storageClass: 'standard',
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.coreApi.listNamespacedPersistentVolumeClaim).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getCronJobs', () => {
    it('returns formatted cronjob data', async () => {
      mocks.batchApi.listNamespacedCronJob.mockResolvedValue({
        items: [
          {
            metadata: { name: 'cj-1', creationTimestamp: '2023-01-01T00:00:00Z' },
            spec: { schedule: '*/1 * * * *', suspend: false },
            status: { active: [], lastScheduleTime: new Date('2023-01-01T00:00:00Z') }
          }
        ]
      })
      const results = await getCronJobs('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'cj-1',
        schedule: '*/1 * * * *',
        suspend: false,
        active: 0,
        lastScheduleTime: new Date('2023-01-01T00:00:00Z'),
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.batchApi.listNamespacedCronJob).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getServiceAccounts', () => {
    it('returns formatted service account data', async () => {
      mocks.coreApi.listNamespacedServiceAccount.mockResolvedValue({
        items: [
          {
            metadata: { name: 'sa-1', creationTimestamp: '2023-01-01T00:00:00Z' },
            secrets: [{ name: 'sa-1-token-abcde' }]
          }
        ]
      })
      const results = await getServiceAccounts('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'sa-1',
        secrets: 'sa-1-token-abcde',
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.coreApi.listNamespacedServiceAccount).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getRoles', () => {
    it('returns formatted role data', async () => {
      mocks.rbacApi.listNamespacedRole.mockResolvedValue({
        items: [
          {
            metadata: { name: 'role-1', creationTimestamp: '2023-01-01T00:00:00Z' },
            rules: [{ apiGroups: [''], resources: ['pods'], verbs: ['get'] }]
          }
        ]
      })
      const results = await getRoles('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'role-1',
        rules: 1,
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.rbacApi.listNamespacedRole).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })

  describe('getRoleBindings', () => {
    it('returns formatted rolebinding data', async () => {
      mocks.rbacApi.listNamespacedRoleBinding.mockResolvedValue({
        items: [
          {
            metadata: { name: 'rb-1', creationTimestamp: '2023-01-01T00:00:00Z' },
            roleRef: { name: 'role-1' },
            subjects: [{ kind: 'User', name: 'admin' }]
          }
        ]
      })
      const results = await getRoleBindings('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'rb-1',
        role: 'role-1',
        subjects: 'User/admin',
        created: '2023-01-01T00:00:00Z'
      })
      expect(mocks.rbacApi.listNamespacedRoleBinding).toHaveBeenCalledWith({ namespace: 'default' })
    })
  })
})
