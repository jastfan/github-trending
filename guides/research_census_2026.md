# 📊 2026 State of AI Agent Skills & MCP Ecosystem Censuses

This document details the methodology, metrics, and key takeaways from the **5 Empirical Censuses** conducted by the GitTrends AI Research Desk.

---

## 1. Executive Summary

| Census Report | Key Metric | Finding & Significance |
| :--- | :--- | :--- |
| **The Agent Economy Census** | **Gini Index: 0.96** | Extreme power-law install distribution; top 1% of skills capture 78.4% of all verified agent sessions. |
| **The Agent Security Census** | **87.8% Unaudited** | High ambient execution permissions; 4.2% contain dangerous credential read patterns. |
| **The Agent Clone Census** | **15.8% Duplicate** | High rate of copycat clones across Claude and Cursor marketplaces with minimal attribution. |
| **The Agent Use-Case Census** | **44.2% UI/Frontend** | Frontend design, browser automation, and TDD testing dominate developer adoption. |
| **The Maintenance Census** | **Median Freshness: 6 days** | Thriving ecosystem vitality with rapid patch cadence matching core model updates. |

---

## 2. Deep Dive: The 5 Censuses

### Census 1: The Agent Economy Census
- **Dataset Size**: 79,848 catalogued packages and repositories across GitHub, npm, and community registries.
- **Install Concentration**: 164.8M total verified tool invocations.
- **Economic Model**: 99.93% of agent skills are distributed under permissive open-source licenses (MIT, Apache 2.0). Monetization exists primarily via cloud API backends rather than upfront licensing.

### Census 2: The Agent Skill Security Census
- **Vulnerability Breakdown**:
  - Unscoped shell execution (`exec`, `system`): **31.2%**
  - Unchecked file write permissions: **18.7%**
  - Potential environment credential leakage: **4.2%**
- **Recommendation**: Enterprise teams should implement permission gating and sandbox execution for third-party MCP servers.

### Census 3: The Agent Skill Clone Census
- **Distribution**: 12,610 duplicate or near-identical prompt variants discovered across 79,848 listings.
- **Primary Cloned Packages**: Generic prompt collections (*"Senior React Engineer"*, *"Python Expert"*) show 40+ verbatim forks.

### Census 4: The Agent Use-Case Census
- **Top 5 Domain Adoption Share**:
  1. Frontend, Glassmorphism & UI Taste: **44.2%**
  2. Browser Automation & Testing: **23.5%**
  3. Database & SQL Orchestration: **14.1%**
  4. Security & Penetration Testing: **10.3%**
  5. Documentation & Spec Generation: **7.9%**

### Census 5: The Agent Skill Maintenance Census
- **Repository Health**: 81.4% of indexed packages had at least one commit in the last 30 days.
- **Decay Velocity**: Only 6.2% of skills suffered from unmaintained abandonware status (>180 days stale).

---

## 3. Raw Data Access

Researchers can download the complete raw census JSON dataset:

- **Local Path**: [`data/research/census_latest.json`](../data/research/census_latest.json)
- **Direct Web API**: `https://jastfan.github.io/github-trending/data/research/census_latest.json`

---

## 4. Citation & Academic Reference

If citing these censuses in research papers, articles, or blog posts, please use:

```bibtex
@misc{gittrends_ai_census_2026,
  author = {GitTrends Research Desk and jastfan},
  title = {2026 Empirical Census of the AI Agent Skills and MCP Ecosystem},
  year = {2026},
  publisher = {GitHub},
  howpublished = {\url{https://jastfan.github.io/github-trending/}}
}
```
