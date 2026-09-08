# 📚 GitTrends AI Developer & Agent Guides

Welcome to the **GitTrends AI Registry Guides Directory**. This documentation hub provides complete technical blueprints, installation recipes, and architecture guides for developers and autonomous coding agents (*Claude Code, Cursor, Codex, and Antigravity*).

---

## 🗂️ Guides Directory Index

| Guide | Target Audience | Description |
| :--- | :--- | :--- |
| [**Agent Skills Integration Guide**](agent_skills_guide.md) | Agent Developers, Prompt Engineers | How to discover, install, author, and structure modular agent skills (`SKILL.md`) with progressive disclosure. |
| [**MCP Servers Integration Blueprint**](mcp_servers_integration.md) | Full-Stack & Tool Developers | Configuring stdio & SSE Model Context Protocol servers in Cursor (`.cursor/mcp.json`), Claude Code, and Antigravity. |
| [**2026 Empirical Research Censuses**](research_census_2026.md) | Researchers, Journalists, Tech Leads | Methodology, raw data access, and insights from our 5 empirical ecosystem censuses (Economy, Security, Clones, Maintenance, Use-Cases). |

---

## ⚡ 1-Click Agent Integration: `gittrends-mcp`

You can connect your coding agent directly to the entire GitTrends AI registry mid-task with zero manual downloads.

### 1. Claude Code
```bash
claude mcp add gittrends -- npx -y gittrends-mcp
```

### 2. Cursor IDE (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "gittrends": {
      "command": "npx",
      "args": ["-y", "gittrends-mcp"]
    }
  }
}
```

### 3. Antigravity IDE (`mcp_config.json`)
```json
{
  "mcpServers": {
    "gittrends": {
      "command": "npx",
      "args": ["-y", "gittrends-mcp"]
    }
  }
}
```

---

## 🛠️ MCP Server Exposed Tools

Once configured, coding agents gain access to 5 native tools:

1. `find_agent_skills(query, category, limit)`: Query 59k+ categorized skills with 1-click install snippets.
2. `inspect_mcp_servers(query, category, limit)`: Inspect stdio and SSE servers with auto-generated configuration JSON.
3. `get_trending_breakouts(language, min_stars_today, limit)`: Retrieve GitHub breakout repositories with star velocity classification.
4. `get_census_report(census_id)`: Access empirical data on agent skill security, distribution, and code maintenance.
5. `get_ecosystem_stats()`: Macro benchmarks on total listings, installs, and domain leaders.

---

> 🌐 **Live Web Registry**: [https://jastfan.github.io/github-trending/](https://jastfan.github.io/github-trending/)  
> 📦 **GitHub Repository**: [https://github.com/jastfan/github-trending](https://github.com/jastfan/github-trending)
