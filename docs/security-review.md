# Security Review

## Executive Summary

This document outlines the findings from a security review of the st-k8s Next.js + Kubernetes application. The review focused on authentication, input validation, read-only enforcement, dependency auditing, and container security.

**Overall Status**: The application has a solid foundation for a read-only dashboard, with good container practices and safe MCP tool definitions. However, critical dependency vulnerabilities exist, and input validation in API routes could be strengthened.

## 1. Authentication & Authorization

### Findings
- **Cluster Access**: The application initializes the Kubernetes client using `KubeConfig.loadFromDefault()`. This means it inherits the context from the environment (`~/.kube/config` or `KUBECONFIG` env var).
- **RBAC**: The application does not implement its own RBAC. It relies entirely on the permissions of the underlying kubeconfig user or ServiceAccount.
- **Web UI Authentication**: There is currently NO authentication layer for the Web UI. Anyone with network access to the application can view the dashboard.

### Recommendations
- **Production Deployment (Guidelines)**: When deploying to a cluster, strictly bind the Pod's ServiceAccount to a Role with **read-only** permissions (e.g., `view` ClusterRole or a custom Role allowing only `get`, `list`, `watch` on specific resources).
- **Local Usage**: Acceptable for single-user local usage.
- **Future Improvement**: Implement an authentication provider (e.g., NextAuth.js) to restrict access to the dashboard if exposed beyond localhost.

## 2. Input Validation

### Findings
- **MCP Server**: The MCP server (`src/mcp-server.ts`) correctly uses **Zod** to validate tool arguments (specifically the `namespace` parameter).
  ```typescript
  const parsed = z.object({ namespace: z.string().optional() }).safeParse(args);
  ```
- **API Routes**: The API routes (e.g., `src/app/api/tools/k8s-deployments/route.ts`) perform manual validation/sanitization:
  ```typescript
  // Example found
  if (!namespace || !namespace.trim()) {
    namespace = "default";
  }
  ```
- **Risk**: While basic checks are in place, manual validation is prone to errors.

### Recommendations
- **Standardize on Zod**: Refactor all API routes to use Zod for validating query parameters, mirroring the MCP server approach. This ensures consistent validation logic across both interfaces.

## 3. Read-Only Enforcement

### Findings
- **Code Audit**: A review of `src/lib/k8s.ts` confirms that **only** read operations are exported:
  - `getNamespaces`
  - `getPods`
  - `getDeployments`
  - `getServices`
  - ...and so on.
- **API Design**: All inspected API routes use the `GET` method.
- **Conclusion**: The application code strictly adheres to the read-only requirement. No mutation logic (create, update, delete) was found in the codebase.

## 4. Dependency Auditing

### Findings
Running `npm audit` revealed significant vulnerabilities:
- **Critical Severity**: `next` (Remote Code Execution, Denial of Service).
- **High Severity**: `@modelcontextprotocol/sdk` (Data leak via shared server/transport).
- **Low Severity**: `qs` (Denial of Service).

### Action Items
- **Immediate Priority**: Upgrade `next` and `@modelcontextprotocol/sdk` to their patched versions.
- **Monitor**: Regularly run `npm audit` as part of the CI/CD pipeline.

## 5. Container Security

### Findings
- **Base Image**: Uses `node:20-alpine`, which is a minimal and generally secure base.
- **User Permissions**: The `Dockerfile` correctly creates and switches to a non-root user (`app`) for the runner stage.
  ```dockerfile
  RUN addgroup -S app && adduser -S app -G app
  USER app
  ```
- **Build Process**: Multi-stage build is used, ensuring only production artifacts are present in the final image.

### Recommendations
- **Secrets Management**: Ensure no secrets (like kubeconfig files) are baked into the image. They should be mounted as volumes or provided as environment variables at runtime.
