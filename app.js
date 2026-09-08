/**
 * GitTrends & Skillselion Registry — Client Application (v5.0)
 * Handles multi-registry catalogs (Skills, MCP Servers, Marketplaces, Trending),
 * 9-pillar category filtering, real-time search, sorting by installs/velocity,
 * modal deep-dive inspection, 1-click CLI copying, and research censuses.
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

let activeCatalog = "all";       // "all" | "skills" | "mcp" | "marketplaces" | "trending" | "research"
let activePillar = "all";        // "all" | "ai-agents" | "frontend-design" | ...
let searchQuery = "";
let currentSort = "installs";    // "installs" | "growth" | "stars" | "velocity" | "name"
let activeViewMode = "cards";    // "cards" | "table"
let showOnlyBookmarks = false;
let currentInspectedTool = null;

// DOM Cache
const reposGrid = document.getElementById("reposGrid");
const reposTableContainer = document.getElementById("reposTableContainer");
const reposTableBody = document.getElementById("reposTableBody");
const researchSection = document.getElementById("researchSection");
const censusGrid = document.getElementById("censusGrid");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const resultsCount = document.getElementById("resultsCount");
const currentSectionTitle = document.getElementById("currentSectionTitle");
const bookmarkCount = document.getElementById("bookmarkCount");
const btnFilterBookmarks = document.getElementById("btnFilterBookmarks");
const btnViewCards = document.getElementById("btnViewCards");
const btnViewTable = document.getElementById("btnViewTable");
const toast = document.getElementById("appToast");
const toastMsg = document.getElementById("toastMsg");

// Top Ticker / Hero Counters
const statTrackedCount = document.getElementById("statTrackedCount");
const statInstallsCount = document.getElementById("statInstallsCount");
const statMaxVelocity = document.getElementById("statMaxVelocity");
const statTopEcosystem = document.getElementById("statTopEcosystem");
const lastUpdatedLabel = document.getElementById("lastUpdatedLabel");

// Tabs & Filters
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

// Pillar Friendly Mapping
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
  return new Intl.NumberFormat().format(num);
}

function parseGrowthNum(growthStr) {
  if (!growthStr) return 0;
  const cleaned = growthStr.replace(/[^0-9.-]/g, "");
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
  const cmd = "claude mcp add skills -- npx -y skills-mcp";
  navigator.clipboard.writeText(cmd).then(() => {
    showToast("Copied Agent MCP command to clipboard!");
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

  // Default to claude install tab
  updateModalSnippet("claude");
  modalBackdrop.classList.add("open");
};

window.closeInspectorModal = function() {
  modalBackdrop.classList.remove("open");
  currentInspectedTool = null;
};

function updateModalSnippet(tabType) {
  if (!currentInspectedTool) return;
  const tool = currentInspectedTool;
  let snippet = "";

  if (tabType === "claude") {
    snippet = tool.install_command || `claude plugin add ${tool.repo || tool.full_name}`;
  } else if (tabType === "cursor") {
    snippet = tool.cursor_config || `// Add to .cursor/mcp.json\n{\n  "mcpServers": {\n    "${tool.id || tool.name}": {\n      "command": "npx",\n      "args": ["-y", "${tool.id || tool.name}"]\n    }\n  }\n}`;
  } else if (tabType === "raw") {
    snippet = `# Install & Integrate:\n${tool.repo_url || tool.url}\n# Instructions:\n${tool.instructions_preview || tool.description}`;
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
        <div style="margin-top: 6px;">
          <a href="data/research/census_latest.json" target="_blank" class="footer-link" style="font-size: 0.8rem;">
            Download Raw Dataset (.JSON) ↗
          </a>
        </div>
      </div>
    `;
  }).join("");
}

// Export Catalog Data (JSON & CSV)
window.exportCurrentData = function() {
  const exportBlob = new Blob([JSON.stringify(filteredTools, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(exportBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gittrends_catalog_${activeCatalog}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Exported catalog dataset (.json)");
};

// Filter & Sort Pipeline
function applyFiltersAndSort() {
  // If in Research view, we delegate to research renderer
  if (activeCatalog === "research") {
    reposGrid.style.display = "none";
    reposTableContainer.style.display = "none";
    researchSection.style.display = "flex";
    resultsCount.textContent = "5 Empirical Market Censuses & Open Datasets";
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
    const q = searchQuery.toLowerCase();
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
    reposGrid.innerHTML = filteredTools.map((tool, idx) => {
      const isSaved = bookmarks.has(tool.id);
      const categoryLabel = PILLAR_NAMES[tool.category] || tool.category || "General";
      const installsText = tool.installs_display || (tool.installs ? `${formatNum(tool.installs)} installs` : null);
      const velocityText = tool.growth_pct || (tool.stars_today ? `+${tool.stars_today}★ today` : null);
      const primaryCmd = tool.install_command || (tool.type === "trending" ? `git clone ${tool.url}.git` : `claude plugin add ${tool.repo || tool.name}`);

      return `
        <article class="tool-card">
          <div class="card-top-row">
            <span class="type-pill type-${tool.type}">${tool.type}</span>
            <div class="card-badges-group">
              ${velocityText ? `<span class="growth-badge">${velocityText}</span>` : ""}
              ${installsText ? `<span class="installs-badge">📥 ${installsText}</span>` : ""}
            </div>
          </div>

          <div class="card-title-group">
            <a href="javascript:void(0)" onclick="openInspectorModal('${tool.id}')" class="card-tool-name">
              ${tool.name}
              ${tool.verified ? `<span class="verified-icon" title="Verified Publisher">✓</span>` : ""}
            </a>
            <span class="card-author-handle">by @${tool.author || tool.owner || "community"} • <i>${categoryLabel}</i></span>
          </div>

          <p class="card-desc">${tool.description || "No description provided."}</p>

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
  if (data.updated_at) {
    const d = new Date(data.updated_at);
    lastUpdatedLabel.textContent = `Updated ${d.toLocaleDateString()}`;
  }

  const totals = (data.ecosystem && data.ecosystem.totals) || {};
  if (totals.total_catalogued_listings) {
    statTrackedCount.textContent = `${formatNum(totals.total_catalogued_listings)}+`;
  } else {
    statTrackedCount.textContent = `${allTools.length}+`;
  }

  if (totals.total_verified_installs) {
    statInstallsCount.textContent = "164.8M";
  }

  // Tab Counts
  document.getElementById("countAll").textContent = `${allTools.length}+`;
  document.getElementById("countSkills").textContent = `${data.skills ? data.skills.length : 0}`;
  document.getElementById("countMcp").textContent = `${data.mcp_servers ? data.mcp_servers.length : 0}`;
  document.getElementById("countMarketplaces").textContent = `${data.marketplaces ? data.marketplaces.length : 0}`;

  applyFiltersAndSort();
}

// Setup Event Listeners
function setupEvents() {
  // Search Input
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    applyFiltersAndSort();
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

      // Sync navbar desktop link
      navLinkBtns.forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-nav") === activeCatalog);
      });

      applyFiltersAndSort();
    });
  });

  // Navbar Desktop Links
  navLinkBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      navLinkBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCatalog = btn.getAttribute("data-nav");

      // Sync catalog tabs
      catalogTabs.forEach(tab => {
        tab.classList.toggle("active", tab.getAttribute("data-catalog") === activeCatalog);
      });

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
