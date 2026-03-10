# ST-K8s AI Coding Instructions

## Project Overview
A Next.js 16 Kubernetes dashboard featuring a triple integration model:
1. **Web UI**: K9s-inspired dashboard with keyboard navigation (`src/app/k8s-dashboard`) and resource-specific pages (`src/app/tools`).
2. **REST API**: OpenAPI-ready endpoints for K8s resources (`src/app/api/tools`).
3. **MCP Server**: Model Context Protocol server exposing K8s operations as tools (`src/mcp-server.ts`).

**Tech Stack**: Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript, shadcn/ui (Radix), Kubernetes client-node, MCP SDK, Copilot SDK, Vitest.

## Key Architectural Patterns

### Triple Integration Model
Logic is shared across all three modes to ensure consistency:
- **`src/lib/k8s.ts`**: Core K8s client logic. **CRITICAL**: Use the lazy-load pattern via `getClients(context?)` inside functions. Never initialize K8s clients at the module top-level to avoid build failures.
- **`src/lib/k8s-tools.ts`**: (If present) Shared tool definitions/schemas.

### UI & Navigation
- **K9s Dashboard**: Located in `src/app/k8s-dashboard`. Uses `CommandPalette.tsx` for global keyboard navigation (triggered by `:`).
- **Data Fetching**: 
  - Dashboard components typically fetch from `/api/tools/*` using `useEffect` or SWR.
  - Resource tables use `@tanstack/react-table`.

### Tooling Strategy
- **MCP Tools**: Prefixed with `list_`, `get_`, `start_`, or `stop_` (e.g., `list_pods`, `get_pod_logs`). Define schemas using Zod in `mcp-server.ts` or `k8s-tools.ts`.
- **API Routes**: Must be `force-dynamic`.
  ```typescript
  export const dynamic = "force-dynamic";
  export async function GET(req: NextRequest) { ... }
  ```

## Critical Workflows & Commands
- **Dev**: `npm run dev` (Web UI/API)
- **MCP**: `npm run mcp` (Standalone MCP server via stdio)
- **Test**: `npm test` (Vitest), `npm run test:e2e` (Playwright)
- **Build**: `npm run build` (Generates standalone production build)

## Conventions
- **Component Location**: UI components in `src/components/ui`, feature components in `src/app/k8s-dashboard` or `src/components`.
- **Tests**: Place `__tests__` folders adjacent to the code being tested.
- **Styling**: Tailwind v4 using `@theme` and CSS variables. Use the `cn()` utility for class merging.
- **K8s Safety**: Ensure tools are read-only unless specifically implementing management features (like port-forwarding).
