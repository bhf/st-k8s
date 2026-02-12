# ST-K8s AI Coding Instructions

## Project Overview

A Next.js-based Kubernetes dashboard with three integration modes:
1. **Web UI** - K9s-inspired dashboard with dark theme
2. **REST API** - OpenAPI endpoints for K8s resources
3. **MCP Server** - Model Context Protocol server exposing K8s tools to LLMs

**Key Tech Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Kubernetes client-node, Copilot SDK, shadcn/ui components

## Architecture Patterns

### Triple Integration Model
- **`src/lib/k8s.ts`**: Core K8s client logic (lazy-loaded to avoid build-time connections)
- **`src/mcp-server.ts`**: Standalone MCP server using `@modelcontextprotocol/sdk` for stdio transport
- **`src/lib/copilot-service.ts`**: In-browser chat tools using `@github/copilot-sdk`
- **`src/app/api/tools/**/route.ts`**: REST API routes (all force-dynamic)

All three consume the same K8s functions from `lib/k8s.ts` - maintain DRY principle when adding new resources.

### Lazy-Load Pattern for K8s Client
```typescript
// lib/k8s.ts uses lazy initialization to prevent build-time cluster connections
let k8sCoreApi: CoreV1Api | undefined;
function getClients() {
  if (!k8sCoreApi) {
    const kc = new KubeConfig();
    kc.loadFromDefault();
    // ... initialize clients
  }
  return { core, apps, networking };
}
```
**Why**: Next.js standalone build reads all imports. Direct top-level K8s client init causes build failures.

### UI Data Flow
Dashboard pages (`app/k8s-dashboard/*`) → API routes (`app/api/tools/*`) → `lib/k8s.ts` → Kubernetes cluster

All API routes use `export const dynamic = "force-dynamic"` to bypass static rendering.

## Development Workflows

### Running the Application
```bash
npm run dev       # Next.js dev server (port 3000)
npm run build     # Production build (standalone mode)
npm run start     # Production server
npm run mcp       # MCP server standalone (stdio)
```

### Docker Deployment
```bash
docker-compose up --build  # Uses multi-stage Dockerfile
```
- Dockerfile builds standalone Next.js output
- Copies `.next/standalone`, `.next/static`, `public/` to runner stage
- Runs as non-root user on port 3000
- Requires kubectl context configured on host (volume mount kubeconfig if containerized)

### Adding New K8s Resources
1. Add function to `src/lib/k8s.ts` (e.g., `getConfigMaps`)
2. Create API route: `src/app/api/tools/k8s-configmaps/route.ts`
3. Add tool to `src/mcp-server.ts` CallToolRequestSchema handler
4. Add tool to `src/lib/copilot-service.ts` (defineTool + add to agent tools array)
5. Create dashboard page: `src/app/k8s-dashboard/page.tsx` and tool entry
6. Update `ToolType` in `Sidebar.tsx`

## Component Conventions

### shadcn/ui Configuration
- Style: `new-york`
- Base color: `neutral`
- Components in `src/components/ui/`
- Aliases: `@/components`, `@/lib`, `@/hooks`
- Lucide icons only

### Client Components
- Mark with `"use client"` directive
- `ChatComponent` uses controlled/uncontrolled pattern (check `isOpen` prop)
- `DashboardContent` uses TanStack Table for grid/table toggle
- SWR not heavily used - prefer direct fetch in useEffect

### API Route Pattern
```typescript
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const data = await getK8sResource(namespace);
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### CSV Export
`DashboardContent.tsx` has CSV download logic - reuse pattern for new resource types:
1. Extract all keys except `metadata`
2. Sort columns (name fields first)
3. Escape CSV values properly

## MCP Server Specifics

### Configuration for Clients
**VSCode** (`mcp.json`):
```json
{
  "servers": {
    "k8s-tools": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/absolute/path/to/st-k8s"
    }
  }
}
```

**Claude Desktop**: Similar stdio configuration

### Tool Naming Convention
- Tool names: `list_<resource>` (e.g., `list_namespaces`, `list_pods`)
- All tools accept optional `namespace` parameter (default: "default")
- Use Zod for parameter validation

## Critical Dependencies

- `@kubernetes/client-node@^1.4.0`: All K8s API calls
- `@github/copilot-sdk@^0.1.21`: Browser chat integration (technical preview)
- `@modelcontextprotocol/sdk@^1.25.3`: MCP server implementation
- `next@16.0.3`: App Router with standalone output mode
- `tailwindcss@^4`: v4 syntax (no `tailwind.config.js` - uses `@tailwindcss/postcss`)

## Known Constraints

1. **Kubectl Context Required**: All modes expect valid `~/.kube/config` - no in-cluster auth
2. **Read-Only Operations**: No mutations exposed (by design for safety)
3. **Namespace Scoping**: Most tools require explicit namespace (except `list_namespaces`)
4. **Build Mode**: `next.config.ts` uses `output: "standalone"` for Docker - don't change without updating Dockerfile
5. **Copilot SDK**: Technical preview - API may change

## Testing Strategy

No test files present. Manual testing via:
- Dashboard UI: Navigate to `http://localhost:3000/k8s-dashboard`
- API: Check `http://localhost:3000/openapi.json` and test endpoints
- MCP: Use VSCode with MCP extension or `npx @modelcontextprotocol/inspector npm run mcp`
