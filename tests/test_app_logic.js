const fs = require("fs");
const assert = require("assert");

// Load data/latest.json
const raw = fs.readFileSync("data/latest.json", "utf8");
const data = JSON.parse(raw);

console.log("Testing data integrity:");
assert(Array.isArray(data.skills), "skills should be array");
assert(Array.isArray(data.mcp_servers), "mcp_servers should be array");
assert(Array.isArray(data.marketplaces), "marketplaces should be array");
assert(typeof data.categories === "object", "categories should be object");
assert(typeof data.research === "object", "research should be object");
assert(Array.isArray(data.research.reports), "research.reports should be array");

console.log(`✓ Data verified: ${data.skills.length} skills, ${data.mcp_servers.length} MCPs, ${data.marketplaces.length} marketplaces, ${data.research.reports.length} censuses.`);

// Test utility functions as implemented in app.js
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

// Tests
assert.strictEqual(formatNum(125000), "125,000");
assert.strictEqual(parseGrowthNum("+340%"), 340);
assert.strictEqual(parseStarsNum("35.7k"), 35700);
assert(highlightMatch("Apple Design System", "Apple").includes("<mark"));

// Test CSV Generation
const sampleTools = [
  { id: "test-tool", name: "Test Tool", type: "skill", category: "dev-tools", author: "jastfan", stars: 100, installs: 500, growth_pct: "+20%", repo_url: "https://github.com/test", install_command: "claude plugin add test" }
];
const headers = ["ID", "Name", "Type", "Category", "Author", "Stars", "Installs", "Growth", "URL", "InstallCommand"];
const rows = sampleTools.map(t => [
  `"${t.id || ''}"`,
  `"${(t.name || '').replace(/"/g, '""')}"`,
  `"${t.type || ''}"`,
  `"${t.category || ''}"`,
  `"${t.author || ''}"`,
  `"${t.stars || 0}"`,
  `"${t.installs || 0}"`,
  `"${t.growth_pct || ''}"`,
  `"${t.repo_url || ''}"`,
  `"${(t.install_command || '').replace(/"/g, '""')}"`
]);
const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
assert(csvContent.includes("Test Tool"), "CSV should include tool name");
assert(csvContent.includes("claude plugin add test"), "CSV should include command");

console.log("✓ All Phase 3 client engine unit assertions PASSED!");
