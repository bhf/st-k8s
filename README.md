<a id="top"></a>
# ST-K8s

View and chat to your Kubernetes cluster.


Features a dashboard (with a K9s inspired dark theme), REST API, and MCP server. In browser AI chat powered by the Copilot SDK (technical preview). 
Integrates with VSCode and Copilot.

![img.png](docs/chat_1.png)

Uses [Github Projects](https://github.com/users/bhf/projects/5) for planning and tracking.

## Table of Contents

- [ST-K8s](#st-k8s)
  - [Table of Contents](#table-of-contents)
  - [How to Run](#how-to-run)
  - [API](#api)
  - [Model Context Protocol (MCP) Server](#model-context-protocol-mcp-server)
    - [Features](#features)
    - [Running the MCP Server](#running-the-mcp-server)
    - [Configuring for VSCode](#configuring-for-vscode)
  - [LLM Integration Techniques](#llm-integration-techniques)
  - [High Level Architecture](#high-level-architecture)

## How to Run

```bash
git clone https://github.com/bhf/st-k8s
npm run build
npm run start
```

To use the browser based chat feature make sure you install the [Copilot CLI](https://github.com/github/copilot-cli).

[Back to Top](#top)

## API

Swagger spec available at `http://localhost:3000/openapi.json` after starting the server or from the public folder.

[Back to Top](#top)

## Model Context Protocol (MCP) Server

This project includes an MCP server that exposes Kubernetes tools to LLMs over stdio. Here are some example uses:

* List of pods
* Rank containers by their memory requests and limits
* Summary of the last events in the namespace

![img_1.png](docs/img_1.png)

![img_2.png](docs/img_2.png)


[Back to Top](#top)

### Features
Exposes read-only Kubernetes operations as tools:
- `list_namespaces`
- `list_pods`
- `list_deployments`
- `list_services`
- `list_daemonsets`
- `list_replicasets`
- `list_statefulsets`
- `list_ingresses`
- `list_endpoints`
- `list_events`
- `list_pvcs`

[Back to Top](#top)

### Running the MCP Server

Make sure to auth your kubectl context in your preferred way before running the MCP server.

You can run the MCP server directly using:

```bash
npm run mcp
```

You can also run it from VSCode or any MCP-compatible client by configuring it as shown below.

[Back to Top](#top)

### Configuring for VSCode

Add the following to your ```mcp.json```

```json
{
  "servers": {
    "k8s-tools": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/absolute/path/to/st-k8s",
      "disabled": false,
      "autoApprove": [] 
    }
  }
}

```

Make sure to replace `/absolute/path/to/st-k8s` with the actual path to this repository on your machine.

[Back to Top](#top)

## LLM Integration Techniques

This project uses several LLM-based techniques to enhance the development lifecycle and user experience. These artifacts are located in the `.github` directory:

*   **Agents**: Domain-specific personas, such as the `Expert Next.js Developer` (`.github/agents/expert-nextjs-developer.agent.md`), which embody specialized knowledge for consistent code generation.
*   **Instructions**: Contextual guidelines including `copilot-instructions.md` (project overview) and `nextjs-tailwind.instructions.md` that enforce coding standards and architectural patterns.
*   **Skills**: Reusable capabilities like the `excalidraw-diagram-generator` (`.github/skills/`) that allow the model to perform complex tasks like generating visual diagrams from natural language.
*   **Prompts**: Curated prompt templates (e.g., `clean-excalidraw.prompt.md`) ensuring high-quality, reproducible outputs for specific tasks.

[Back to Top](#top)

## High Level Architecture

![alt text](docs/architecture.png)

[Back to Top](#top)
