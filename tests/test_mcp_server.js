const assert = require("assert");
const { TOOLS, handleToolCall, loadCatalog } = require("../bin/cli.js");

async function runTests() {
  console.log("=== GitTrends MCP Server Test Suite ===");

  // 1. Test Tools list schema
  console.log("1. Verifying TOOLS schema...");
  assert.strictEqual(TOOLS.length, 5, "Should expose 5 MCP tools");
  const toolNames = TOOLS.map(t => t.name);
  assert(toolNames.includes("find_agent_skills"), "Should include find_agent_skills");
  assert(toolNames.includes("inspect_mcp_servers"), "Should include inspect_mcp_servers");
  assert(toolNames.includes("get_trending_breakouts"), "Should include get_trending_breakouts");
  assert(toolNames.includes("get_census_report"), "Should include get_census_report");
  assert(toolNames.includes("get_ecosystem_stats"), "Should include get_ecosystem_stats");
  console.log("   ✓ Tool definitions validated");

  // 2. Test Catalog loading
  console.log("2. Testing loadCatalog()...");
  const catalog = await loadCatalog();
  assert(Array.isArray(catalog.skills), "Catalog skills should be array");
  assert(catalog.skills.length >= 10, "Should have indexed skills");
  console.log(`   ✓ Catalog loaded with ${catalog.skills.length} skills, ${catalog.mcp_servers.length} MCPs`);

  // 3. Test find_agent_skills
  console.log("3. Testing find_agent_skills tool call...");
  const skillRes = await handleToolCall("find_agent_skills", { query: "design", limit: 5 });
  assert(skillRes && skillRes.content && skillRes.content[0], "Result should have content block");
  const skillData = JSON.parse(skillRes.content[0].text);
  assert(skillData.returned > 0, "Should find at least 1 design skill");
  assert(skillData.skills[0].name.toLowerCase().includes("design"), "Matched skill should contain design");
  console.log(`   ✓ Found ${skillData.total_matched} design skills (returned ${skillData.returned})`);

  // 4. Test inspect_mcp_servers
  console.log("4. Testing inspect_mcp_servers tool call...");
  const mcpRes = await handleToolCall("inspect_mcp_servers", { query: "context", limit: 5 });
  const mcpData = JSON.parse(mcpRes.content[0].text);
  assert(mcpData.returned > 0, "Should find at least 1 context MCP server");
  assert(mcpData.mcp_servers[0].install_command || mcpData.mcp_servers[0].cursor_config, "Should provide install command or cursor config");
  console.log(`   ✓ Found ${mcpData.returned} MCP servers with configurations`);

  // 5. Test get_trending_breakouts
  console.log("5. Testing get_trending_breakouts tool call...");
  const trendRes = await handleToolCall("get_trending_breakouts", { min_stars_today: 40, limit: 5 });
  const trendData = JSON.parse(trendRes.content[0].text);
  assert(trendData.returned > 0, "Should return trending breakout repositories");
  assert(trendData.trending_repos[0].stars_today >= 40, "Should honor min_stars_today filter");
  console.log(`   ✓ Returned ${trendData.returned} breakouts with stars_today >= 40`);

  // 6. Test get_census_report
  console.log("6. Testing get_census_report tool call...");
  const censusRes = await handleToolCall("get_census_report", { census_id: "security" });
  const censusData = JSON.parse(censusRes.content[0].text);
  assert(censusData.reports.length > 0, "Should return security census");
  assert(censusData.reports[0].id.includes("security") || censusData.reports[0].title.toLowerCase().includes("security"), "Should match security report");
  console.log(`   ✓ Verified research census report: "${censusData.reports[0].title}"`);

  // 7. Test get_ecosystem_stats
  console.log("7. Testing get_ecosystem_stats tool call...");
  const ecoRes = await handleToolCall("get_ecosystem_stats", {});
  const ecoData = JSON.parse(ecoRes.content[0].text);
  assert(ecoData.totals, "Should have ecosystem totals");
  console.log(`   ✓ Ecosystem stats verified (server: ${ecoData.server})`);

  // 8. Test error handling for unknown tool
  console.log("8. Testing unknown tool error rejection...");
  let errored = false;
  try {
    await handleToolCall("non_existent_tool", {});
  } catch (e) {
    errored = true;
  }
  assert(errored, "Unknown tool should throw an error");
  console.log("   ✓ Unknown tool correctly threw error");

  console.log("\n===========================================");
  console.log("🎉 ALL 8 MCP SERVER TESTS PASSED PERFECTLY!");
  console.log("===========================================\n");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
