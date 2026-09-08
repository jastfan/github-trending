# ⚡ Agent Skills Integration & Authoring Blueprint

This guide details how to discover, consume, and author modular **Agent Skills** compatible with **Claude Code, Cursor, Codex, and Antigravity**.

---

## 1. What is an Agent Skill?

An **Agent Skill** is a self-contained capability package that provides an AI coding agent with domain-specific knowledge, specialized workflows, and procedural instructions on demand.

Instead of stuffing thousands of instructions into system prompts, agent skills rely on **progressive disclosure**:
1. **Metadata Discovery**: The agent inspects the skill title and description frontmatter during planning.
2. **Contextual Activation**: When a relevant task is triggered (e.g., UI redesign, penetration testing, database optimization), the agent views the full `SKILL.md`.
3. **Execution**: The agent adheres to the proven conventions and rules without polluting irrelevant context windows.

---

## 2. Directory Structure of an Agent Skill

Every production agent skill adheres to the open standard:

```text
skills/
└── apple-design-system/
    ├── SKILL.md            # Required: Main instruction blueprint with YAML frontmatter
    ├── scripts/            # Optional: Shell, Python, or Node scripts invoked by the agent
    │   └── audit_contrast.py
    ├── templates/          # Optional: Reusable code templates or CSS snippets
    │   └── glassmorphism.css
    └── references/         # Optional: Deep architectural references or API specs
        └── HIG_typography.md
```

---

## 3. The `SKILL.md` Specification

A compliant `SKILL.md` contains strict YAML frontmatter followed by markdown instructions:

```markdown
---
name: apple-design-system
description: Implements Apple Human Interface Guidelines with San Francisco typography, Cupertino glassmorphism, and smooth spring physics.
category: frontend-design
author: community
verified: true
version: 1.2.0
---

# Apple Design System & Human Interface Guidelines

## Principles
- **Clarity**: Uncompromising typographic hierarchy with subtle border delineation.
- **Deference**: Fluid glassmorphic surfaces (`backdrop-filter: blur(20px)`) that adapt to wallpaper glow.
- **Depth**: Multi-layered shadows (`0 8px 32px rgba(0,0,0,0.35)`).

## Color Tokens
```css
:root {
  --apple-bg: rgba(18, 18, 24, 0.85);
  --apple-blur: 24px;
  --apple-accent: #0071e3;
  --apple-text: #f5f5f7;
}
```

## Agent Action Rules
1. Never use plain generic primary colors.
2. Always apply smooth cubic-bezier transitions (`0.16, 1, 0.3, 1`).
```

---

## 4. Installing Skills Across Harnesses

### A. Claude Code CLI
Claude Code plugins and skills can be installed directly from GitHub repositories:
```bash
# Install individual skill repository
claude plugin add affaan-m/ECC

# Or install from curated marketplace
claude plugin add obra/superpowers
```

### B. Antigravity IDE
Place skills directly into your project's customizations directory:
```bash
mkdir -p .agents/skills/apple-design-system
# Copy SKILL.md into the directory
```
Antigravity automatically discovers all skills in `.agents/skills/` and activates them on demand.

### C. Cursor IDE
For Cursor, skills are typically declared as system rules or project prompts in `.cursorrules` or `.cursor/rules/*.mdc`.

---

## 5. The 9-Pillar Domain Taxonomy

The GitTrends & Skillselion registry categorizes all skills into 9 domain pillars:

1. 🤖 **`ai-agents`**: LLM orchestration, multi-agent frameworks, RAG workflows.
2. 🎨 **`frontend-design`**: UI/UX taste engines, design systems, Tailwind/CSS mastery.
3. 🗄️ **`backend-data`**: PostgreSQL, Redis, vector databases, microservices.
4. 🛠️ **`dev-tools`**: Git harnesses, terminal TUIs, linters, scaffolding.
5. ⚡ **`automation`**: Browser agents, web scrapers, workflow automators.
6. 🧪 **`testing-review`**: TDD red-green cycles, static analysis, unit test generators.
7. 🛡️ **`security`**: Threat modeling, vulnerability scanning, permission audits.
8. ☁️ **`monitoring-cloud`**: Docker, Kubernetes, AWS, observability, metrics.
9. 📝 **`docs-planning`**: Spec generation, PRDs, API schemas, markdown synthesis.

---

## 6. Token Efficiency Tips: "The Caveman Rule"

As highlighted in the trending repository [`JuliusBrussee/caveman`](https://github.com/JuliusBrussee/caveman):
- Agents often waste up to 65% of tokens in conversational filler (*"Sure! I'd be happy to help you with that. Here is the code..."*).
- Skills should instruct the agent to **cut conversational filler** and output direct code or surgical diffs immediately.
