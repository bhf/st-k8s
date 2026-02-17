import {
  KubeConfig,
  CoreV1Api,
  AppsV1Api,
  BatchV1Api,
  NetworkingV1Api,
  V1Deployment,
  V1Service,
  V1DaemonSet,
  V1ReplicaSet,
  V1StatefulSet,
  V1Job,
  V1CronJob,
  V1Ingress,
  V1Endpoints,
  CoreV1Event,
  V1PersistentVolumeClaim,
  V1Pod,
  V1Node,
  V1ConfigMap,
  RbacAuthorizationV1Api,
  V1ServiceAccount,
  V1Role,
  V1RoleBinding,
  Log,
} from "@kubernetes/client-node";
import { Writable } from "node:stream";

// Refactor to lazy-load clients to avoid top-level side effects (like connecting to cluster)
// during build time import.
type K8sClients = {
  core: CoreV1Api;
  apps: AppsV1Api;
  batch: BatchV1Api;
  networking: NetworkingV1Api;
  rbac: RbacAuthorizationV1Api;
  config: KubeConfig;
};

const clientsCache = new Map<string, K8sClients>();

function getClients(context?: string): K8sClients {
  const cacheKey = context || 'default';
  if (clientsCache.has(cacheKey)) {
    return clientsCache.get(cacheKey)!;
  }

  const kc = new KubeConfig();
  kc.loadFromDefault();
  if (context && context !== 'default') {
    kc.setCurrentContext(context);
  }

  const clients: K8sClients = {
    core: kc.makeApiClient(CoreV1Api),
    apps: kc.makeApiClient(AppsV1Api),
    batch: kc.makeApiClient(BatchV1Api),
    networking: kc.makeApiClient(NetworkingV1Api),
    rbac: kc.makeApiClient(RbacAuthorizationV1Api),
    config: kc,
  };

  clientsCache.set(cacheKey, clients);
  return clients;
}

export function getContexts() {
  const kc = new KubeConfig();
  kc.loadFromDefault();
  const currentContext = kc.getCurrentContext();
  return kc.getContexts().map(ctx => ({
    name: ctx.name,
    cluster: ctx.cluster,
    user: ctx.user,
    isCurrent: ctx.name === currentContext
  }));
}

export async function getNamespaces(context?: string) {
  const { core } = getClients(context);
  const nsResp = await core.listNamespace();
  return (nsResp.items || []).map(ns => ns.metadata?.name || "");
}

export async function getPods(namespace: string, context?: string) {
  const { core } = getClients(context);
  const podsResp = await core.listNamespacedPod({ namespace });
  return podsResp.items.flatMap((pod: V1Pod) =>
    (pod.spec?.containers || []).map((container) => {
      const resources = container.resources || {};
      return {
        podName: pod.metadata?.name || "",
        containerName: container.name,
        cpuRequest: resources.requests?.cpu || "-",
        cpuLimit: resources.limits?.cpu || "-",
        memoryRequest: resources.requests?.memory || "-",
        memoryLimit: resources.limits?.memory || "-",
        status: pod.status?.phase
      };
    })
  );
}

export async function getDeployments(namespace: string, context?: string) {
  const { apps } = getClients(context);
  const resp = await apps.listNamespacedDeployment({ namespace });
  return resp.items.map((item: V1Deployment) => ({
    name: item.metadata?.name,
    replicas: item.spec?.replicas,
    readyReplicas: item.status?.readyReplicas || 0,
    updatedReplicas: item.status?.updatedReplicas || 0,
    availableReplicas: item.status?.availableReplicas || 0,
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getServices(namespace: string, context?: string) {
  const { core } = getClients(context);
  const resp = await core.listNamespacedService({ namespace });
  return resp.items.map((item: V1Service) => ({
    name: item.metadata?.name,
    type: item.spec?.type,
    clusterIP: item.spec?.clusterIP,
    ports: item.spec?.ports || [],
    selector: item.spec?.selector,
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getDaemonSets(namespace: string, context?: string) {
  const { apps } = getClients(context);
  const resp = await apps.listNamespacedDaemonSet({ namespace });
  return resp.items.map((item: V1DaemonSet) => ({
    name: item.metadata?.name,
    desired: item.status?.desiredNumberScheduled || 0,
    current: item.status?.currentNumberScheduled || 0,
    ready: item.status?.numberReady || 0,
    available: item.status?.numberAvailable || 0,
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getReplicaSets(namespace: string, context?: string) {
  const { apps } = getClients(context);
  const resp = await apps.listNamespacedReplicaSet({ namespace });
  return resp.items.map((item: V1ReplicaSet) => ({
    name: item.metadata?.name,
    replicas: item.spec?.replicas || 0,
    ready: item.status?.readyReplicas || 0,
    available: item.status?.availableReplicas || 0,
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getStatefulSets(namespace: string, context?: string) {
  const { apps } = getClients(context);
  const resp = await apps.listNamespacedStatefulSet({ namespace });
  return resp.items.map((item: V1StatefulSet) => ({
    name: item.metadata?.name,
    replicas: item.spec?.replicas || 0,
    ready: item.status?.readyReplicas || 0,
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getIngresses(namespace: string, context?: string) {
  const { networking } = getClients(context);
  const resp = await networking.listNamespacedIngress({ namespace });
  return resp.items.map((item: V1Ingress) => ({
    name: item.metadata?.name,
    class: item.spec?.ingressClassName,
    hosts: item.spec?.rules?.map((r) => r.host) || [],
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getEndpoints(namespace: string, context?: string) {
  const { core } = getClients(context);
  const resp = await core.listNamespacedEndpoints({ namespace });
  return resp.items.map((item: V1Endpoints) => ({
    name: item.metadata?.name,
    subsets: item.subsets || [],
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getEvents(namespace: string, context?: string) {
  const { core } = getClients(context);
  const resp = await core.listNamespacedEvent({ namespace });
  return resp.items.map((item: CoreV1Event) => ({
    name: item.metadata?.name,
    involvedObject: {
      kind: item.involvedObject?.kind,
      name: item.involvedObject?.name,
      namespace: item.involvedObject?.namespace,
    },
    message: item.message,
    reason: item.reason,
    source: item.source?.component,
    type: item.type,
    firstTimestamp: item.firstTimestamp,
    lastTimestamp: item.lastTimestamp,
    count: item.count,
  }));
}

export async function getPVCs(namespace: string, context?: string) {
  const { core } = getClients(context);
  const pvcResp = await core.listNamespacedPersistentVolumeClaim({ namespace });
  return pvcResp.items.map((pvc: V1PersistentVolumeClaim) => ({
    name: pvc.metadata?.name,
    status: pvc.status?.phase,
    volume: pvc.spec?.volumeName,
    capacity: pvc.status?.capacity?.storage,
    accessModes: pvc.spec?.accessModes?.join(", "),
    storageClass: pvc.spec?.storageClassName,
    created: pvc.metadata?.creationTimestamp,
  }));
}

export async function getNodes(context?: string) {
  const { core } = getClients(context);
  const resp = await core.listNode();
  return resp.items.map((node: V1Node) => {
    const readyCondition = node.status?.conditions?.find(c => c.type === 'Ready');
    const isReady = readyCondition?.status === 'True';

    const labels = node.metadata?.labels || {};
    const roles = Object.keys(labels)
      .filter(key => key.startsWith('node-role.kubernetes.io/'))
      .map(key => key.split('/')[1]);
    const role = roles.length > 0 ? roles.join(', ') : 'worker';

    return {
      name: node.metadata?.name,
      status: isReady ? 'Ready' : 'NotReady',
      role: role,
      version: node.status?.nodeInfo?.kubeletVersion,
      cpuCapacity: node.status?.capacity?.cpu,
      memoryCapacity: node.status?.capacity?.memory,
      arch: node.status?.nodeInfo?.architecture,
      os: node.status?.nodeInfo?.operatingSystem,
      created: node.metadata?.creationTimestamp,
    };
  });
}

export async function getConfigMaps(namespace: string, context?: string) {
  const { core } = getClients(context);
  const resp = await core.listNamespacedConfigMap({ namespace });
  return resp.items.map((item: V1ConfigMap) => ({
    name: item.metadata?.name,
    namespace: item.metadata?.namespace,
    dataCount: Object.keys(item.data || {}).length,
    data: item.data || {},
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getJobs(namespace: string, context?: string) {
  const { batch } = getClients(context);
  const resp = await batch.listNamespacedJob({ namespace });
  return resp.items.map((item: V1Job) => ({
    name: item.metadata?.name,
    completions: item.spec?.completions,
    parallelism: item.spec?.parallelism,
    active: item.status?.active || 0,
    succeeded: item.status?.succeeded || 0,
    failed: item.status?.failed || 0,
    startTime: item.status?.startTime,
    completionTime: item.status?.completionTime,
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getCronJobs(namespace: string, context?: string) {
  const { batch } = getClients(context);
  const resp = await batch.listNamespacedCronJob({ namespace });
  return resp.items.map((item: V1CronJob) => ({
    name: item.metadata?.name,
    schedule: item.spec?.schedule,
    suspend: item.spec?.suspend,
    active: item.status?.active?.length || 0,
    lastScheduleTime: item.status?.lastScheduleTime,
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getServiceAccounts(namespace: string, context?: string) {
  const { core } = getClients(context);
  const resp = await core.listNamespacedServiceAccount({ namespace });
  return resp.items.map((item: V1ServiceAccount) => ({
    name: item.metadata?.name,
    secrets: (item.secrets || []).map(s => s.name).join(', '),
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getRoles(namespace: string, context?: string) {
  const { rbac } = getClients(context);
  const resp = await rbac.listNamespacedRole({ namespace });
  return resp.items.map((item: V1Role) => ({
    name: item.metadata?.name,
    rules: item.rules?.length || 0,
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getRoleBindings(namespace: string, context?: string) {
  const { rbac } = getClients(context);
  const resp = await rbac.listNamespacedRoleBinding({ namespace });
  return resp.items.map((item: V1RoleBinding) => ({
    name: item.metadata?.name,
    role: item.roleRef.name,
    subjects: (item.subjects || []).map(s => `${s.kind}/${s.name}`).join(', '),
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getPodLogs(namespace: string, podName: string, containerName?: string, tailLines?: number, sinceSeconds?: number, context?: string) {
  const { core } = getClients(context);
  // Using the core API to get logs as a string
  const res = await core.readNamespacedPodLog({
    name: podName,
    namespace: namespace,
    container: containerName,
    tailLines: tailLines,
    sinceSeconds: sinceSeconds,
  });
  return res;
}

export async function getPodLogStream(namespace: string, podName: string, containerName: string, stream: Writable, tailLines?: number, sinceSeconds?: number, context?: string) {
  const { config } = getClients(context);
  const log = new Log(config);
  
  return log.log(namespace, podName, containerName, stream, { 
    follow: true, 
    tailLines: tailLines,
    sinceSeconds: sinceSeconds,
    pretty: false,
    timestamps: true
  });
}
