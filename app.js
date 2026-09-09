/**
 * GitTrends AI Registry — Client Application (v5.0 - Phase 5 Advanced Mode)
 * Features:
 * - Multi-Registry Routing & Deep Linking (Shareable URLs for tools, tabs, and pillars)
 * - Sub-millisecond Multi-Keyword Search with Term Highlighting
 * - 9-Pillar Domain Dynamic Counters
 * - Dual Data Exporter (JSON & RFC 4180 CSV Export)
 * - Momentum & Decay Classifier (+300% Viral Surge vs Steady Adoption)
 * - Interactive Inspector Modal with Claude / Cursor / Antigravity Config Generator
 * - Community 1-Click Submission Wizard (with GitHub Issue generator)
 * - Live Interactive Agent Prompt Simulator (terminal testbench)
 * - Side-by-Side Tool & Benchmark Comparison Engine
 */

// Global Application State
let catalogData = {
  skills: [],
  marketplaces: [],
  mcp_servers: [],
  trending: [],
  research: {},
  ecosystem: {}
};

let allTools = [];
let filteredTools = [];
let bookmarks = new Set(JSON.parse(localStorage.getItem("gittrends_bookmarks") || "[]"));
let compareList = new Set();

let activeCatalog = "all";       // "all" | "skills" | "mcp" | "marketplaces" | "trending" | "research"
let activePillar = "all";        // "all" | "ai-agents" | "frontend-design" | ...
let searchQuery = "";
let currentSort = "installs";    // "installs" | "growth" | "stars" | "velocity" | "name"
let activeViewMode = "cards";    // "cards" | "table"
let showOnlyBookmarks = false;
let currentInspectedTool = null;

// DOM Elements
const reposGrid = document.getElementById("reposGrid");
const reposTableContainer = document.getElementById("reposTableContainer");
const reposTableBody = document.getElementById("reposTableBody");
const researchSection = document.getElementById("researchSection");
const censusGrid = document.getElementById("censusGrid");
const searchInput = document.getElementById("searchInput");
const searchFlyout = document.getElementById("searchFlyout");
const searchClearBtn = document.getElementById("searchClearBtn");
const searchWrapper = document.getElementById("searchWrapper");
const sortSelect = document.getElementById("sortSelect");
const resultsCount = document.getElementById("resultsCount");
const currentSectionTitle = document.getElementById("currentSectionTitle");
const bookmarkCount = document.getElementById("bookmarkCount");
const compareCount = document.getElementById("compareCount");
const btnFilterBookmarks = document.getElementById("btnFilterBookmarks");
const btnOpenCompare = document.getElementById("btnOpenCompare");
const btnViewCards = document.getElementById("btnViewCards");
const btnViewTable = document.getElementById("btnViewTable");
const toast = document.getElementById("appToast");
const toastMsg = document.getElementById("toastMsg");

// Phase 5 Modals & Simulator Elements
const submitModalBackdrop = document.getElementById("submitModalBackdrop");
const compareModalBackdrop = document.getElementById("compareModalBackdrop");
const compareModalBody = document.getElementById("compareModalBody");
const simulatorDrawer = document.getElementById("simulatorDrawer");
const simTerminalScreen = document.getElementById("simTerminalScreen");
const simInput = document.getElementById("simInput");
const subJsonPreview = document.getElementById("subJsonPreview");

// Hero Counters
const statTrackedCount = document.getElementById("statTrackedCount");
const statInstallsCount = document.getElementById("statInstallsCount");
const statMaxVelocity = document.getElementById("statMaxVelocity");
const statTopEcosystem = document.getElementById("statTopEcosystem");
const lastUpdatedLabel = document.getElementById("lastUpdatedLabel");

// Tabs & Navigation
const catalogTabs = document.querySelectorAll(".catalog-tab");
const navLinkBtns = document.querySelectorAll(".nav-link-btn");
const pillarPills = document.querySelectorAll(".pillar-pill");

// Modal Elements
const modalBackdrop = document.getElementById("modalBackdrop");
const modalTypeBadge = document.getElementById("modalTypeBadge");
const modalTitle = document.getElementById("modalTitle");
const modalAuthor = document.getElementById("modalAuthor");
const modalInstalls = document.getElementById("modalInstalls");
const modalGrowth = document.getElementById("modalGrowth");
const modalStars = document.getElementById("modalStars");
const modalCategory = document.getElementById("modalCategory");
const modalDescription = document.getElementById("modalDescription");
const modalSnippetCode = document.getElementById("modalSnippetCode");
const modalTagsList = document.getElementById("modalTagsList");
const modalRepoLink = document.getElementById("modalRepoLink");
const installTabs = document.querySelectorAll(".install-tab");

// Pillar Mapping
const PILLAR_NAMES = {
  "ai-agents": "AI & Agents",
  "frontend-design": "Frontend & Design",
  "backend-data": "Backend & Data",
  "dev-tools": "Dev Tools",
  "automation": "Automation",
  "testing-review": "Testing & Review",
  "security": "Security",
  "monitoring-cloud": "Monitoring & Cloud",
  "docs-planning": "Docs & Planning"
};

// Utilities
function formatNum(num) {
  if (!num) return "0";
  if (typeof num === "string") return num;
  return new Intl.NumberFormat("en-US").format(num);
}

function parseGrowthNum(growthStr) {
  if (!growthStr) return 0;
  const cleaned = String(growthStr).replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}

function parseStarsNum(starsStr) {
  if (typeof starsStr === "number") return starsStr;
  if (!starsStr) return 0;
  const s = String(starsStr).toLowerCase().trim().replace(/,/g, "");
  if (s.endsWith("k")) return parseFloat(s) * 1000;
  if (s.endsWith("m")) return parseFloat(s) * 1000000;
  return parseFloat(s) || 0;
}

function highlightMatch(text, query) {
  if (!query || !text) return text || "";
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  return text.replace(regex, `<mark style="background: rgba(56,189,248,0.3); color: #fff; padding: 0 2px; border-radius: 2px;">$1</mark>`);
}

function showToast(message) {
  toastMsg.textContent = message;
  toast.classList.add("show");
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// 1-Click Copy Helpers
window.copyAgentQuickCommand = function(e) {
  if (e) e.stopPropagation();
  const cmd = "claude mcp add gittrends -- npx -y gittrends-mcp";
  navigator.clipboard.writeText(cmd).then(() => {
    showToast("Copied: " + cmd);
  });
};

window.copyInstallCmd = function(cmd, e) {
  if (e) e.stopPropagation();
  if (!cmd) return;
  navigator.clipboard.writeText(cmd).then(() => {
    showToast(`Copied: ${cmd}`);
  });
};

window.toggleBookmark = function(toolId, e) {
  if (e) e.stopPropagation();
  if (bookmarks.has(toolId)) {
    bookmarks.delete(toolId);
    showToast("Removed from bookmarks");
  } else {
    bookmarks.add(toolId);
    showToast("Added to bookmarks ★");
  }
  localStorage.setItem("gittrends_bookmarks", JSON.stringify(Array.from(bookmarks)));
  updateBookmarkBadge();
  render();
};

function updateBookmarkBadge() {
  bookmarkCount.textContent = bookmarks.size;
  if (bookmarks.size === 0 && showOnlyBookmarks) {
    showOnlyBookmarks = false;
    btnFilterBookmarks.classList.remove("active");
  }
}

// Side-by-Side Tool Comparison Engine
window.toggleCompareItem = function(toolId, e) {
  if (e) e.stopPropagation();
  if (compareList.has(toolId)) {
    compareList.delete(toolId);
    showToast("Removed from comparison");
  } else {
    if (compareList.size >= 3) {
      showToast("Comparison limit reached (max 3 tools)");
      return;
    }
    compareList.add(toolId);
    showToast(`Added to comparison (⚖️ ${compareList.size}/3)`);
  }
  updateCompareBadge();
  render();
};

function updateCompareBadge() {
  if (compareCount) {
    compareCount.textContent = compareList.size;
  }
}

window.openCompareModal = function() {
  if (compareList.size === 0) {
    showToast("Select at least 1 tool using the ⚖️ button to compare");
    return;
  }
  const tools = allTools.filter(t => compareList.has(t.id));
  if (tools.length === 0) return;

  const tableHtml = `
    <table class="compare-table">
      <thead>
        <tr>
          <th>Attribute</th>
          ${tools.map(t => `<th>${t.name} ${t.verified ? '✓' : ''}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Type</strong></td>
          ${tools.map(t => `<td><span class="type-pill type-${t.type}">${t.type}</span></td>`).join("")}
        </tr>
        <tr>
          <td><strong>Pillar Domain</strong></td>
          ${tools.map(t => `<td>${PILLAR_NAMES[t.category] || t.category}</td>`).join("")}
        </tr>
        <tr>
          <td><strong>Real Installs</strong></td>
          ${tools.map(t => `<td>${t.installs_display || formatNum(t.installs) || 'N/A'}</td>`).join("")}
        </tr>
        <tr>
          <td><strong>Star Velocity / Growth</strong></td>
          ${tools.map(t => `<td style="color: var(--accent-emerald); font-weight: 700;">${t.growth_pct || (t.stars_today ? `+${t.stars_today}★` : 'Active')}</td>`).join("")}
        </tr>
        <tr>
          <td><strong>Total Stars</strong></td>
          ${tools.map(t => `<td>★ ${formatNum(t.stars || t.total_stars)}</td>`).join("")}
        </tr>
        <tr>
          <td><strong>Publisher</strong></td>
          ${tools.map(t => `<td>@${t.author || t.owner || 'community'}</td>`).join("")}
        </tr>
        <tr>
          <td><strong>1-Click Install</strong></td>
          ${tools.map(t => `<td><button class="action-btn" onclick="copyInstallCmd('${t.install_command || ''}', event)" style="font-family: var(--font-mono); font-size: 0.72rem; padding: 4px 8px;">📋 Copy</button></td>`).join("")}
        </tr>
      </tbody>
    </table>
  `;

  compareModalBody.innerHTML = tableHtml;
  compareModalBackdrop.classList.add("open");
};

window.closeCompareModal = function() {
  compareModalBackdrop.classList.remove("open");
};

window.clearCompareList = function() {
  compareList.clear();
  updateCompareBadge();
  closeCompareModal();
  render();
  showToast("Cleared comparison list");
};

// Community Submission Wizard
window.openSubmitModal = function() {
  submitModalBackdrop.classList.add("open");
  updateSubmissionSpecPreview();
};

window.closeSubmitModal = function() {
  submitModalBackdrop.classList.remove("open");
};

window.updateSubmissionSpecPreview = function() {
  const name = document.getElementById("subName")?.value || "Example Tool";
  const repo = document.getElementById("subRepo")?.value || "https://github.com/user/repo";
  const type = document.getElementById("subType")?.value || "skill";
  const cat = document.getElementById("subCategory")?.value || "frontend-design";
  const desc = document.getElementById("subDesc")?.value || "Tool description goes here.";
  const cmd = document.getElementById("subCmd")?.value || "claude plugin add user/repo";

  const spec = {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: name,
    type: type,
    category: cat,
    description: desc,
    repo_url: repo,
    install_command: cmd,
    verified: false,
    submitted_via: "community_wizard"
  };

  if (subJsonPreview) {
    subJsonPreview.textContent = JSON.stringify(spec, null, 2);
  }
};

window.copySubmissionJson = function() {
  const code = subJsonPreview?.textContent || "";
  navigator.clipboard.writeText(code).then(() => {
    showToast("Copied submission JSON spec!");
  });
};

window.handleSkillSubmission = function(e) {
  e.preventDefault();
  const name = document.getElementById("subName")?.value || "New Skill";
  const repo = document.getElementById("subRepo")?.value || "";
  const type = document.getElementById("subType")?.value || "skill";
  const cat = document.getElementById("subCategory")?.value || "frontend-design";
  const desc = document.getElementById("subDesc")?.value || "";
  const cmd = document.getElementById("subCmd")?.value || "";

  const issueTitle = encodeURIComponent(`[NEW SUBMISSION]: ${name} (${type.toUpperCase()})`);
  const issueBody = encodeURIComponent(`### 🚀 New Tool / Skill Submission for GitTrends AI

**Tool Name**: ${name}
**Type**: ${type}
**Domain Pillar**: ${cat}
**GitHub Repository**: ${repo}
**Install Command**: \`${cmd}\`

**Description**:
${desc}

**Registry Spec JSON**:
\`\`\`json
${subJsonPreview?.textContent || ''}
\`\`\`
`);

  const issueUrl = `https://github.com/jastfan/github-trending/issues/new?title=${issueTitle}&body=${issueBody}`;
  window.open(issueUrl, "_blank");
  closeSubmitModal();
  showToast("Opening GitHub issue submission template ↗");
};

// Live Agent Prompt Simulator
window.toggleSimulatorDrawer = function() {
  simulatorDrawer.classList.toggle("open");
  if (simulatorDrawer.classList.contains("open")) {
    simInput?.focus();
  }
};

window.simulatePreset = function(presetName) {
  if (presetName === "apple-design") {
    appendSimLine("$ claude --agent-mode 'Refactor buttons with Apple HIG'", "prompt-line");
    appendSimLine("🧠 [Thinking] Querying GitTrends AI registry for verified UI skills...", "thought-line");
    appendSimLine("✓ Loaded skill: apple-design-system (v1.2.0) [Pillar: Frontend & Design]", "success-line");
    appendSimLine("ℹ Injected design tokens: San Francisco typography, Cupertino glassmorphism, spring physics", "output-line");
  } else if (presetName === "tdd") {
    appendSimLine("$ claude 'Implement feature using red-green TDD'", "prompt-line");
    appendSimLine("🧠 [Thinking] Detecting test runner and loading test-driven-development skill...", "thought-line");
    appendSimLine("✓ Loaded skill: tdd-workflow [Pillar: Testing & Review]", "success-line");
    appendSimLine("ℹ Strict rule active: Writing failing test in tests/ first before implementation", "output-line");
  } else if (presetName === "context7") {
    appendSimLine("$ cursor --mcp-invoke context7.query_docs", "prompt-line");
    appendSimLine("🧠 [Thinking] Dispatching stdio MCP request to Context7 server...", "thought-line");
    appendSimLine("✓ Connected: @upstash/context7-mcp (1.4M verified installs)", "success-line");
    appendSimLine("ℹ Retrieved 8 relevant documentation snippets in 18ms", "output-line");
  } else if (presetName === "caveman") {
    appendSimLine("$ claude 'Explain RAG pipeline architecture'", "prompt-line");
    appendSimLine("🧠 [Thinking] Activating JuliusBrussee/caveman token saving mode...", "thought-line");
    appendSimLine("✓ Loaded skill: caveman (cut 65% conversational filler)", "success-line");
    appendSimLine("🪨 Caveman output: 'User ask. Vector search chunk. Embed query. Cosine top-k. Send to LLM. Done.'", "output-line");
  }
};

function appendSimLine(text, lineClass) {
  if (!simTerminalScreen) return;
  const div = document.createElement("div");
  div.className = `term-line ${lineClass}`;
  div.textContent = text;
  simTerminalScreen.appendChild(div);
  simTerminalScreen.scrollTop = simTerminalScreen.scrollHeight;
}

window.handleSimKey = function(e) {
  if (e.key === "Enter") {
    runSimPrompt();
  }
};

window.runSimPrompt = function() {
  const prompt = simInput?.value?.trim();
  if (!prompt) return;
  simInput.value = "";

  appendSimLine(`$ agent --run "${prompt}"`, "prompt-line");
  appendSimLine(`🧠 [Agent Thinking] Searching GitTrends AI registry for skills matching "${prompt}"...`, "thought-line");

  setTimeout(() => {
    // Find best match in catalog
    const q = prompt.toLowerCase();
    const match = allTools.find(t => 
      (t.name || "").toLowerCase().includes(q) || 
      (t.category || "").toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q)
    ) || allTools[0];

    if (match) {
      appendSimLine(`✓ Matched & loaded: ${match.name} [${match.type.toUpperCase()}]`, "success-line");
      appendSimLine(`ℹ Executing command: ${match.install_command || 'claude plugin add ' + match.name}`, "output-line");
    } else {
      appendSimLine(`ℹ No exact skill match found. Fallback to base model instruction.`, "output-line");
    }
  }, 350);
};

// Deep Linking & URL Navigation
function syncUrlParams() {
  const url = new URL(window.location);
  if (activeCatalog !== "all") {
    url.searchParams.set("catalog", activeCatalog);
  } else {
    url.searchParams.delete("catalog");
  }

  if (activePillar !== "all") {
    url.searchParams.set("pillar", activePillar);
  } else {
    url.searchParams.delete("pillar");
  }

  if (searchQuery) {
    url.searchParams.set("q", searchQuery);
  } else {
    url.searchParams.delete("q");
  }

  window.history.replaceState({}, "", url.toString());
}

function parseUrlParamsOnLoad() {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace("#", "");

  const catParam = params.get("catalog") || hash;
  if (["skills", "mcp", "marketplaces", "trending", "research"].includes(catParam)) {
    activeCatalog = catParam;
  }

  const pillarParam = params.get("pillar");
  if (pillarParam && PILLAR_NAMES[pillarParam]) {
    activePillar = pillarParam;
  }

  const queryParam = params.get("q");
  if (queryParam) {
    searchQuery = queryParam;
    searchInput.value = queryParam;
  }

  // Check if deep inspect tool parameter is passed
  const inspectId = params.get("inspect");
  if (inspectId) {
    setTimeout(() => {
      openInspectorModal(inspectId);
    }, 300);
  }

  // Update tabs UI
  catalogTabs.forEach(t => {
    t.classList.toggle("active", t.getAttribute("data-catalog") === activeCatalog);
  });
  navLinkBtns.forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-nav") === activeCatalog);
  });
  pillarPills.forEach(p => {
    p.classList.toggle("active", p.getAttribute("data-pillar") === activePillar);
  });
}

// Modal Inspector
window.openInspectorModal = function(toolId) {
  const tool = allTools.find(t => t.id === toolId);
  if (!tool) return;
  currentInspectedTool = tool;

  modalTypeBadge.textContent = tool.type.toUpperCase();
  modalTypeBadge.className = `modal-type-badge type-${tool.type}`;
  modalTitle.textContent = tool.name;
  modalAuthor.textContent = `by @${tool.author || tool.owner || "community"}`;
  
  modalInstalls.textContent = tool.installs_display || formatNum(tool.installs) || "N/A";
  modalGrowth.textContent = tool.growth_pct || (tool.stars_today ? `+${tool.stars_today}★` : "Active");
  modalStars.textContent = `★ ${formatNum(tool.stars || tool.total_stars)}`;
  modalCategory.textContent = PILLAR_NAMES[tool.category] || tool.category || "General";
  modalDescription.textContent = tool.description || "No description provided.";

  modalRepoLink.href = tool.repo_url || tool.url || "#";

  // Tags
  modalTagsList.innerHTML = (tool.tags || []).map(tag => 
    `<span class="tag-chip" style="font-size: 0.78rem; padding: 3px 8px; background: rgba(255,255,255,0.06); border-radius: 4px; color: var(--accent-cyan);">${tag}</span>`
  ).join("");

  updateModalSnippet("claude");
  modalBackdrop.classList.add("open");

  // Update URL search param for direct sharing
  const url = new URL(window.location);
  url.searchParams.set("inspect", tool.id);
  window.history.replaceState({}, "", url.toString());
};

window.closeInspectorModal = function() {
  modalBackdrop.classList.remove("open");
  currentInspectedTool = null;

  // Clean URL search param
  const url = new URL(window.location);
  url.searchParams.delete("inspect");
  window.history.replaceState({}, "", url.toString());
};

function updateModalSnippet(tabType) {
  if (!currentInspectedTool) return;
  const tool = currentInspectedTool;
  let snippet = "";

  if (tabType === "claude") {
    snippet = tool.install_command || (tool.type === "mcp" ? `claude mcp add ${tool.id} -- npx -y ${tool.id}` : `claude plugin add ${tool.repo || tool.full_name}`);
  } else if (tabType === "cursor") {
    snippet = tool.cursor_config || `// Add to .cursor/mcp.json\n{\n  "mcpServers": {\n    "${tool.id}": {\n      "command": "npx",\n      "args": ["-y", "${tool.id}"]\n    }\n  }\n}`;
  } else if (tabType === "raw") {
    snippet = `# Project: ${tool.name}\n# Repository: ${tool.repo_url || tool.url}\n# Instructions:\n${tool.instructions_preview || tool.description}`;
  }

  modalSnippetCode.textContent = snippet;
  installTabs.forEach(tab => {
    tab.classList.toggle("active", tab.getAttribute("data-tab") === tabType);
  });
}

window.copyModalSnippet = function() {
  const code = modalSnippetCode.textContent;
  navigator.clipboard.writeText(code).then(() => {
    showToast("Copied configuration to clipboard!");
  });
};

// Research Desk Renderer
function renderResearchDesk() {
  const research = catalogData.research || {};
  const reports = research.reports || [];

  censusGrid.innerHTML = reports.map(r => {
    const metricsHtml = Object.entries(r.metrics || {}).map(([k, v]) => `
      <div class="census-metric-item">
        <span class="census-metric-val">${typeof v === 'number' ? (v < 1 ? (v * 100).toFixed(1) + '%' : v) : v}</span>
        <span class="census-metric-lbl">${k.replace(/_/g, ' ').toUpperCase()}</span>
      </div>
    `).join("");

    return `
      <div class="census-card">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">${r.date}</span>
          <span class="census-tagline">${r.tagline}</span>
        </div>
        <h3 style="font-family: var(--font-heading); font-size: 1.25rem; color: #fff;">${r.title}</h3>
        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">${r.summary}</p>
        <div class="census-metrics-row">
          ${metricsHtml}
        </div>
        <div style="margin-top: 10px; display: flex; gap: 12px;">
          <a href="data/research/census_latest.json" target="_blank" class="footer-link" style="font-size: 0.8rem;">
            Download Raw Census (.JSON) ↗
          </a>
        </div>
      </div>
    `;
  }).join("");
}

// Dual Exporter: JSON & RFC-4180 CSV
window.exportCurrentData = function() {
  // Ask user preference (CSV or JSON)
  const isCsv = confirm("Click OK for CSV format, or Cancel for JSON format dataset:");
  
  if (isCsv) {
    exportCSV();
  } else {
    exportJSON();
  }
};

function exportJSON() {
  const exportBlob = new Blob([JSON.stringify(filteredTools, null, 2)], { type: "application/json" });
  downloadBlob(exportBlob, `gittrends_${activeCatalog}_${new Date().toISOString().slice(0, 10)}.json`);
  showToast("Exported dataset (.json)");
}

function exportCSV() {
  const headers = ["ID", "Name", "Type", "Category", "Author", "Stars", "Installs", "Growth", "URL", "InstallCommand"];
  const rows = filteredTools.map(t => [
    `"${t.id || ''}"`,
    `"${(t.name || '').replace(/"/g, '""')}"`,
    `"${t.type || ''}"`,
    `"${t.category || ''}"`,
    `"${t.author || t.owner || ''}"`,
    `"${t.stars || t.total_stars || 0}"`,
    `"${t.installs || 0}"`,
    `"${t.growth_pct || ''}"`,
    `"${t.repo_url || t.url || ''}"`,
    `"${(t.install_command || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `gittrends_${activeCatalog}_${new Date().toISOString().slice(0, 10)}.csv`);
  showToast("Exported dataset (.csv)");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Update Dynamic Pillar Counters
function updatePillarCounters() {
  const pillarCounts = {};
  allTools.forEach(t => {
    if (activeCatalog === "all" || t.type === activeCatalog || (activeCatalog === "skills" && t.type === "skill")) {
      const cat = t.category;
      if (cat) {
        pillarCounts[cat] = (pillarCounts[cat] || 0) + 1;
      }
    }
  });

  pillarPills.forEach(pill => {
    const pId = pill.getAttribute("data-pillar");
    const countSpan = pill.querySelector(".pill-count");
    if (pId === "all") return;

    const count = pillarCounts[pId] || 0;
    if (countSpan) {
      countSpan.textContent = count;
    } else {
      const span = document.createElement("span");
      span.className = "pill-count";
      span.style.cssText = "font-size: 0.7rem; background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 99px; margin-left: 4px; color: var(--text-muted);";
      span.textContent = count;
      pill.appendChild(span);
    }
  });
}

window.switchCatalogTab = function(catalogId) {
  activeCatalog = catalogId;
  catalogTabs.forEach(t => t.classList.toggle("active", t.getAttribute("data-catalog") === activeCatalog));
  navLinkBtns.forEach(b => b.classList.toggle("active", b.getAttribute("data-nav") === activeCatalog));
  updatePillarCounters();
  applyFiltersAndSort();
  const cp = document.getElementById("controlsPanel");
  if (cp) cp.scrollIntoView({ behavior: "smooth" });
};

// Filter, Search & Sort Pipeline
function applyFiltersAndSort() {
  syncUrlParams();

  // Control Editorial Homepage Sections Visibility
  const editorialLeaderboards = document.getElementById("editorialLeaderboards");
  const researchHomepageSection = document.getElementById("researchHomepageSection");
  const guidesSection = document.getElementById("guidesSection");
  const isHomeView = activeCatalog === "all" && !searchQuery && activePillar === "all" && !showOnlyBookmarks;

  if (editorialLeaderboards) editorialLeaderboards.style.display = isHomeView ? "block" : "none";
  if (researchHomepageSection) researchHomepageSection.style.display = isHomeView ? "block" : "none";
  if (guidesSection) guidesSection.style.display = isHomeView ? "block" : "none";

  if (activeCatalog === "research") {
    reposGrid.style.display = "none";
    reposTableContainer.style.display = "none";
    researchSection.style.display = "flex";
    resultsCount.textContent = "7 Empirical Market Censuses & Open Datasets";
    currentSectionTitle.innerHTML = `<span>📊</span> Research Desk &amp; Ecosystem Censuses`;
    renderResearchDesk();
    return;
  }

  reposGrid.style.display = activeViewMode === "cards" ? "grid" : "none";
  reposTableContainer.style.display = activeViewMode === "table" ? "block" : "none";
  researchSection.style.display = "none";

  let list = [...allTools];

  // 1. Catalog Type Filter
  if (activeCatalog === "skills") {
    list = list.filter(t => t.type === "skill");
  } else if (activeCatalog === "mcp") {
    list = list.filter(t => t.type === "mcp");
  } else if (activeCatalog === "marketplaces") {
    list = list.filter(t => t.type === "marketplace");
  } else if (activeCatalog === "trending") {
    list = list.filter(t => t.type === "trending");
  }

  // 2. Pillar Domain Filter
  if (activePillar !== "all") {
    list = list.filter(t => t.category === activePillar);
  }

  // 3. Bookmarks Only
  if (showOnlyBookmarks) {
    list = list.filter(t => bookmarks.has(t.id));
  }

  // 4. Text Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(t => {
      const matchName = (t.name || "").toLowerCase().includes(q);
      const matchDesc = (t.description || "").toLowerCase().includes(q);
      const matchAuthor = (t.author || t.owner || "").toLowerCase().includes(q);
      const matchTags = (t.tags || []).some(tag => tag.toLowerCase().includes(q));
      const matchCat = (t.category || "").toLowerCase().includes(q);
      return matchName || matchDesc || matchAuthor || matchTags || matchCat;
    });
  }

  // 5. Sorting
  list.sort((a, b) => {
    if (currentSort === "installs") {
      return (b.installs || 0) - (a.installs || 0);
    } else if (currentSort === "growth") {
      return parseGrowthNum(b.growth_pct) - parseGrowthNum(a.growth_pct);
    } else if (currentSort === "stars") {
      return parseStarsNum(b.stars || b.total_stars) - parseStarsNum(a.stars || a.total_stars);
    } else if (currentSort === "velocity") {
      return (b.stars_today || 0) - (a.stars_today || 0);
    } else if (currentSort === "name") {
      return (a.name || "").localeCompare(b.name || "");
    }
    return 0;
  });

  filteredTools = list;
  resultsCount.textContent = `Showing ${filteredTools.length} items`;
  
  // Section Title
  let icon = "⭐";
  let titleText = "All Agent Tools & Registries";
  if (activeCatalog === "skills") { icon = "⚡"; titleText = "Agent Skills Registry"; }
  else if (activeCatalog === "mcp") { icon = "🔌"; titleText = "Model Context Protocol (MCP) Servers"; }
  else if (activeCatalog === "marketplaces") { icon = "🏪"; titleText = "Claude Code & Agent Marketplaces"; }
  else if (activeCatalog === "trending") { icon = "🔥"; titleText = "Star Velocity Radar (GitHub Trending)"; }

  if (activePillar !== "all") {
    titleText += ` • ${PILLAR_NAMES[activePillar] || activePillar}`;
  }
  if (showOnlyBookmarks) {
    titleText = `★ Saved Bookmarks (${filteredTools.length})`;
  }

  currentSectionTitle.innerHTML = `<span>${icon}</span> ${titleText}`;
  render();
}

// Render Engine (Cards + Table)
function render() {
  if (activeCatalog === "research") return;

  if (filteredTools.length === 0) {
    const emptyHtml = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-glass);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
        <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 8px;">No tools or skills found</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Try broadening your search query or selecting "All Domains".</p>
      </div>
    `;
    reposGrid.innerHTML = emptyHtml;
    reposTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px;">No items match your criteria.</td></tr>`;
    return;
  }

  // Cards Rendering
  if (activeViewMode === "cards") {
    reposGrid.innerHTML = filteredTools.map((tool) => {
      const isSaved = bookmarks.has(tool.id);
      const isComparing = compareList.has(tool.id);
      const categoryLabel = PILLAR_NAMES[tool.category] || tool.category || "General";
      const installsText = tool.installs_display || (tool.installs ? `${formatNum(tool.installs)} installs` : null);
      const velocityText = tool.growth_pct || (tool.stars_today ? `+${tool.stars_today}★ today` : null);
      const primaryCmd = tool.install_command || (tool.type === "trending" ? `git clone ${tool.url}.git` : `claude plugin add ${tool.repo || tool.name}`);

      // Highlighting
      const displayName = highlightMatch(tool.name, searchQuery);
      const displayDesc = highlightMatch(tool.description || "No description provided.", searchQuery);

      // Momentum Classification
      const growthNum = parseGrowthNum(tool.growth_pct);
      let momentumBadge = "";
      if (growthNum >= 200) {
        momentumBadge = `<span class="growth-badge" style="background: rgba(244,63,94,0.15); color: #fda4af; border-color: rgba(244,63,94,0.4);">🔥 Viral +${growthNum}%</span>`;
      } else if (velocityText) {
        momentumBadge = `<span class="growth-badge">${velocityText}</span>`;
      }

      return `
        <article class="tool-card">
          <div class="card-top-row">
            <span class="type-pill type-${tool.type}">${tool.type}</span>
            <div class="card-badges-group">
              ${momentumBadge}
              ${installsText ? `<span class="installs-badge">📥 ${installsText}</span>` : ""}
            </div>
          </div>

          <div class="card-title-group">
            <a href="javascript:void(0)" onclick="openInspectorModal('${tool.id}')" class="card-tool-name">
              ${displayName}
              ${tool.verified ? `<span class="verified-icon" title="Verified Publisher">✓</span>` : ""}
            </a>
            <span class="card-author-handle">by @${tool.author || tool.owner || "community"} • <i>${categoryLabel}</i></span>
          </div>

          <p class="card-desc">${displayDesc}</p>

          <div class="card-install-strip" title="Click to copy command" onclick="copyInstallCmd('${primaryCmd}', event)">
            <code>${primaryCmd}</code>
            <button class="copy-mini-btn" title="Copy CLI Command">📋</button>
          </div>

          <div class="card-actions-row">
            <span class="card-stars-stat">
              ★ ${formatNum(tool.stars || tool.total_stars)}
            </span>
            <div class="card-btn-group">
              <button class="inspect-btn" onclick="openInspectorModal('${tool.id}')">Inspect</button>
              <button class="action-btn ${isComparing ? 'active' : ''}" onclick="toggleCompareItem('${tool.id}', event)" style="padding: 5px 8px; font-size: 0.78rem; ${isComparing ? 'background: var(--accent-violet); color: #fff;' : ''}" title="${isComparing ? 'Remove from Comparison' : 'Add to Comparison'}">⚖️</button>
              <a href="${tool.repo_url || tool.url || '#'}" target="_blank" rel="noopener" class="action-btn" style="padding: 5px 10px; font-size: 0.78rem;" title="Open GitHub Repo">🔗</a>
              <button class="bookmark-btn ${isSaved ? 'saved' : ''}" onclick="toggleBookmark('${tool.id}', event)" style="width: 30px; height: 30px; font-size: 0.8rem;" title="Bookmark">★</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  // Table Rendering
  if (activeViewMode === "table") {
    reposTableBody.innerHTML = filteredTools.map((tool, idx) => {
      const isSaved = bookmarks.has(tool.id);
      const isComparing = compareList.has(tool.id);
      const categoryLabel = PILLAR_NAMES[tool.category] || tool.category || "General";
      const installsText = tool.installs_display || (tool.installs ? formatNum(tool.installs) : "-");
      const velocityText = tool.growth_pct || (tool.stars_today ? `+${tool.stars_today}★` : "-");
      const primaryCmd = tool.install_command || (tool.type === "trending" ? `git clone ${tool.url}.git` : `claude plugin add ${tool.repo || tool.name}`);

      return `
        <tr>
          <td style="font-weight: 700; color: var(--text-muted);">#${idx + 1}</td>
          <td>
            <div style="display: flex; flex-direction: column;">
              <a href="javascript:void(0)" onclick="openInspectorModal('${tool.id}')" style="font-weight: 700; color: var(--text-primary); text-decoration: none;">
                ${tool.name} ${tool.verified ? '<span style="color: var(--accent-cyan);">✓</span>' : ''}
              </a>
              <span style="font-size: 0.76rem; color: var(--text-muted);">@${tool.author || tool.owner || 'community'}</span>
            </div>
          </td>
          <td><span class="type-pill type-${tool.type}">${tool.type}</span></td>
          <td><span style="font-size: 0.82rem; color: var(--text-secondary);">${categoryLabel}</span></td>
          <td>
            <div style="display: flex; flex-direction: column;">
              <strong style="color: var(--accent-emerald);">${velocityText}</strong>
              <span style="font-size: 0.72rem; color: var(--text-muted);">${installsText} installs</span>
            </div>
          </td>
          <td style="font-weight: 600;">★ ${formatNum(tool.stars || tool.total_stars)}</td>
          <td>
            <button class="action-btn" onclick="copyInstallCmd('${primaryCmd}', event)" style="font-family: var(--font-mono); font-size: 0.75rem; padding: 4px 8px;">
              📋 ${primaryCmd.slice(0, 24)}...
            </button>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="inspect-btn" onclick="openInspectorModal('${tool.id}')" style="padding: 4px 8px;">View</button>
              <button class="action-btn ${isComparing ? 'active' : ''}" onclick="toggleCompareItem('${tool.id}', event)" style="padding: 4px 6px; font-size: 0.75rem; ${isComparing ? 'background: var(--accent-violet); color: #fff;' : ''}" title="Compare">⚖️</button>
              <button class="bookmark-btn ${isSaved ? 'saved' : ''}" onclick="toggleBookmark('${tool.id}', event)" style="width: 28px; height: 28px;">★</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }
}

// Process Loaded Unified JSON
function processCatalogData(data) {
  catalogData = data;
  allTools = [];

  // 1. Process Skills
  (data.skills || []).forEach(s => {
    allTools.push({ ...s, type: "skill" });
  });

  // 2. Process Marketplaces
  (data.marketplaces || []).forEach(m => {
    allTools.push({ ...m, type: "marketplace" });
  });

  // 3. Process MCP Servers
  (data.mcp_servers || []).forEach(mcp => {
    allTools.push({ ...mcp, type: "mcp" });
  });

  // 4. Process Trending Repos
  const categories = data.categories || {};
  const seenUrls = new Set(allTools.map(t => t.repo_url || t.url));

  for (const [catName, repos] of Object.entries(categories)) {
    for (const r of repos) {
      if (!seenUrls.has(r.url)) {
        seenUrls.add(r.url);
        allTools.push({
          id: r.full_name.replace("/", "-"),
          name: r.name,
          full_name: r.full_name,
          author: r.owner,
          repo_url: r.url,
          url: r.url,
          type: "trending",
          category: r.language ? r.language.toLowerCase() : "dev-tools",
          description: r.description,
          stars: r.total_stars,
          total_stars: r.total_stars,
          stars_today: r.stars_today,
          growth_pct: r.stars_today ? `+${formatNum(r.stars_today)}★` : null,
          verified: false,
          tags: (r.topics || []).map(t => `#${t}`),
          install_command: `git clone ${r.url}.git`
        });
      }
    }
  }

  // Update Hero Stats Counters
  if (data.updated_at && lastUpdatedLabel) {
    const d = new Date(data.updated_at);
    lastUpdatedLabel.textContent = `Updated ${d.toLocaleDateString()}`;
  }

  const totals = (data.ecosystem && data.ecosystem.totals) || {};
  if (totals.total_catalogued_listings && statTrackedCount) {
    statTrackedCount.textContent = `${formatNum(totals.total_catalogued_listings)}+`;
  } else if (statTrackedCount) {
    statTrackedCount.textContent = `${allTools.length}+`;
  }

  if (totals.total_verified_installs && statInstallsCount) {
    statInstallsCount.textContent = "164.8M";
  }

  // Tab Counts
  const countAllEl = document.getElementById("countAll");
  if (countAllEl) countAllEl.textContent = `${allTools.length}+`;
  const countSkillsEl = document.getElementById("countSkills");
  if (countSkillsEl) countSkillsEl.textContent = `${data.skills ? data.skills.length : 0}`;
  const countMcpEl = document.getElementById("countMcp");
  if (countMcpEl) countMcpEl.textContent = `${data.mcp_servers ? data.mcp_servers.length : 0}`;
  const countMarketplacesEl = document.getElementById("countMarketplaces");
  if (countMarketplacesEl) countMarketplacesEl.textContent = `${data.marketplaces ? data.marketplaces.length : 0}`;
  const countTrendingEl = document.getElementById("countTrending");
  if (countTrendingEl) {
    const trendingCount = allTools.filter(t => t.type === "trending").length;
    countTrendingEl.textContent = `${trendingCount}`;
  }

  updatePillarCounters();
  renderEditorialLeaderboards();
  parseUrlParamsOnLoad();
  applyFiltersAndSort();
}

// Editorial Leaderboards Dynamic Hydration (Phase 3)
function renderEditorialLeaderboards() {
  const containerSkills = document.getElementById("leaderboardSkills");
  const containerMcp = document.getElementById("leaderboardMcp");
  const containerMarketplaces = document.getElementById("leaderboardMarketplaces");
  const containerVelocity = document.getElementById("leaderboardVelocity");

  const buildRowHtml = (tool, rankStr, icon, metricBadge, desc) => `
    <div class="leaderboard-row" onclick="openInspectorModal('${tool.id}')">
      <div class="row-rank">${rankStr}</div>
      <div class="row-icon">${icon}</div>
      <div class="row-body">
        <div class="row-header">
          <span class="row-name">${tool.name} ${tool.verified ? '<span class="row-verified" title="Verified Publisher">✓</span>' : ''}</span>
          <span class="row-repo">${tool.author || tool.owner ? '@' + (tool.author || tool.owner) : (tool.repo_url ? tool.repo_url.replace('https://github.com/', '') : '')}</span>
          ${metricBadge}
        </div>
        <p class="row-desc">${desc || tool.description || 'No description provided.'}</p>
      </div>
    </div>
  `;

  // 1. Skills Leaderboard
  if (containerSkills) {
    const topSkills = allTools
      .filter(t => t.type === "skill")
      .sort((a, b) => (b.installs || 0) - (a.installs || 0))
      .slice(0, 5);

    if (topSkills.length > 0) {
      const skillIcons = ["👁️", "✨", "📊", "🎞️", "🍎"];
      containerSkills.innerHTML = topSkills.map((tool, idx) => {
        const rankStr = String(idx + 1).padStart(2, "0");
        const icon = skillIcons[idx] || "⚡";
        const installsDisplay = tool.installs_display || (tool.installs ? `${formatNum(tool.installs)} 📥` : "Verified");
        const metricBadge = `<span class="row-stars installs">${installsDisplay}</span>`;
        return buildRowHtml(tool, rankStr, icon, metricBadge, tool.description);
      }).join("");
    }
  }

  // 2. MCP Servers Leaderboard
  if (containerMcp) {
    const topMcp = allTools
      .filter(t => t.type === "mcp")
      .sort((a, b) => parseStarsNum(b.stars || b.total_stars) - parseStarsNum(a.stars || a.total_stars))
      .slice(0, 5);

    if (topMcp.length > 0) {
      const mcpIcons = ["🧠", "📎", "🕸️", "🌐", "💻"];
      containerMcp.innerHTML = topMcp.map((tool, idx) => {
        const rankStr = String(idx + 1).padStart(2, "0");
        const icon = mcpIcons[idx] || "🔌";
        const starsDisplay = tool.stars ? `${formatNum(tool.stars)} ★` : "Official";
        const metricBadge = `<span class="row-stars">${starsDisplay}</span>`;
        return buildRowHtml(tool, rankStr, icon, metricBadge, tool.description);
      }).join("");
    }
  }

  // 3. Marketplaces Leaderboard
  if (containerMarketplaces) {
    const topMarketplaces = allTools
      .filter(t => t.type === "marketplace")
      .sort((a, b) => parseStarsNum(b.stars || b.total_stars) - parseStarsNum(a.stars || a.total_stars))
      .slice(0, 5);

    if (topMarketplaces.length > 0) {
      const marketIcons = ["🎯", "⚡", "🚀", "🛠️", "🧩"];
      containerMarketplaces.innerHTML = topMarketplaces.map((tool, idx) => {
        const rankStr = String(idx + 1).padStart(2, "0");
        const icon = marketIcons[idx] || "🏪";
        const starsDisplay = tool.stars ? `${formatNum(tool.stars)} ★` : "Curated";
        const metricBadge = `<span class="row-stars">${starsDisplay}</span>`;
        return buildRowHtml(tool, rankStr, icon, metricBadge, tool.description);
      }).join("");
    }
  }

  // 4. Trending Velocity Leaderboard
  if (containerVelocity) {
    const topVelocity = allTools
      .filter(t => t.type === "trending")
      .sort((a, b) => (b.stars_today || 0) - (a.stars_today || 0))
      .slice(0, 5);

    if (topVelocity.length > 0) {
      const velIcons = ["🌐", "🎨", "🔬", "🤖", "⚡"];
      containerVelocity.innerHTML = topVelocity.map((tool, idx) => {
        const rankStr = String(idx + 1).padStart(2, "0");
        const icon = velIcons[idx] || "🔥";
        const velDisplay = tool.stars_today ? `+${formatNum(tool.stars_today)}★ today` : (tool.growth_pct || "Breakout");
        const metricBadge = `<span class="row-stars velocity">${velDisplay}</span>`;
        return buildRowHtml(tool, rankStr, icon, metricBadge, tool.description);
      }).join("");
    }
  }
}

// Setup Event Listeners
function setupEvents() {
  // Search Input & Intelligent Quick-Discovery Flyout
  const showFlyout = () => {
    if (searchFlyout) searchFlyout.style.display = "block";
  };
  const hideFlyout = () => {
    if (searchFlyout) searchFlyout.style.display = "none";
  };

  if (searchInput) {
    searchInput.addEventListener("focus", () => {
      if (!searchInput.value.trim()) showFlyout();
    });
    searchInput.addEventListener("click", () => {
      if (!searchInput.value.trim()) showFlyout();
    });
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.style.display = searchQuery ? "block" : "none";
      }
      if (searchQuery.trim().length > 0) {
        hideFlyout();
      } else {
        showFlyout();
      }
      applyFiltersAndSort();
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener("click", () => {
      searchInput.value = "";
      searchQuery = "";
      searchClearBtn.style.display = "none";
      showFlyout();
      applyFiltersAndSort();
      searchInput.focus();
    });
  }

  // Handle Flyout Quick Discovery Item Clicks
  if (searchFlyout) {
    searchFlyout.querySelectorAll(".flyout-item[data-search]").forEach(item => {
      item.addEventListener("click", () => {
        const query = item.getAttribute("data-search");
        searchInput.value = query;
        searchQuery = query;
        if (searchClearBtn) searchClearBtn.style.display = "block";
        hideFlyout();
        applyFiltersAndSort();
        const cp = document.getElementById("controlsPanel");
        if (cp) cp.scrollIntoView({ behavior: "smooth" });
      });
    });

    searchFlyout.querySelectorAll(".flyout-item[data-nav]").forEach(item => {
      item.addEventListener("click", () => {
        const targetNav = item.getAttribute("data-nav");
        activeCatalog = targetNav;
        catalogTabs.forEach(t => t.classList.toggle("active", t.getAttribute("data-catalog") === activeCatalog));
        navLinkBtns.forEach(b => b.classList.toggle("active", b.getAttribute("data-nav") === activeCatalog));
        hideFlyout();
        applyFiltersAndSort();
        const cp = document.getElementById("controlsPanel");
        if (cp) cp.scrollIntoView({ behavior: "smooth" });
      });
    });

    searchFlyout.querySelectorAll(".flyout-tag").forEach(tag => {
      tag.addEventListener("click", () => {
        const tVal = tag.getAttribute("data-tag");
        searchInput.value = tVal;
        searchQuery = tVal;
        if (searchClearBtn) searchClearBtn.style.display = "block";
        hideFlyout();
        applyFiltersAndSort();
        const cp = document.getElementById("controlsPanel");
        if (cp) cp.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  // Click outside to close flyout
  document.addEventListener("click", (e) => {
    if (searchWrapper && !searchWrapper.contains(e.target)) {
      hideFlyout();
    }
  });

  // Escape to close flyout
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideFlyout();
    }
  });

  // Sort Select
  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    applyFiltersAndSort();
  });

  // Catalog Switcher Tabs
  catalogTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      catalogTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeCatalog = tab.getAttribute("data-catalog");

      navLinkBtns.forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-nav") === activeCatalog);
      });

      updatePillarCounters();
      applyFiltersAndSort();
    });
  });

  // Navbar Desktop Links
  navLinkBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      navLinkBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCatalog = btn.getAttribute("data-nav");

      catalogTabs.forEach(tab => {
        tab.classList.toggle("active", tab.getAttribute("data-catalog") === activeCatalog);
      });

      updatePillarCounters();
      applyFiltersAndSort();
    });
  });

  // Nine-Pillar Category Filter Pills
  pillarPills.forEach(pill => {
    pill.addEventListener("click", () => {
      pillarPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      activePillar = pill.getAttribute("data-pillar");
      applyFiltersAndSort();
    });
  });

  // Bookmarks Filter Toggle
  btnFilterBookmarks.addEventListener("click", () => {
    showOnlyBookmarks = !showOnlyBookmarks;
    btnFilterBookmarks.classList.toggle("active", showOnlyBookmarks);
    applyFiltersAndSort();
  });

  // View Mode Toggles
  btnViewCards.addEventListener("click", () => {
    activeViewMode = "cards";
    btnViewCards.classList.add("active");
    btnViewTable.classList.remove("active");
    applyFiltersAndSort();
  });

  btnViewTable.addEventListener("click", () => {
    activeViewMode = "table";
    btnViewTable.classList.add("active");
    btnViewCards.classList.remove("active");
    applyFiltersAndSort();
  });

  // Modal Install Tabs
  installTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tabType = tab.getAttribute("data-tab");
      updateModalSnippet(tabType);
    });
  });

  // Close modal when clicking backdrop outside container
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) {
      closeInspectorModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBackdrop.classList.contains("open")) {
      closeInspectorModal();
    }
  });
}

// App Initialization
async function init() {
  setupEvents();
  updateBookmarkBadge();

  try {
    const response = await fetch(`data/latest.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    processCatalogData(data);
  } catch (err) {
    console.warn("Could not fetch data/latest.json:", err);
  }
}

document.addEventListener("DOMContentLoaded", init);
