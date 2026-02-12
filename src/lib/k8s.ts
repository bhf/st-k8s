import {
  KubeConfig,
  CoreV1Api,
  AppsV1Api,
  NetworkingV1Api,
  V1Deployment,
  V1Service,
  V1DaemonSet,
  V1ReplicaSet,
  V1StatefulSet,
  V1Ingress,
  V1Endpoints,
  CoreV1Event,
  V1PersistentVolumeClaim,
  V1Pod,
  V1Node
} from "@kubernetes/client-node";

// Refactor to lazy-load clients to avoid top-level side effects (like connecting to cluster)
// during build time import.
let k8sCoreApi: CoreV1Api | undefined;
let k8sAppsApi: AppsV1Api | undefined;
let k8sNetworkingApi: NetworkingV1Api | undefined;

function getClients() {
  if (!k8sCoreApi) {
    const kc = new KubeConfig();
    kc.loadFromDefault();
    k8sCoreApi = kc.makeApiClient(CoreV1Api);
    k8sAppsApi = kc.makeApiClient(AppsV1Api);
    k8sNetworkingApi = kc.makeApiClient(NetworkingV1Api);
  }
  return {
    core: k8sCoreApi!,
    apps: k8sAppsApi!,
    networking: k8sNetworkingApi!,
  };
}

export async function getNamespaces() {
  const { core } = getClients();
  const nsResp = await core.listNamespace();
  return (nsResp.items || []).map(ns => ns.metadata?.name || "");
}

export async function getPods(namespace: string) {
  const { core } = getClients();
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

export async function getDeployments(namespace: string) {
  const { apps } = getClients();
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

export async function getServices(namespace: string) {
  const { core } = getClients();
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

export async function getDaemonSets(namespace: string) {
  const { apps } = getClients();
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

export async function getReplicaSets(namespace: string) {
  const { apps } = getClients();
  const resp = await apps.listNamespacedReplicaSet({ namespace });
  return resp.items.map((item: V1ReplicaSet) => ({
    name: item.metadata?.name,
    replicas: item.spec?.replicas || 0,
    ready: item.status?.readyReplicas || 0,
    available: item.status?.availableReplicas || 0,
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getStatefulSets(namespace: string) {
  const { apps } = getClients();
  const resp = await apps.listNamespacedStatefulSet({ namespace });
  return resp.items.map((item: V1StatefulSet) => ({
    name: item.metadata?.name,
    replicas: item.spec?.replicas || 0,
    ready: item.status?.readyReplicas || 0,
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getIngresses(namespace: string) {
  const { networking } = getClients();
  const resp = await networking.listNamespacedIngress({ namespace });
  return resp.items.map((item: V1Ingress) => ({
    name: item.metadata?.name,
    class: item.spec?.ingressClassName,
    hosts: item.spec?.rules?.map((r) => r.host) || [],
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getEndpoints(namespace: string) {
  const { core } = getClients();
  const resp = await core.listNamespacedEndpoints({ namespace });
  return resp.items.map((item: V1Endpoints) => ({
    name: item.metadata?.name,
    subsets: item.subsets || [],
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getEvents(namespace: string) {
  const { core } = getClients();
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

export async function getPVCs(namespace: string) {
  const { core } = getClients();
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

export async function getNodes() {
  const { core } = getClients();
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
