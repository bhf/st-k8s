# ST-K8s AI Coding Instructions

## Project Overview

A Next.js-based Kubernetes dashboard with three integration modes:
1. **Web UI** - K9s-inspired dashboard (`src/app/k8s-dashboard`) with keyboard navigation (`:pods`, `:svc`) and individual tool pages (`src/app/tools`)
2. **REST API** - OpenAPI endpoints for K8s resources (`src/app/api/tools`)
3. **MCP Server** - Model Context Protocol server exposing K8s tools to LLMs (`src/mcp-server.ts`)

**Key Tech Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui components, Kubernetes client-node, Copilot SDK, MCP SDK, Vitest.

## Architecture Patterns

### Triple Integration Model
All three modes share core logic:
- **`src/lib/k8s.ts`**: Core K8s client logic (lazy-loaded to avoid build-time connections). SHARED across all 3 modes.
- **`src/mcp-server.ts`**: Standalone MCP server using `@modelcontextprotocol/sdk` for stdio transport.
- **`src/lib/copilot-service.ts`**: Server-side chat tools using `@github/copilot-sdk`. Integrated via `api/chat`.
- **`src/app/api/tools/**/route.ts`**: REST API routes (all force-dynamic).

### Lazy-Load Pattern for K8s Client
`src/lib/k8s.ts` uses lazy initialization for `KubeConfig` and API clients.
**Critical Rule**: Never initialize K8s clients at the top level of a module. Always check for existing instance or create new one inside a function (e.g., `getClients()`). This prevents build failures in Next.js standalone mode.

### UI Data Flow
1. **Dashboard** (`app/k8s-dashboard`): Client components fetch data from API routes (`/api/tools/*`) → `lib/k8s.ts` → Cluster.
   - Uses `useEffect` and `fetch` directly.
   - Uses `@tanstack/react-table` for data display.
   - Uses `CommandPalette` for K9s-style keyboard navigation (global listener on `:`).
2. **Tools Pages** (`app/tools`): Simpler views for specific resources.
   - Uses `swr` for data fetching.

### Copilot Integration
- **Frontend**: `src/components/ChatComponent.tsx` (Client Component) sends messages to `/api/chat`.
- **Backend**: `/api/chat` route calls `src/lib/copilot-service.ts`.
- **Tools**: Defined in `copilot-service.ts` using `defineTool`, mirroring MCP capabilities.

## Development Workflows

### Running the Application
```bash
npm run dev       # Next.js dev server (port 3000)
npm run build     # Production build (standalone mode)
npm run start     # Production server
npm run mcp       # MCP server standalone (stdio)
```

### Testing
- **Framework**: Vitest
- **Location**: `__tests__` directories adjacent to source files (e.g., `src/lib/__tests__/k8s.test.ts`).
- **Command**: `npm test` (runs all tests), `npm test -- --watch`.
- **Coverage**: Unit tests for utils and component tests for dashboard.

### Docker Deployment
- **Output**: `next.config.ts` uses `output: "standalone"`.
- **Auth**: Requires `kubectl` context configured on host (volume mount kubeconfig if containerized).
- **Security**: Runs as non-root user.

## Component Conventions

### API Route Pattern
```typescript
export const dynamic = "force-dynamic"; // REQUIRED for K8s data
export async function GET(req: NextRequest) {
  try {
    const namespace = req.nextUrl.searchParams.get("namespace") || "default";
    const data = await getK8sResource(namespace); // Check lib/k8s.ts
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### Adding New K8s Resources
1. Add function to `src/lib/k8s.ts` (e.g., `getConfigMaps`).
2. Create API route: `src/app/api/tools/k8s-configmaps/route.ts`.
3. Add tool to `src/mcp-server.ts` schema handler.
4. Add tool to `src/lib/copilot-service.ts` (defineTool).
5. Add dashboard UI support if needed.

### MCP Tool Naming
- Prefix: `list_<resource>` (e.g., `list_namespaces`, `list_pods`).
- Arguments: `namespace` (optional, default "default").
- Validation: Use Zod schemas.

## Known Constraints
1. **Kubectl Context**: Must be present in environment (file or env vars). No in-cluster auth configured by default.
2. **Read-Only**: Current tools are read-only to prevent accidental mutations.
3. **Next.js Standalone**: Do not remove `output: "standalone"` config in `next.config.ts`.
