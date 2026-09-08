# 🔌 Model Context Protocol (MCP) Integration Blueprint

The **Model Context Protocol (MCP)** is an open standard created by Anthropic that allows AI applications and coding agents to connect to local tools, databases, and enterprise services through a unified interface.

---

## 1. MCP Architecture Overview

```text
┌───────────────────────────────┐
│     Coding Agent / Client     │
│ (Claude Code, Cursor, Antigrav)│
└───────────────┬───────────────┘
                │ JSON-RPC 2.0 (stdio or SSE)
                ▼
┌───────────────────────────────┐
│          MCP Server           │
│   (gittrends-mcp, context7)   │
└───────────────┬───────────────┘
                │ Native Tool Call
                ▼
┌───────────────────────────────┐
│ Local Filesystem / API / DB   │
└───────────────────────────────┘
```

MCP defines three core primitives:
1. **Tools**: Callable executable routines with defined JSON schemas (e.g. querying a database, running a browser).
2. **Resources**: Read-only context feeds (e.g. logs, API docs, system telemetry).
3. **Prompts**: Pre-parameterized workflow templates.

---

## 2. Setting Up MCP Servers

### A. Claude Code CLI
Claude Code supports both stdio and HTTP/SSE MCP servers directly via its CLI:

```bash
# Add GitTrends AI registry
claude mcp add gittrends -- npx -y gittrends-mcp

# Add Chrome DevTools for browser testing
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp

# Add Upstash Context7 for long-context docs
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

Verify active servers in Claude Code:
```bash
claude mcp list
```

---

### B. Cursor IDE (`.cursor/mcp.json`)
In Cursor, create `.cursor/mcp.json` in your project root or user config directory:

```json
{
  "mcpServers": {
    "gittrends": {
      "command": "npx",
      "args": ["-y", "gittrends-mcp"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"]
    }
  }
}
```

---

### C. Antigravity IDE (`mcp_config.json`)
Antigravity supports MCP server declarations in project root `.agents/mcp_config.json` or global config:

```json
{
  "mcpServers": {
    "gittrends": {
      "command": "node",
      "args": ["./bin/cli.js"]
    }
  }
}
```

---

## 3. Top Curated MCP Servers in the Registry

| Server | Connection | Verified Installs | Primary Use-Case |
| :--- | :---: | :---: | :--- |
| **Sequential Thinking** | `stdio` | 2.1M | Multi-step reasoning and dynamic thought branching |
| **Scrapling MCP** | `stdio` | 890k | Adaptive web scraping with anti-bot bypass |
| **Context7** | `SSE / HTTP` | 1.4M | High-performance vector memory and documentation lookup |
| **Chrome DevTools** | `stdio` | 3.2M | DOM inspection, console logs, and browser automation |
| **Codebase Memory** | `stdio` | 640k | Persistent cross-session semantic codebase indexing |

---

## 4. MCP Security & Governance

According to findings in **The Agent Skill Security Census**:
- **87.8%** of public skills and MCP plugins run with ambient elevated permissions.
- Always review command execution arguments (`args`) before running third-party MCP servers.
- Prefer stdio over unauthenticated public SSE endpoints when handling sensitive codebases.
