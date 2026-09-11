## 🚀 Why Traditional GitHub Trending Falls Short for AI Engineers

If you build with AI coding agents (Claude Code, Cursor, Codex, Antigravity), you’ve probably noticed a major blind spot in developer tooling: **discovery**.

GitHub's native trending feed is useful, but:
1. **It ignores velocity dynamics:** A repo with 50 stars gaining 40/day is moving faster than a 100k repo gaining 5, but gets buried.
2. **No taxonomy for the Agent Ecosystem:** There’s no native way to filter specifically for **Model Context Protocol (MCP) servers**, **Agent Skills**, or **Local LLM frameworks**.
3. **Coding agents can't read it mid-task:** You have to manually browse in a browser, search, clone, and configure.

To solve this, I built and just shipped **GitTrends AI v5.0** — an open-source Swiss Editorial developer registry, real-time star velocity tracker, and automated intelligence engine.

- 🌐 **Live Web App:** https://jastfan.github.io/github-trending/
- 💻 **Source Code:** https://github.com/jastfan/github-trending
- 📦 **NPM Package:** `gittrends-mcp`

---

## ⚡ 1-Click Coding Agent Discovery (Native MCP Integration)

You don't even have to leave your terminal or IDE to find breakout skills and repositories. GitTrends AI ships with a native **Model Context Protocol (MCP)** server.

### For Claude Code:
`claude mcp add gittrends -- npx -y gittrends-mcp`

### For Cursor (`.cursor/mcp.json`) & Antigravity:
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

Now, your agent can query live GitHub breakouts, star velocities, and curated MCP tools automatically while coding!

---

## 🌟 What’s New in GitTrends AI v5.0

### 1. 🏆 4 Numbered Editorial Leaderboards
Rather than a cluttered raw list, the new dashboard categorizes the ecosystem into high-signal leaderboards:
- **Agent Skills:** Battle-tested plugins and tool recipes for coding agents.
- **MCP Servers:** Verified stdio and SSE server implementations.
- **Ecosystem Marketplaces:** Curated hubs and catalogs.
- **Star Velocity Radar:** Emerging breakout repos ranked by net 24-hour star surge (+stars/day).

### 2. 🎨 Zero-Overlap Swiss Editorial UI & Sticky Navigation
We completely redesigned the layout with a clean **Swiss High-Contrast aesthetic**:
- **Independent Ticker Banner:** The top live statistics marquee scrolls out of view naturally without occupying permanent screen real-estate.
- **Frosted Glass Floating Navbar:** Built with a resilient sticky navbar and elevated stacking context so you never get awkward overlapping or cropped links during fast scrolling.
- **Instant Search Flyout & Quick Filter Pills:** Filter across AI & Agents, Dev Tools, Local AI, and Systems in milliseconds.

### 3. 🤖 Resilient Autonomous Automation (2x Daily Zero-Maintenance)
The registry stays fresh automatically using scheduled **GitHub Actions**:
- **Off-Peak Execution (00:20 & 12:20 UTC):** Avoids GitHub's top-of-the-hour runner queue bottlenecks.
- **Self-Healing API Fallback:** If GitHub's front-end trending page throttles requests, the engine automatically switches to authenticated GitHub Search API queries.
- **Atomic Rebase Deployment:** Automated commits pull and rebase before pushing, ensuring GitHub Pages builds without conflict.

### 4. 📊 Open Data Access & Empirical Research Desk
You can consume this data directly in your own scripts or feeds:
- **Machine-Readable JSON:** `data/latest.json`
- **Daily RSS 2.0 Feed:** `feed.xml` for Slack, Discord, or Feedly webhooks.
- **Empirical Ecosystem Censuses:** Security audits, code age distribution, and skill clone analysis in the repository guides.

---

## 🛠️ Under the Hood: The Tech Stack

- **Frontend:** Vanilla JS + Swiss Minimalist CSS (zero bloated UI dependencies for ultra-fast TTFB).
- **Engine:** Python 3.12 (requests, beautifulsoup4, urllib3 with exponential backoff).
- **Hosting & CI/CD:** GitHub Pages + GitHub Actions.
- **Protocol:** Model Context Protocol (MCP) TypeScript SDK distributed via npm.

---

## 🤝 Try It Out & Get Involved

1. Check out the live interface: https://jastfan.github.io/github-trending/
2. Star or fork the repository on GitHub: https://github.com/jastfan/github-trending
3. Have an MCP server or Agent Skill to showcase? Use the in-app **"➕ Submit"** button to get featured on the registry!

Let me know your thoughts or feature requests in the comments below! 👇
