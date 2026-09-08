/**
 * GitHub Trending Intelligence — Client Application (v3.1)
 * Handles data fetching, real-time search, category filtering, velocity filtering,
 * cards vs table view modes, sorting, and bookmarking.
 */

const LANG_COLORS = {
  "Python": "#3572A5",
  "JavaScript": "#f1e05a",
  "TypeScript": "#3178c6",
  "Go": "#00ADD8",
  "Rust": "#dea584",
  "Shell": "#89e051",
  "HTML": "#e34c26",
  "C++": "#f34b7d",
  "C": "#555555",
  "Ruby": "#701516",
  "Java": "#b07219",
  "Kotlin": "#A97BFF",
  "Swift": "#F05138",
  "Other": "#94a3b8"
};

const AI_KEYWORDS = [
  "ai", "llm", "llms", "agent", "agents", "gpt", "model", "models", "rag",
  "openai", "claude", "diffusion", "vision", "neural", "transformer",
  "deep-learning", "machine-learning", "embedding", "ollama", "whisper",
  "autonomous", "prompt", "nlp", "chatbot", "genai", "generative"
];

// App State
let allRepos = [];
let rawCategories = {};
let bookmarks = new Set(JSON.parse(localStorage.getItem("gittrends_bookmarks") || "[]"));
let activeCategory = "all";
let activeVelocity = "all";
let activeTopic = "all";
let activeViewMode = "cards";
let searchQuery = "";
let currentSort = "velocity";

// DOM Elements
const reposGrid = document.getElementById("reposGrid");
const reposTableContainer = document.getElementById("reposTableContainer");
const reposTableBody = document.getElementById("reposTableBody");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const catTabs = document.querySelectorAll(".cat-tab");
const velChips = document.querySelectorAll(".vel-chip");
const topicChips = document.querySelectorAll(".topic-chip");
const btnViewCards = document.getElementById("btnViewCards");
const btnViewTable = document.getElementById("btnViewTable");
const resultsCount = document.getElementById("resultsCount");
const currentSectionTitle = document.getElementById("currentSectionTitle");
const bookmarkCount = document.getElementById("bookmarkCount");
const toast = document.getElementById("appToast");
const toastMsg = document.getElementById("toastMsg");

// Stats Elements
const statTrackedCount = document.getElementById("statTrackedCount");
const statAiCount = document.getElementById("statAiCount");
const statMaxVelocity = document.getElementById("statMaxVelocity");
const statTopLang = document.getElementById("statTopLang");
const lastUpdatedLabel = document.getElementById("lastUpdatedLabel");

// Check if repo is AI related
function isAiRelated(repo) {
  const text = `${repo.name} ${repo.description} ${repo.language}`.toLowerCase();
  return AI_KEYWORDS.some(kw => new RegExp(`\\b${kw}\\b`, "i").test(text));
}

// Format numbers
function formatNum(num) {
  if (typeof num === "string") return num;
  return new Intl.NumberFormat().format(num || 0);
}

// Show Toast Notification
function showToast(message) {
  toastMsg.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

// Copy clone command
function copyCloneCmd(fullName, event) {
  if (event) event.stopPropagation();
  const cmd = `git clone https://github.com/${fullName}.git`;
  navigator.clipboard.writeText(cmd).then(() => {
    showToast(`Copied clone command for ${fullName}!`);
  }).catch(() => {
    showToast(`Command: ${cmd}`);
  });
}

// Toggle Bookmark
function toggleBookmark(fullName, event) {
  if (event) event.stopPropagation();
  if (bookmarks.has(fullName)) {
    bookmarks.delete(fullName);
    showToast(`Removed from bookmarks.`);
  } else {
    bookmarks.add(fullName);
    showToast(`Saved to bookmarks! ⭐`);
  }
  localStorage.setItem("gittrends_bookmarks", JSON.stringify([...bookmarks]));
  updateBookmarkBadge();
  render();
}

function updateBookmarkBadge() {
  bookmarkCount.textContent = bookmarks.size;
}

// Parse integer from string stat (e.g., '14.5k' -> 14500)
function parseStatInt(statStr) {
  if (typeof statStr === "number") return statStr;
  if (!statStr) return 0;
  const clean = statStr.toString().replace(/,/g, "").trim().toLowerCase();
  if (clean.endsWith("k")) {
    return parseFloat(clean) * 1000;
  }
  return parseInt(clean, 10) || 0;
}

// Filter and Sort Repositories
function getFilteredRepos() {
  let list = [];

  if (activeCategory === "all") {
    list = [...allRepos];
  } else if (activeCategory === "ai") {
    list = allRepos.filter(isAiRelated);
  } else if (activeCategory === "bookmarks") {
    list = allRepos.filter(r => bookmarks.has(r.full_name));
  } else {
    const catRepos = rawCategories[activeCategory] || [];
    const catNames = new Set(catRepos.map(r => r.full_name));
    list = allRepos.filter(r => catNames.has(r.full_name));
  }

  // Velocity filter
  if (activeVelocity === "1000") {
    list = list.filter(r => (r.stars_today || 0) >= 1000);
  } else if (activeVelocity === "500") {
    list = list.filter(r => (r.stars_today || 0) >= 500);
  } else if (activeVelocity === "100") {
    list = list.filter(r => (r.stars_today || 0) >= 100);
  }

  // Topic filter
  if (activeTopic !== "all") {
    list = list.filter(r => (r.topics || []).includes(activeTopic));
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(r => 
      r.full_name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.language.toLowerCase().includes(q)
    );
  }

  // Sorting
  list.sort((a, b) => {
    if (currentSort === "velocity") {
      return (b.stars_today || 0) - (a.stars_today || 0);
    }
    if (currentSort === "total_stars") {
      return parseStatInt(b.total_stars) - parseStatInt(a.total_stars);
    }
    if (currentSort === "forks") {
      return parseStatInt(b.total_forks) - parseStatInt(a.total_forks);
    }
    if (currentSort === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return list;
}

// Render Repositories
function render() {
  const filtered = getFilteredRepos();
  resultsCount.textContent = `Showing ${filtered.length} of ${allRepos.length} repositories`;

  if (filtered.length === 0) {
    const emptyHtml = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
        <h3 style="color: var(--text-primary); margin-bottom: 8px;">No matching repositories found</h3>
        <p>Try clearing your search query or selecting a different category/velocity filter.</p>
      </div>
    `;
    reposGrid.innerHTML = emptyHtml;
    reposTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px;">No matching repositories found.</td></tr>`;
    return;
  }

  // Render Grid Cards View
  if (activeViewMode === "cards") {
    reposGrid.style.display = "grid";
    reposTableContainer.style.display = "none";

    reposGrid.innerHTML = filtered.map(repo => {
      const isSaved = bookmarks.has(repo.full_name);
      const langColor = LANG_COLORS[repo.language] || LANG_COLORS["Other"];
      const avatar = (repo.built_by && repo.built_by[0] && repo.built_by[0].avatar) 
        ? repo.built_by[0].avatar 
        : `https://avatars.githubusercontent.com/${repo.owner}?s=80`;
      
      const velocityHtml = (repo.stars_today && repo.stars_today > 0)
        ? `<span class="velocity-badge">🔥 +${formatNum(repo.stars_today)}</span>`
        : "";

      return `
        <article class="repo-card" id="card-${repo.full_name.replace(/[^a-zA-Z0-9]/g, '-')}">
          <div>
            <div class="card-top">
              <div class="repo-header">
                <img src="${avatar}" alt="${repo.owner}" class="owner-avatar" loading="lazy" onerror="this.src='https://github.githubassets.com/favicons/favicon.png'">
                <div class="repo-titles">
                  <a href="https://github.com/${repo.owner}" target="_blank" rel="noopener" class="repo-owner">@${repo.owner}</a>
                  <a href="${repo.url}" target="_blank" rel="noopener" class="repo-name" title="${repo.full_name}">${repo.name}</a>
                </div>
              </div>
              ${velocityHtml}
            </div>

            <p class="repo-desc">${repo.description || "No description provided."}</p>
            ${(repo.topics && repo.topics.length > 0)
              ? `<div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">
                  ${repo.topics.map(t => `<span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: rgba(244,63,94,0.12); color: #fda4af; border: 1px solid rgba(244,63,94,0.3); font-weight: 600;">#${t}</span>`).join("")}
                </div>`
              : ""}
          </div>

          <div>
            <div class="card-metrics">
              <span class="metric-item">
                <span class="lang-dot" style="background-color: ${langColor};"></span>
                <span>${repo.language || "Unknown"}</span>
              </span>
              <span class="metric-item" title="Total Stars">
                <span>★</span>
                <span>${repo.total_stars}</span>
              </span>
              <span class="metric-item" title="Total Forks">
                <span>🍴</span>
                <span>${repo.total_forks}</span>
              </span>
            </div>

            <div class="card-actions">
              <button class="action-btn primary" onclick="copyCloneCmd('${repo.full_name}', event)" title="Copy git clone command">
                <span>📋</span> Copy Clone
              </button>
              <a href="${repo.url}" target="_blank" rel="noopener" class="action-btn" title="Open on GitHub">
                <span>🔗</span> GitHub
              </a>
              <button class="bookmark-btn ${isSaved ? 'saved' : ''}" onclick="toggleBookmark('${repo.full_name}', event)" title="${isSaved ? 'Remove bookmark' : 'Bookmark this repo'}">
                <span>★</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  } else {
    // Render Table View
    reposGrid.style.display = "none";
    reposTableContainer.style.display = "block";

    reposTableBody.innerHTML = filtered.map((repo, idx) => {
      const isSaved = bookmarks.has(repo.full_name);
      const langColor = LANG_COLORS[repo.language] || LANG_COLORS["Other"];
      const velocityText = (repo.stars_today && repo.stars_today > 0)
        ? `<span style="color: #ff7043; font-weight: 700;">🔥 +${formatNum(repo.stars_today)}</span>`
        : `<span style="color: var(--text-muted);">-</span>`;

      return `
        <tr>
          <td style="font-weight: 700; color: var(--text-muted);">${idx + 1}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${(repo.built_by && repo.built_by[0]) ? repo.built_by[0].avatar : 'https://github.githubassets.com/favicons/favicon.png'}" style="width: 24px; height: 24px; border-radius: 50%;" onerror="this.src='https://github.githubassets.com/favicons/favicon.png'">
              <div>
                <a href="${repo.url}" target="_blank" rel="noopener" style="font-weight: 700; color: #fff; text-decoration: none;">${repo.full_name}</a>
                <div style="font-size: 0.8rem; color: var(--text-muted); max-width: 380px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${repo.description || ''}</div>
              </div>
            </div>
          </td>
          <td>
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <span class="lang-dot" style="background-color: ${langColor};"></span>
              ${repo.language || 'Other'}
            </span>
          </td>
          <td>${velocityText}</td>
          <td style="font-weight: 600;">★ ${repo.total_stars}</td>
          <td style="color: var(--text-muted);">🍴 ${repo.total_forks}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="action-btn" onclick="copyCloneCmd('${repo.full_name}', event)" style="padding: 4px 8px; font-size: 0.78rem;" title="Copy Clone">📋</button>
              <a href="${repo.url}" target="_blank" rel="noopener" class="action-btn" style="padding: 4px 8px; font-size: 0.78rem;" title="Open GitHub">🔗</a>
              <button class="bookmark-btn ${isSaved ? 'saved' : ''}" onclick="toggleBookmark('${repo.full_name}', event)" style="width: 28px; height: 28px; font-size: 0.78rem;" title="Bookmark">★</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }
}

// Calculate & Update Dashboard Statistics
function updateStats(data) {
  if (data.updated_at) {
    const d = new Date(data.updated_at);
    lastUpdatedLabel.textContent = `Updated ${d.toLocaleDateString()}`;
  }

  statTrackedCount.textContent = allRepos.length;

  const aiCount = allRepos.filter(isAiRelated).length;
  statAiCount.textContent = aiCount;

  const peak = allRepos.reduce((max, r) => Math.max(max, r.stars_today || 0), 0);
  statMaxVelocity.textContent = peak > 0 ? `+${formatNum(peak)}` : "N/A";

  const langCounts = {};
  allRepos.forEach(r => {
    if (r.language && r.language !== "Other") {
      langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    }
  });

  let topL = "Python";
  let maxL = 0;
  for (const [lang, count] of Object.entries(langCounts)) {
    if (count > maxL) {
      maxL = count;
      topL = lang;
    }
  }
  statTopLang.textContent = topL;
}

// Process Raw Loaded Data
function processData(data) {
  rawCategories = data.categories || {};
  const seen = new Set();
  allRepos = [];

  for (const catRepos of Object.values(rawCategories)) {
    for (const repo of catRepos) {
      if (!seen.has(repo.full_name)) {
        seen.add(repo.full_name);
        allRepos.push(repo);
      }
    }
  }

  updateStats(data);
  render();
}

// Setup Event Listeners
function setupEvents() {
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    render();
  });

  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    render();
  });

  // Category Tabs
  catTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      catTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeCategory = tab.getAttribute("data-cat");

      const icon = tab.querySelector("span")?.textContent || "🌟";
      const text = tab.textContent.replace(icon, "").trim();
      currentSectionTitle.innerHTML = `<span>${icon}</span> ${text}`;

      render();
    });
  });

  // Velocity Chips
  velChips.forEach(chip => {
    chip.addEventListener("click", () => {
      velChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeVelocity = chip.getAttribute("data-vel");
      render();
    });
  });

  // Topic Chips (Hot Tech Topics)
  topicChips.forEach(chip => {
    chip.addEventListener("click", () => {
      topicChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeTopic = chip.getAttribute("data-topic");
      render();
    });
  });

  // View Mode Switcher
  btnViewCards.addEventListener("click", () => {
    btnViewCards.classList.add("active");
    btnViewTable.classList.remove("active");
    activeViewMode = "cards";
    render();
  });

  btnViewTable.addEventListener("click", () => {
    btnViewTable.classList.add("active");
    btnViewCards.classList.remove("active");
    activeViewMode = "table";
    render();
  });
}

// Initialize Application
async function init() {
  setupEvents();
  updateBookmarkBadge();

  try {
    const response = await fetch("data/latest.json");
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    processData(data);
  } catch (err) {
    console.warn("Could not fetch data/latest.json:", err);
  }
}

document.addEventListener("DOMContentLoaded", init);
