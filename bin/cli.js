#!/usr/bin/env node

/**
 * GitTrends & Skillselion Registry — Model Context Protocol (MCP) Server
 * Stdio JSON-RPC 2.0 Server for Claude Code, Cursor, Codex, and Antigravity
 * 
 * Capabilities:
 * - find_agent_skills: Search and inspect verified Agent Skills (SKILL.md)
 * - inspect_mcp_servers: Search and configure MCP Servers (stdio/SSE)
 * - get_trending_breakouts: Fetch fastest-growing GitHub breakout repos
 * - get_census_report: Retrieve empirical research desk censuses
 * - get_ecosystem_stats: Summary counts of tools, installs, and velocity
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const readline = require("readline");

const SERVER_NAME = "gittrends-mcp";
const SERVER_VERSION = "5.0.0";
const REMOTE_DATA_URL = "https://raw.githubusercontent.com/jastfan/github-trending/main/data/latest.json";

// In-memory catalog cache
let cachedCatalog = null;

// Resolve catalog data locally or remotely
async function loadCatalog() {
  if (cachedCatalog) return cachedCatalog;

  // 1. Try local data/latest.json
  const localPaths = [
    path.join(__dirname, "..", "data", "latest.json"),
    path.join(process.cwd(), "data", "latest.json")
  ];

  for (const p of localPaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf8");
        cachedCatalog = JSON.parse(raw);
        return cachedCatalog;
      } catch (e) {
        // Fall through to remote
      }
    }
  }

  // 2. Fetch remotely
  return new Promise((resolve) => {
    https.get(REMOTE_DATA_URL, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try {
          cachedCatalog = JSON.parse(data);
          resolve(cachedCatalog);
        } catch (err) {
          resolve({ skills: [], mcp_servers: [], marketplaces: [], categories: {}, research: {} });
        }
      });
    }).on("error", () => {
      resolve({ skills: [], mcp_servers: [], marketplaces: [], categories: {}, research: {} });
    });
  });
}

// MCP Tools Definition Schema
const TOOLS = [
  {
    name: "find_agent_skills",
    description: "Search the Skillselion registry of verified AI Agent Skills for Claude Code, Cursor, and Antigravity. Filter by domain pillar or keyword.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Keyword search (e.g. 'design', 'test', 'browser', 'react', 'tdd')"
        },
        category: {
          type: "string",
          description: "Domain pillar (e.g. 'ai-agents', 'frontend-design', 'backend-data', 'dev-tools', 'automation', 'testing-review', 'security', 'monitoring-cloud', 'docs-planning')"
        },
        limit: {
          type: "integer",
          description: "Maximum results to return (default 10)"
        }
      }
    }
  },
  {
    name: "inspect_mcp_servers",
    description: "Search and retrieve Model Context Protocol (MCP) servers with ready-to-use Cursor / Claude CLI connection snippets.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Capability or name query (e.g. 'context', 'browser', 'database', 'sqlite', 'chrome')"
        },
        category: {
          type: "string",
          description: "Domain pillar (e.g. 'backend-data', 'dev-tools', 'ai-agents')"
        },
        limit: {
          type: "integer",
          description: "Maximum results to return (default 10)"
        }
      }
    }
  },
  {
    name: "get_trending_breakouts",
    description: "Discover breakout trending GitHub repositories filtered by language, 24h star delta, or momentum classifier (🔥 Viral Surge).",
    inputSchema: {
      type: "object",
      properties: {
        language: {
          type: "string",
          description: "Language filter ('overall', 'python', 'javascript', 'typescript', 'go', 'rust')"
        },
        min_stars_today: {
          type: "integer",
          description: "Minimum stars gained today (e.g. 50)"
        },
        limit: {
          type: "integer",
          description: "Maximum results to return (default 10)"
        }
      }
    }
  },
  {
    name: "get_census_report",
    description: "Access empirical research desk censuses on the AI Agent Skills & MCP ecosystem (Economy, Security, Clones, Maintenance, Use-Cases).",
    inputSchema: {
      type: "object",
      properties: {
        census_id: {
          type: "string",
          description: "Census identifier: 'economy', 'security', 'clones', 'usecases', 'maintenance', or 'all'"
        }
      }
    }
  },
  {
    name: "get_ecosystem_stats",
    description: "Get macro ecosystem benchmarks: total indexed skills, verified install counts, and leading ecosystem categories.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

// Tool Handlers
async function handleToolCall(name, args) {
  const catalog = await loadCatalog();

  if (name === "find_agent_skills") {
    let skills = catalog.skills || [];
    const q = (args.query || "").toLowerCase().trim();
    const cat = (args.category || "").toLowerCase().trim();
    const limit = args.limit || 10;

    if (cat && cat !== "all") {
      skills = skills.filter(s => (s.category || "").toLowerCase() === cat);
    }
    if (q) {
      skills = skills.filter(s => 
        (s.name || "").toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q) ||
        (s.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    const results = skills.slice(0, limit).map(s => ({
      name: s.name,
      category: s.category,
      installs: s.installs_display || s.installs,
      growth: s.growth_pct,
      stars: s.stars,
      description: s.description,
      install_command: s.install_command,
      repo_url: s.repo_url || s.url
    }));

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          total_matched: skills.length,
          returned: results.length,
          skills: results
        }, null, 2)
      }]
    };
  }

  if (name === "inspect_mcp_servers") {
    let servers = catalog.mcp_servers || [];
    const q = (args.query || "").toLowerCase().trim();
    const cat = (args.category || "").toLowerCase().trim();
    const limit = args.limit || 10;

    if (cat && cat !== "all") {
      servers = servers.filter(s => (s.category || "").toLowerCase() === cat);
    }
    if (q) {
      servers = servers.filter(s => 
        (s.name || "").toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q) ||
        (s.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    const results = servers.slice(0, limit).map(s => ({
      name: s.name,
      category: s.category,
      connection: s.connection || "stdio",
      installs: s.installs_display || s.installs,
      stars: s.stars,
      description: s.description,
      install_command: s.install_command,
      cursor_config: s.cursor_config,
      repo_url: s.repo_url || s.url
    }));

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          total_matched: servers.length,
          returned: results.length,
          mcp_servers: results
        }, null, 2)
      }]
    };
  }

  if (name === "get_trending_breakouts") {
    const categories = catalog.categories || {};
    const lang = (args.language || "overall").toLowerCase().trim();
    const minStars = args.min_stars_today || 0;
    const limit = args.limit || 10;

    let repos = [];
    if (lang === "all" || lang === "overall") {
      const seen = new Set();
      for (const [catName, catRepos] of Object.entries(categories)) {
        for (const r of catRepos) {
          if (!seen.has(r.url)) {
            seen.add(r.url);
            repos.push(r);
          }
        }
      }
    } else {
      repos = categories[lang] || [];
    }

    if (minStars > 0) {
      repos = repos.filter(r => (r.stars_today || 0) >= minStars);
    }

    // Sort by stars_today descending
    repos.sort((a, b) => (b.stars_today || 0) - (a.stars_today || 0));

    const results = repos.slice(0, limit).map(r => ({
      name: r.name,
      full_name: r.full_name,
      language: r.language,
      stars_today: r.stars_today,
      total_stars: r.total_stars,
      is_viral: (r.stars_today >= 100),
      description: r.description,
      url: r.url
    }));

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          language: lang,
          total_breakouts: repos.length,
          returned: results.length,
          trending_repos: results
        }, null, 2)
      }]
    };
  }

  if (name === "get_census_report") {
    const research = catalog.research || {};
    const reports = research.reports || [];
    const censusId = (args.census_id || "all").toLowerCase().trim();

    let filtered = reports;
    if (censusId !== "all") {
      filtered = reports.filter(r => 
        r.id.toLowerCase().includes(censusId) || 
        r.title.toLowerCase().includes(censusId)
      );
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          authority: research.authority,
          reports: filtered
        }, null, 2)
      }]
    };
  }

  if (name === "get_ecosystem_stats") {
    const ecosystem = catalog.ecosystem || {};
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          server: `${SERVER_NAME} v${SERVER_VERSION}`,
          updated_at: catalog.updated_at,
          totals: ecosystem.totals,
          categories: ecosystem.categories
        }, null, 2)
      }]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

// Stdio JSON-RPC 2.0 Handler Loop
function startStdioServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on("line", async (line) => {
    line = line.trim();
    if (!line) return;

    let request;
    try {
      request = JSON.parse(line);
    } catch (e) {
      sendResponse(null, {
        code: -32700,
        message: "Parse error"
      });
      return;
    }

    const { id, method, params } = request;

    // Standard MCP Protocol Dispatcher
    try {
      if (method === "initialize") {
        sendResult(id, {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: SERVER_NAME,
            version: SERVER_VERSION
          }
        });
      } else if (method === "notifications/initialized") {
        // Notification - no response needed
      } else if (method === "ping") {
        sendResult(id, {});
      } else if (method === "tools/list") {
        sendResult(id, { tools: TOOLS });
      } else if (method === "tools/call") {
        if (!params || !params.name) {
          sendError(id, -32602, "Invalid params: name required");
          return;
        }
        const toolResult = await handleToolCall(params.name, params.arguments || {});
        sendResult(id, toolResult);
      } else {
        sendError(id, -32601, `Method not found: ${method}`);
      }
    } catch (err) {
      sendError(id, -32603, err.message || "Internal error");
    }
  });
}

function sendResult(id, result) {
  if (id === undefined || id === null) return;
  const payload = {
    jsonrpc: "2.0",
    id,
    result
  };
  process.stdout.write(JSON.stringify(payload) + "\n");
}

function sendError(id, code, message) {
  if (id === undefined || id === null) return;
  const payload = {
    jsonrpc: "2.0",
    id,
    error: { code, message }
  };
  process.stdout.write(JSON.stringify(payload) + "\n");
}

// Self-test or Run Stdio
if (require.main === module) {
  if (process.argv.includes("--test")) {
    console.log("GitTrends MCP Server syntax & tools self-test:");
    console.log(`- Server: ${SERVER_NAME} v${SERVER_VERSION}`);
    console.log(`- Registered Tools: ${TOOLS.length}`);
    TOOLS.forEach(t => console.log(`  • ${t.name}: ${t.description.slice(0, 60)}...`));
    process.exit(0);
  }

  startStdioServer();
}

module.exports = { TOOLS, handleToolCall, loadCatalog };
