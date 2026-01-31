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
  V1Pod
} from "@kubernetes/client-node";

// Singleton instance for the long-running MCP server,
// or re-instantiated for stateless API routes.
const kc = new KubeConfig();
kc.loadFromDefault();

const k8sCoreApi = kc.makeApiClient(CoreV1Api);
const k8sAppsApi = kc.makeApiClient(AppsV1Api);
const k8sNetworkingApi = kc.makeApiClient(NetworkingV1Api);

export async function getNamespaces() {
  const nsResp = await k8sCoreApi.listNamespace();
  return (nsResp.items || []).map(ns => ns.metadata?.name || "");
}

export async function getPods(namespace: string) {
  const podsResp = await k8sCoreApi.listNamespacedPod({ namespace });
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
  // @ts-ignore: Client library type mismatch in older versions or specific call signatures
  const resp = await k8sAppsApi.listNamespacedDeployment({ namespace });
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
  // @ts-ignore
  const resp = await k8sCoreApi.listNamespacedService({ namespace });
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
  // @ts-ignore
  const resp = await k8sAppsApi.listNamespacedDaemonSet({ namespace });
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
  // @ts-ignore
  const resp = await k8sAppsApi.listNamespacedReplicaSet({ namespace });
  return resp.items.map((item: V1ReplicaSet) => ({
    name: item.metadata?.name,
    replicas: item.spec?.replicas || 0,
    ready: item.status?.readyReplicas || 0,
    available: item.status?.availableReplicas || 0,
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getStatefulSets(namespace: string) {
  // @ts-ignore
  const resp = await k8sAppsApi.listNamespacedStatefulSet({ namespace });
  return resp.items.map((item: V1StatefulSet) => ({
    name: item.metadata?.name,
    replicas: item.spec?.replicas || 0,
    ready: item.status?.readyReplicas || 0,
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getIngresses(namespace: string) {
  // @ts-ignore
  const resp = await k8sNetworkingApi.listNamespacedIngress({ namespace });
  return resp.items.map((item: V1Ingress) => ({
    name: item.metadata?.name,
    class: item.spec?.ingressClassName,
    hosts: item.spec?.rules?.map((r) => r.host) || [],
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getEndpoints(namespace: string) {
  // @ts-ignore
  const resp = await k8sCoreApi.listNamespacedEndpoints({ namespace });
  return resp.items.map((item: V1Endpoints) => ({
    name: item.metadata?.name,
    subsets: item.subsets || [],
    created: item.metadata?.creationTimestamp,
  }));
}

export async function getEvents(namespace: string) {
  // @ts-ignore
  const resp = await k8sCoreApi.listNamespacedEvent({ namespace });
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
  // @ts-ignore
  const pvcResp = await k8sCoreApi.listNamespacedPersistentVolumeClaim({ namespace });
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
