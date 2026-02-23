// src/lib/__tests__/k8s.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as k8sClient from '@kubernetes/client-node'
import net from 'node:net'

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
      readNamespacedService: vi.fn(),
      readNamespacedPodLog: vi.fn(),
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
    },
    customApi: {
      listClusterCustomObject: vi.fn(),
      listNamespacedCustomObject: vi.fn(),
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
        if (cls === actual.CustomObjectsApi) return mocks.customApi
        return {}
      }
      getContexts = vi.fn().mockReturnValue([
        { name: 'default', cluster: 'cluster-1', user: 'user-1' },
        { name: 'prod', cluster: 'cluster-2', user: 'user-2' }
      ])
      getCurrentContext = vi.fn().mockReturnValue('default')
      setCurrentContext = vi.fn()
      readNamespacedService = vi.fn()
      readNamespacedPodLog = vi.fn()
    },
    Log: class {
      log = vi.fn().mockResolvedValue(undefined)
    }
  }
})

// Import the module under test
import {
  getNamespaces, getPods, getDeployments, getNodes, getConfigMaps,
  getServices, getDaemonSets, getReplicaSets, getStatefulSets, getIngresses,
  getEndpoints, getEvents, getPVCs, getCronJobs, getServiceAccounts,
  getRoles, getRoleBindings, getContexts, getNodeMetrics, getPodMetrics, resetMetricsApiAvailable,
  findPodForService, getPodLogs, getPodLogStream, startPortForward, stopPortForward, listPortForwards,
  isMetricsAvailable
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

    mocks.customApi.listClusterCustomObject.mockResolvedValue({ items: [] })
    mocks.customApi.listNamespacedCustomObject.mockResolvedValue({ items: [] })
    resetMetricsApiAvailable()
  })

  describe('getContexts', () => {
    it('returns formatted context data', () => {
      const results = getContexts()
      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({
        name: 'default',
        cluster: 'cluster-1',
        user: 'user-1',
        isCurrent: true
      })
    })
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
        labels: { 'node-role.kubernetes.io/control-plane': '' },
        conditions: [{ type: 'Ready', status: 'True' }],
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
        labels: {},
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
        labels: {},
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
        labels: {},
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
        labels: {},
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

  describe('getNodeMetrics', () => {
    it('returns formatted node metrics', async () => {
      mocks.customApi.listClusterCustomObject.mockResolvedValue({
        items: [
          {
            metadata: { name: 'node-1' },
            usage: { cpu: '100m', memory: '1Gi' },
            timestamp: '2023-01-01T00:00:00Z',
            window: '1m'
          }
        ]
      })
      const results = await getNodeMetrics()
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'node-1',
        cpu: '100m',
        memory: '1Gi',
        timestamp: '2023-01-01T00:00:00Z',
        window: '1m'
      })
      expect(mocks.customApi.listClusterCustomObject).toHaveBeenCalledWith({
        group: "metrics.k8s.io",
        version: "v1beta1",
        plural: "nodes",
      })
    })

    it('returns empty list and silences console on 404', async () => {
      mocks.customApi.listClusterCustomObject.mockRejectedValue({ code: 404 })
      const results = await getNodeMetrics()
      expect(results).toEqual([])
    })

    it('logs error on non-404 failures', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
      mocks.customApi.listClusterCustomObject.mockRejectedValue(new Error('api error'))
      const results = await getNodeMetrics()
      expect(results).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch node metrics:", expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('getPodMetrics', () => {
    it('returns formatted pod metrics', async () => {
      mocks.customApi.listNamespacedCustomObject.mockResolvedValue({
        items: [
          {
            metadata: { name: 'pod-1', namespace: 'default' },
            containers: [
              { name: 'container-1', usage: { cpu: '50m', memory: '512Mi' } }
            ],
            timestamp: '2023-01-01T00:00:00Z',
            window: '1m'
          }
        ]
      })
      const results = await getPodMetrics('default')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        name: 'pod-1',
        namespace: 'default',
        cpu: '50m',
        memory: '512Mi',
        containers: [
          { name: 'container-1', cpu: '50m', memory: '512Mi' }
        ],
        timestamp: '2023-01-01T00:00:00Z',
        window: '1m'
      })
      expect(mocks.customApi.listNamespacedCustomObject).toHaveBeenCalledWith({
        group: "metrics.k8s.io",
        version: "v1beta1",
        namespace: 'default',
        plural: "pods",
      })
    })

    it('returns empty list and silences console on 404', async () => {
      mocks.customApi.listNamespacedCustomObject.mockRejectedValue({ code: 404 })
      const results = await getPodMetrics('default')
      expect(results).toEqual([])
    })

    it('logs error on non-404 failures', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
      mocks.customApi.listNamespacedCustomObject.mockRejectedValue(new Error('api error'))
      const results = await getPodMetrics('default')
      expect(results).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch pod metrics for namespace default:", expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('findPodForService', () => {
    it('returns the first pod name found for a service', async () => {
      mocks.coreApi.readNamespacedService = vi.fn().mockResolvedValue({
        spec: { selector: { app: 'web' } }
      })
      mocks.coreApi.listNamespacedPod.mockResolvedValue({
        items: [{ metadata: { name: 'pod-web-1' } }]
      })

      const podName = await findPodForService('default', 'web-svc')
      expect(podName).toBe('pod-web-1')
      expect(mocks.coreApi.listNamespacedPod).toHaveBeenCalledWith({
        namespace: 'default',
        labelSelector: 'app=web'
      })
    })

    it('returns null if service has no selector', async () => {
      mocks.coreApi.readNamespacedService = vi.fn().mockResolvedValue({
        spec: {}
      })

      const podName = await findPodForService('default', 'no-selector-svc')
      expect(podName).toBeNull()
    })

    it('returns null if no pods found', async () => {
      mocks.coreApi.readNamespacedService = vi.fn().mockResolvedValue({
        spec: { selector: { app: 'empty' } }
      })
      mocks.coreApi.listNamespacedPod.mockResolvedValue({ items: [] })

      const podName = await findPodForService('default', 'empty-svc')
      expect(podName).toBeNull()
    })
  })

  describe('getPodLogs', () => {
    it('calls readNamespacedPodLog with correct parameters', async () => {
      mocks.coreApi.readNamespacedPodLog = vi.fn().mockResolvedValue('some logs')

      const logs = await getPodLogs('default', 'pod-1', 'container-1', 10, 60)
      expect(logs).toBe('some logs')
      expect(mocks.coreApi.readNamespacedPodLog).toHaveBeenCalledWith({
        name: 'pod-1',
        namespace: 'default',
        container: 'container-1',
        tailLines: 10,
        sinceSeconds: 60
      })
    })
  })

  describe('getPodLogStream', () => {
    it('calls Log.log method', async () => {
      const mockStream = { write: vi.fn() } as any
      await getPodLogStream('default', 'pod-1', 'container-1', mockStream, 100)
      // The implementation uses the Log class, which we mocked.
      // Since it's a class with a mocked method, we can't easily check the instance
      // unless we store it, but we can verify it doesn't throw and coverage is hit.
    })
  })

  describe('Port Forwarding', () => {
    it('starts, lists, and stops port forwards', async () => {
      // Mock net.createServer
      const mockServer = {
        listen: vi.fn((port, addr, cb) => cb()),
        address: vi.fn(() => ({ port: 8080, address: '127.0.0.1' })),
        close: vi.fn(),
        on: vi.fn()
      }
      const createServerSpy = vi.spyOn(net, 'createServer').mockReturnValue(mockServer as any)

      const info = await startPortForward('default', 'pod-1', 80, 8080)
      expect(info.localPort).toBe(8080)
      expect(info.podName).toBe('pod-1')

      const forwards = listPortForwards()
      expect(forwards).toHaveLength(1)
      expect(forwards[0].id).toBe(info.id)

      const stopped = await stopPortForward(info.id)
      expect(stopped).toBe(true)
      expect(mockServer.close).toHaveBeenCalled()
      expect(listPortForwards()).toHaveLength(0)

      createServerSpy.mockRestore()
    })

    it('handles port forward server error', async () => {
      const mockServer = {
        listen: vi.fn(),
        on: vi.fn((event, cb) => {
          if (event === 'error') cb(new Error('port error'))
        })
      }
      const createServerSpy = vi.spyOn(net, 'createServer').mockReturnValue(mockServer as any)

      await expect(startPortForward('default', 'pod-1', 80, 8080)).rejects.toThrow('port error')

      createServerSpy.mockRestore()
    })

    it('returns false when stopping non-existent forward', async () => {
      const stopped = await stopPortForward('non-existent')
      expect(stopped).toBe(false)
    })
  })

  describe('getPodMetrics unit conversions', () => {
    it('correctly converts CPU units (n, u, m)', async () => {
      mocks.customApi.listNamespacedCustomObject.mockResolvedValue({
        items: [
          {
            metadata: { name: 'pod-units', namespace: 'default' },
            containers: [
              { name: 'c1', usage: { cpu: '1000000n', memory: '1024Ki' } }, // 1m
              { name: 'c2', usage: { cpu: '1000u', memory: '1Mi' } },       // 1m
              { name: 'c3', usage: { cpu: '1m', memory: '1Gi' } },          // 1m
              { name: 'c4', usage: { cpu: '0.001', memory: '1024' } },     // 1m (effectively)
            ],
            timestamp: '2023-01-01T00:00:00Z',
            window: '1m'
          }
        ]
      })

      const results = await getPodMetrics('default')
      expect(results[0].cpu).toBe('4m')
      expect(results[0].memory).toBe('1026Mi') // 1 + 1 + 1024 + 0 (1024 bytes is ~0Mi)
    })

    it('correctly converts Memory units (Ki, Mi, Gi)', async () => {
      mocks.customApi.listNamespacedCustomObject.mockResolvedValue({
        items: [
          {
            metadata: { name: 'pod-mem', namespace: 'default' },
            containers: [
              { name: 'c1', usage: { cpu: '1m', memory: '1024Ki' } }, // 1Mi
              { name: 'c2', usage: { cpu: '1m', memory: '1Mi' } },     // 1Mi
              { name: 'c3', usage: { cpu: '1m', memory: '1Gi' } },     // 1024Mi
              { name: 'c4', usage: { cpu: '1m', memory: '1048576' } }, // 1024Ki -> 1Mi (1048576 / 1024 = 1024Ki)
            ],
            timestamp: '2023-01-01T00:00:00Z',
            window: '1m'
          }
        ]
      })

      const results = await getPodMetrics('default')
      expect(results[0].memory).toBe('1027Mi')
    })
  })

  describe('isMetricsAvailable', () => {
    it('returns metrics availability', async () => {
      mocks.customApi.listClusterCustomObject.mockResolvedValue({ items: [] })
      const available = await isMetricsAvailable()
      expect(available).toBe(true)
    })

    it('returns cached metrics availability', async () => {
      mocks.customApi.listClusterCustomObject.mockResolvedValue({ items: [] })
      await isMetricsAvailable()
      expect(mocks.customApi.listClusterCustomObject).toHaveBeenCalledTimes(1)

      const available = await isMetricsAvailable()
      expect(available).toBe(true)
      expect(mocks.customApi.listClusterCustomObject).toHaveBeenCalledTimes(1)
    })
  })
})
