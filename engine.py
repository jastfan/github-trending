#!/usr/bin/env python3
"""
GitHub Trending Intelligence Engine (v4.0 - Topics Intelligence Edition)
Repository: https://github.com/jastfan/github-trending
Live Web App: https://jastfan.github.io/github-trending/

Key Features:
- Autonomous Multi-Category Scraping with Anti-Blocking & API Fallback
- Deep Tech Topics Extractor (#MCP, #Agent-Skills, #AI-Video, #Coding-Agents, #Local-AI)
- AI & Autonomous Agents Dedicated Spotlight
- High-Resolution OpenGraph Visual Cards & Quick Inspect Dropdowns
- Standard RSS 2.0 Feed Generator for Discord/Slack/Feedly/Telegram
"""

import os
import re
import json
import time
import random
import datetime
from typing import List, Dict, Any, Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup


# Repository Branding
REPO_OWNER = "jastfan"
REPO_NAME = "github-trending"
REPO_FULL_NAME = f"{REPO_OWNER}/{REPO_NAME}"
REPO_URL = f"https://github.com/{REPO_FULL_NAME}"
PAGES_URL = f"https://{REPO_OWNER}.github.io/{REPO_NAME}/"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
]

TRACKED_CATEGORIES = [
    {"id": "overall", "name": "Overall Trending", "icon": "🌐", "url_path": ""},
    {"id": "python", "name": "Python", "icon": "🐍", "url_path": "python"},
    {"id": "javascript", "name": "JavaScript", "icon": "⚡", "url_path": "javascript"},
    {"id": "typescript", "name": "TypeScript", "icon": "🔷", "url_path": "typescript"},
    {"id": "go", "name": "Go", "icon": "🐹", "url_path": "go"},
    {"id": "rust", "name": "Rust", "icon": "🦀", "url_path": "rust"},
]

# Advanced Trend & Topic Taxonomies
TRENDING_TOPICS = {
    "MCP": ["mcp", "model-context-protocol", "blender-mcp"],
    "Agent-Skills": ["skill", "skills", "marketingskills", "humanizer", "instincts"],
    "Coding-Agents": ["claude-code", "codex", "opencode", "cursor", "agent", "agents", "hermes", "ruflo"],
    "AI-Video": ["video", "video-generation", "comfyui", "diffusion", "sora", "kling", "flux", "generative-ai"],
    "Local-AI": ["local-first", "on-device", "ollama", "whisper", "mlx", "offline", "ner"],
    "Autonomous-Finance": ["hedge", "trading", "autohedge", "quant", "financial"],
    "Security": ["penetration", "pentest", "exploit", "cve", "security", "vulnerability", "metatron"],
    "Web3": ["solana", "crypto", "blockchain", "web3", "token"],
}

AI_KEYWORDS = {
    "ai", "llm", "llms", "agent", "agents", "gpt", "model", "models", "rag",
    "openai", "claude", "diffusion", "vision", "neural", "transformer",
    "deep-learning", "machine-learning", "embedding", "ollama", "whisper",
    "autonomous", "prompt", "nlp", "chatbot", "genai", "generative", "mcp", "skill"
}

DATA_DIR = "data"
DAILY_DATA_DIR = os.path.join(DATA_DIR, "daily")
ARCHIVES_DIR = "archives"


def create_resilient_session() -> requests.Session:
    """Create a requests session with exponential backoff and retry logic."""
    session = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=1.5,
        status_forcelist=[429, 500, 502, 503, 504],
        raise_on_status=False
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def clean_text(text: Optional[str]) -> str:
    """Normalize and strip unnecessary whitespace from scraped text."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def parse_stars_today(today_text: str) -> int:
    """Extract integer count of stars gained today from text like '1,234 stars today'."""
    match = re.search(r"([\d,]+)\s+stars?\s+today", today_text, re.IGNORECASE)
    if match:
        return int(match.group(1).replace(",", ""))
    return 0


def extract_topics(name: str, desc: str) -> List[str]:
    """Extract cutting-edge tech topics matching the repository description."""
    combined = f"{name} {desc}".lower()
    matched = []
    for topic, keywords in TRENDING_TOPICS.items():
        if any(kw in combined for kw in keywords):
            matched.append(topic)
    return matched[:3]


def is_ai_related(repo: Dict[str, Any]) -> bool:
    """Classify if a repository is related to AI, LLMs, MCP, or Autonomous Agents."""
    combined_text = f"{repo['name']} {repo['description']}".lower()
    words = set(re.findall(r"\b[a-z0-9\-]+\b", combined_text))
    return bool(words.intersection(AI_KEYWORDS)) or len(repo.get("topics", [])) > 0


def scrape_category(session: requests.Session, category: Dict[str, str]) -> List[Dict[str, Any]]:
    """Scrape GitHub trending page with anti-blocking headers and fallback handling."""
    url = f"https://github.com/trending/{category['url_path']}".rstrip("/")
    print(f"[*] Scraping {category['name']} ({url})...")

    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://github.com/",
        "DNT": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
    }

    try:
        time.sleep(random.uniform(0.4, 0.8))
        response = session.get(url, headers=headers, timeout=15)

        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            items = soup.select("article.Box-row")
            repos = []

            for item in items:
                title_elem = item.select_one("h2 a")
                if not title_elem:
                    continue

                raw_name = clean_text(title_elem.text).replace(" ", "")
                parts = raw_name.split("/")
                owner = parts[0] if len(parts) > 1 else ""
                repo_name = parts[1] if len(parts) > 1 else raw_name
                full_name = f"{owner}/{repo_name}" if owner else repo_name
                repo_url = f"https://github.com/{full_name}"

                desc_elem = item.select_one("p")
                description = clean_text(desc_elem.text) if desc_elem else "No description provided."

                lang_elem = item.select_one("span[itemprop='programmingLanguage']")
                language = clean_text(lang_elem.text) if lang_elem else "Other"

                today_elem = item.select_one("span.d-inline-block.float-sm-right")
                stars_today_raw = clean_text(today_elem.text) if today_elem else "0 stars today"
                stars_today_num = parse_stars_today(stars_today_raw)

                stat_links = item.select("a.Link--muted")
                total_stars = "0"
                total_forks = "0"
                for link in stat_links:
                    href = link.get("href", "")
                    if "stargazers" in href:
                        total_stars = clean_text(link.text)
                    elif "forks" in href or "network/members" in href:
                        total_forks = clean_text(link.text)

                if total_stars == "0" and len(stat_links) >= 1:
                    total_stars = clean_text(stat_links[0].text)
                if total_forks == "0" and len(stat_links) >= 2:
                    total_forks = clean_text(stat_links[1].text)

                built_by = []
                for avatar in item.select("a.d-inline-block img"):
                    built_by.append({
                        "username": avatar.get("alt", "").lstrip("@"),
                        "avatar": avatar.get("src", "")
                    })

                og_image = f"https://opengraph.githubassets.com/1/{full_name}"
                topics = extract_topics(repo_name, description)

                repos.append({
                    "owner": owner,
                    "name": repo_name,
                    "full_name": full_name,
                    "url": repo_url,
                    "og_image": og_image,
                    "description": description,
                    "language": language,
                    "total_stars": total_stars,
                    "total_forks": total_forks,
                    "stars_today_text": stars_today_raw,
                    "stars_today": stars_today_num,
                    "built_by": built_by,
                    "topics": topics,
                })

            print(f"[+] Found {len(repos)} repositories in {category['name']}")
            return repos

        elif response.status_code == 429:
            print(f"[!] Rate-limited (429) for {category['name']}. Triggering backup API fallback...")
            return fetch_github_api_fallback(session, category)
        else:
            print(f"[!] Warning: Status {response.status_code} for {category['name']}.")
            return fetch_github_api_fallback(session, category)

    except Exception as e:
        print(f"[!] Error scraping {category['name']}: {e}. Trying fallback...")
        return fetch_github_api_fallback(session, category)


def fetch_github_api_fallback(session: requests.Session, category: Dict[str, str]) -> List[Dict[str, Any]]:
    """Safe fallback using GitHub Search API if trending page is blocked or down."""
    try:
        yesterday = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
        query = f"created:>{yesterday}"
        if category["url_path"]:
            query += f" language:{category['url_path']}"

        api_url = f"https://api.github.com/search/repositories?q={query}&sort=stars&order=desc&per_page=15"
        headers = {"User-Agent": random.choice(USER_AGENTS), "Accept": "application/vnd.github.v3+json"}

        token = os.getenv("GITHUB_TOKEN")
        if token:
            headers["Authorization"] = f"token {token}"

        res = session.get(api_url, headers=headers, timeout=15)
        if res.status_code == 200:
            data = res.json()
            repos = []
            for item in data.get("items", []):
                full_name = item["full_name"]
                desc = item.get("description") or "No description provided."
                topics = extract_topics(item["name"], desc)
                repos.append({
                    "owner": item["owner"]["login"],
                    "name": item["name"],
                    "full_name": full_name,
                    "url": item["html_url"],
                    "og_image": f"https://opengraph.githubassets.com/1/{full_name}",
                    "description": desc,
                    "language": item.get("language") or "Other",
                    "total_stars": f"{item.get('stargazers_count', 0):,}",
                    "total_forks": f"{item.get('forks_count', 0):,}",
                    "stars_today_text": "API Fallback",
                    "stars_today": 0,
                    "built_by": [{"username": item["owner"]["login"], "avatar": item["owner"].get("avatar_url", "")}],
                    "topics": topics,
                })
            print(f"[+] Fallback retrieved {len(repos)} repositories for {category['name']}")
            return repos
    except Exception as err:
        print(f"[!] Fallback error for {category['name']}: {err}")
    return []


def save_json_data(data: Dict[str, Any], date_str: str):
    """Save structured JSON snapshots preserving GitTrends AI catalog data."""
    os.makedirs(DAILY_DATA_DIR, exist_ok=True)
    daily_file = os.path.join(DAILY_DATA_DIR, f"{date_str}.json")
    with open(daily_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    latest_file = os.path.join(DATA_DIR, "latest.json")
    skills_cat_file = os.path.join(DATA_DIR, "skills", "catalog.json")
    research_file = os.path.join(DATA_DIR, "research", "census_latest.json")

    skills_data = {}
    if os.path.exists(skills_cat_file):
        try:
            with open(skills_cat_file, "r", encoding="utf-8") as f:
                skills_data = json.load(f)
        except Exception:
            pass

    research_data = {}
    if os.path.exists(research_file):
        try:
            with open(research_file, "r", encoding="utf-8") as f:
                research_data = json.load(f)
        except Exception:
            pass

    # Read existing latest.json to preserve extra metadata
    if os.path.exists(latest_file):
        try:
            with open(latest_file, "r", encoding="utf-8") as f:
                existing = json.load(f)
                if "ecosystem" in existing:
                    data["ecosystem"] = existing["ecosystem"]
                if "skills" in existing:
                    data["skills"] = existing["skills"]
                if "marketplaces" in existing:
                    data["marketplaces"] = existing["marketplaces"]
                if "mcp_servers" in existing:
                    data["mcp_servers"] = existing["mcp_servers"]
                if "research" in existing:
                    data["research"] = existing["research"]
        except Exception:
            pass

    if "skills" not in data and "skills" in skills_data:
        data["skills"] = skills_data.get("skills", [])
    if "marketplaces" not in data and "marketplaces" in skills_data:
        data["marketplaces"] = skills_data.get("marketplaces", [])
    if "mcp_servers" not in data and "mcp" in skills_data:
        data["mcp_servers"] = skills_data.get("mcp", [])
    if "research" not in data and research_data:
        data["research"] = research_data

    with open(latest_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def generate_archive_markdown(data: Dict[str, Any], date_str: str):
    """Create clean daily Markdown archive under archives/YYYY-MM/."""
    year_month = date_str[:7]
    month_dir = os.path.join(ARCHIVES_DIR, year_month)
    os.makedirs(month_dir, exist_ok=True)
    archive_file = os.path.join(month_dir, f"{date_str}.md")

    md_lines = [
        f"# 📅 GitHub Trending Intelligence Archive — {date_str}",
        "",
        f"> Generated autonomously at `{data['updated_at']}` UTC for [{REPO_FULL_NAME}]({REPO_URL}).",
        "",
        "---",
        ""
    ]

    for cat in TRACKED_CATEGORIES:
        repos = data["categories"].get(cat["name"], [])
        md_lines.append(f"## {cat['icon']} {cat['name']}")
        md_lines.append("")
        if not repos:
            md_lines.append("_No repositories found for this category today._\n")
            continue

        md_lines.append("| Rank | Repository | Language | Topics | Total Stars | Stars Today | Description |")
        md_lines.append("| :---: | :--- | :---: | :---: | :---: | :---: | :--- |")

        for idx, r in enumerate(repos, 1):
            desc = r['description'].replace("|", "\\|")
            today_badge = f"🔥 +{r['stars_today']:,}" if r['stars_today'] > 0 else "-"
            topics_str = " ".join([f"`#{t}`" for t in r.get("topics", [])]) or "-"
            md_lines.append(
                f"| {idx} | [**{r['full_name']}**]({r['url']}) | `{r['language']}` | {topics_str} | ★ {r['total_stars']} | {today_badge} | {desc} |"
            )
        md_lines.append("")

    with open(archive_file, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))


def generate_readme_dashboard(data: Dict[str, Any], date_str: str):
    """Generate high-aesthetic, visual GitHub README dashboard with AI Spotlight and OpenGraph Cards."""
    all_repos = []
    seen = set()
    language_counts = {}
    ai_repos = []

    for cat_repos in data["categories"].values():
        for r in cat_repos:
            lang = r["language"]
            if lang and lang != "Other":
                language_counts[lang] = language_counts.get(lang, 0) + 1
            if r["full_name"] not in seen:
                seen.add(r["full_name"])
                all_repos.append(r)
                if is_ai_related(r):
                    ai_repos.append(r)

    top_viral = sorted(all_repos, key=lambda x: x["stars_today"], reverse=True)[:5]
    top_ai = sorted(ai_repos, key=lambda x: x["stars_today"], reverse=True)[:6]
    top_lang = max(language_counts, key=language_counts.get) if language_counts else "Python"
    hero_repo = top_viral[0] if top_viral else None

    readme = [
        "<div align=\"center\">",
        "",
        "# ⚡ GitTrends AI — Open Agent Intelligence Registry",
        "",
        "**World-class Swiss Editorial developer registry and empirical research desk for Claude Code skills, MCP servers, and GitHub star velocity intelligence.**",
        "",
        f"[![Live Interactive Web App](https://img.shields.io/badge/Live%20Registry-Explore%20Now-38bdf8?style=for-the-badge&logo=googlechrome)]({PAGES_URL})",
        f"[![npm package](https://img.shields.io/badge/npm-gittrends--mcp%20v5.0.0-cb3837?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/gittrends-mcp)",
        "[![MCP Protocol](https://img.shields.io/badge/MCP%20Server-Official-10b981?style=for-the-badge&logo=anthropic)](guides/mcp_servers_integration.md)",
        "[![Research Censuses](https://img.shields.io/badge/Research%20Censuses-Open%20Data-8b5cf6?style=for-the-badge&logo=arxiv)](data/research/census_latest.json)",
        f"![Auto-Updated](https://img.shields.io/badge/Auto--Updated-2x%20Daily%20({date_str.replace('-', '--')})-2ea44f?style=for-the-badge&logo=github)",
        "![License](https://img.shields.io/badge/License-MIT-bf8700?style=for-the-badge)",
        "",
        f"<sub>⚡ 79,848+ Listings • 164.8M Installs • Auto-updated 2x daily via GitHub Actions • Maintained by [@{REPO_OWNER}]({REPO_URL})</sub>",
        "",
        "<br/>",
        "",
        "```bash",
        "# ⚡ 1-Click Coding Agent Integration (mid-task skill discovery for Claude Code & Cursor)",
        "claude mcp add gittrends -- npx -y gittrends-mcp",
        "```",
        "",
        "<br/>",
        f"<a href=\"{PAGES_URL}\"><img src=\"assets/web-ui-preview.png\" alt=\"GitTrends Intelligence Interactive Web UI Dashboard\" width=\"100%\" style=\"border-radius: 14px; border: 1px solid rgba(255,255,255,0.12);\" /></a>",
        "",
        f"<sub>👉 <b><a href=\"{PAGES_URL}\">Launch the Live Swiss Editorial Registry</a></b> with 4 Numbered Leaderboards, Interactive Inspector, Side-by-Side Comparison Matrix, and Terminal Prompt Simulator.</sub>",
        "",
        "---",
        "",
        "### 🧭 Registry Navigation",
        "",
        f"[`🌐 Live Web App`]({PAGES_URL}) • "
        "[`⚡ Popular Skills`](#-hot-ai-llms-mcp--agent-skills-spotlight) • "
        "[`🔌 MCP Servers`](guides/mcp_servers_integration.md) • "
        "[`📊 Research Censuses`](data/research/census_latest.json) • "
        "[`📚 Developer Guides`](guides/README.md) • "
        "[`📡 RSS Feed`](feed.xml) • "
        "[`🗄️ JSON API`](#-structured-data-access-api)",
        "",
        "<br/>",
        "",
        "<table align=\"center\" width=\"100%\">",
        "  <tr>",
        "    <td align=\"center\" width=\"25%\"><b>🏆 4 Editorial Leaderboards</b><br/><sub>Skills, MCP, Hubs &amp; Velocity</sub></td>",
        "    <td align=\"center\" width=\"25%\"><b>🔌 Native MCP Server</b><br/><sub>5 tools for autonomous agents</sub></td>",
        "    <td align=\"center\" width=\"25%\"><b>📊 Empirical Research Desk</b><br/><sub>5 dated ecosystem censuses</sub></td>",
        "    <td align=\"center\" width=\"25%\"><b>⚡ Live Agent Simulator</b><br/><sub>Terminal prompt testbench</sub></td>",
        "  </tr>",
        "</table>",
        "",
        "</div>",
        "",
        "---",
        ""
    ]

    # Visual Hero Banner Card for the #1 Breakout Repo
    if hero_repo:
        hero_topics = " ".join([f"`#{t}`" for t in hero_repo.get("topics", [])]) or "`#Trending`"
        readme.extend([
            "## 🏆 Today's #1 Trending Breakout Project",
            "",
            f"[![{hero_repo['full_name']}]({hero_repo['og_image']})]({hero_repo['url']})",
            "",
            f"> 💡 **What is it?** [{hero_repo['full_name']}]({hero_repo['url']}) — {hero_repo['description']}",
            f"> 🚀 **Gained today:** **+{hero_repo['stars_today']:,} stars** | **Total Stars:** ★ {hero_repo['total_stars']} | **Topics:** {hero_topics}",
            "",
            "<details>",
            f"<summary><b>👉 Click here for Instant Quick Inspect (Clone command & details)</b></summary>",
            "",
            "```bash",
            f"# Clone this breakout repository directly:",
            f"git clone {hero_repo['url']}.git",
            "```",
            f"- **Repository URL:** [{hero_repo['url']}]({hero_repo['url']})",
            f"- **Owner:** `@{hero_repo['owner']}`",
            "</details>",
            "",
            "---",
            ""
        ])

    # Top 5 Breakouts Table
    readme.extend([
        "## 🔥 Today's Top 5 Breakout Repositories (Viral Momentum)",
        "",
        "> Repositories with the highest star velocity across the entire GitHub ecosystem in the last 24 hours.",
        "",
        "| Rank | Repository | Language | Trending Topics | Stars Today | Total Stars | Description |",
        "| :---: | :--- | :---: | :---: | :---: | :---: | :--- |"
    ])

    for idx, r in enumerate(top_viral, 1):
        desc = r['description'].replace("|", "\\|")
        today_badge = f"🔥 **+{r['stars_today']:,}**" if r['stars_today'] > 0 else "N/A"
        topics_str = " ".join([f"`#{t}`" for t in r.get("topics", [])]) or "-"
        readme.append(
            f"| {idx} | [**{r['full_name']}**]({r['url']}) | `{r['language']}` | {topics_str} | {today_badge} | ★ {r['total_stars']} | {desc} |"
        )

    readme.extend([
        "",
        "---",
        "",
        "## 🤖 Hot AI, LLMs, MCP & Agent Skills Spotlight",
        "",
        "> Curated breakthroughs in Model Context Protocol (MCP), Agentic Frameworks, AI Video Generation, and Local LLMs.",
        "",
        "| Rank | AI Repository | Language | Key Topic | Stars Today | Total Stars | What It Does |",
        "| :---: | :--- | :---: | :---: | :---: | :---: | :--- |"
    ])

    for idx, r in enumerate(top_ai, 1):
        desc = r['description'].replace("|", "\\|")
        today_badge = f"🔥 **+{r['stars_today']:,}**" if r['stars_today'] > 0 else "-"
        topic_tag = f"`#{r['topics'][0]}`" if r.get('topics') else "`#AI`"
        readme.append(
            f"| {idx} | [**{r['full_name']}**]({r['url']}) | `{r['language']}` | {topic_tag} | {today_badge} | ★ {r['total_stars']} | {desc} |"
        )

    readme.extend([
        "",
        "---",
        "",
        "## 📊 Language Category Dashboards",
        ""
    ])

    for cat in TRACKED_CATEGORIES:
        cat_name = cat["name"]
        cat_icon = cat["icon"]
        repos = data["categories"].get(cat_name, [])

        readme.append(f"### {cat_icon} {cat_name}")
        readme.append("")
        if not repos:
            readme.append("_No data available for this category today._\n")
            continue

        readme.append("| # | Repository | Language | Topics | Stars Today | Total Stars | Description |")
        readme.append("| :---: | :--- | :---: | :---: | :---: | :---: | :--- |")

        for idx, r in enumerate(repos[:8], 1):
            desc = r['description'].replace("|", "\\|")
            today_badge = f"**+{r['stars_today']:,}**" if r['stars_today'] > 0 else "-"
            topics_str = " ".join([f"`#{t}`" for t in r.get("topics", [])]) or "-"
            readme.append(
                f"| {idx} | [**{r['full_name']}**]({r['url']}) | `{r['language']}` | {topics_str} | {today_badge} | ★ {r['total_stars']} | {desc} |"
            )

        readme.append("")
        readme.append(f"> 📂 *Explore all {len(repos)} {cat_name} repos in [`archives/{date_str[:7]}/{date_str}.md`](archives/{date_str[:7]}/{date_str}.md)*\n")

    readme.extend([
        "---",
        "",
        "## 🔌 1-Click Coding Agent Integration: `gittrends-mcp`",
        "",
        "Connect Claude Code, Cursor, and Antigravity to the entire GitTrends AI registry mid-task with zero manual downloads.",
        "",
        "### 1. Claude Code",
        "```bash",
        "claude mcp add gittrends -- npx -y gittrends-mcp",
        "```",
        "",
        "### 2. Cursor IDE (`.cursor/mcp.json`)",
        "```json",
        "{",
        '  "mcpServers": {',
        '    "gittrends": {',
        '      "command": "npx",',
        '      "args": ["-y", "gittrends-mcp"]',
        "    }",
        "  }",
        "}",
        "```",
        "",
        "### 3. Antigravity IDE (`mcp_config.json`)",
        "```json",
        "{",
        '  "mcpServers": {',
        '    "gittrends": {',
        '      "command": "npx",',
        '      "args": ["-y", "gittrends-mcp"]',
        "    }",
        "  }",
        "}",
        "```",
        "",
        "### 🛠️ Exposed MCP Tools",
        "1. `find_agent_skills(query, category, limit)`: Query 59k+ categorized skills with 1-click install snippets.",
        "2. `inspect_mcp_servers(query, category, limit)`: Inspect stdio and SSE servers with auto-generated configuration JSON.",
        "3. `get_trending_breakouts(language, min_stars_today, limit)`: Retrieve GitHub breakout repositories with star velocity classification.",
        "4. `get_census_report(census_id)`: Access empirical data on agent skill security, distribution, and code maintenance.",
        "5. `get_ecosystem_stats()`: Macro benchmarks on total listings, installs, and domain leaders.",
        "",
        "---",
        "",
        "## 📊 2026 Empirical Research Censuses",
        "",
        "GitTrends AI indexes the agent ecosystem and runs ongoing empirical research with open datasets free to cite:",
        "",
        "| Census Report | Key Finding | Raw Dataset | Methodology |",
        "| :--- | :--- | :---: | :---: |",
        "| **The Agent Economy Census** | Install Gini 0.96; 0.07% of listings paid | [JSON](data/research/census_latest.json) | [Guide](guides/research_census_2026.md) |",
        "| **The Agent Skill Security Census** | 87.8% of listings never audited; 34% request shell | [JSON](data/research/census_latest.json) | [Guide](guides/research_census_2026.md) |",
        "| **The Agent Skill Clone Census** | 15.8% of all secondary installs land on repackaged copies | [JSON](data/research/census_latest.json) | [Guide](guides/research_census_2026.md) |",
        "| **The Agent Use-Case Census** | Generative media leads at 20.8% of installs | [JSON](data/research/census_latest.json) | [Guide](guides/research_census_2026.md) |",
        "| **The Agent Skill Maintenance Census** | Install-weighted median code age: 6 days | [JSON](data/research/census_latest.json) | [Guide](guides/research_census_2026.md) |",
        "",
        "---",
        "",
        "## 🗄️ Structured Data Access (API)",
        "",
        "Developers can access live tracking data directly via machine-readable JSON or RSS:",
        "",
        "- 🌐 **Live Web Application**: [" + PAGES_URL + "](" + PAGES_URL + ")",
        "- 📡 **Daily RSS 2.0 Feed**: [`feed.xml`](feed.xml)",
        "- 🗄️ **Direct Latest JSON**: [`data/latest.json`](data/latest.json)",
        "- 📊 **Research Censuses JSON**: [`data/research/census_latest.json`](data/research/census_latest.json)",
        "- 📅 **Historical Archives**: Browse [`archives/`](archives/) organized by `YYYY-MM/`",
        "",
        "---",
        "",
        "## ⚙️ How It Works (Zero-Maintenance Automation)",
        "",
        "- **Cloud Scheduled**: GitHub Actions runs automatically in the cloud every 12 hours. Zero manual intervention required.",
        "- **Topic Extraction**: Analyzes repository descriptions against real-time taxonomies (#MCP, #Agent-Skills, #AI-Video, #Local-AI).",
        "- **Anti-Blocking Protocol**: Uses rotating browser headers, connection pooling, and automatic GitHub API fallbacks.",
        "",
        "```bash",
        "# Run locally to generate latest intelligence:",
        "python engine.py",
        "```",
        "",
        "---",
        "",
        "## 📄 License",
        "",
        f"Maintained with ❤️ by [{REPO_OWNER}]({REPO_URL}). Licensed under the [MIT License](LICENSE).",
        ""
    ])

    with open("README.md", "w", encoding="utf-8") as f:
        f.write("\n".join(readme))

    print("[+] Generated ultra-aesthetic, AI-powered README.md dashboard")


def generate_rss_feed(data: Dict[str, Any], date_str: str):
    """Generate standard RSS 2.0 feed for automated subscriptions (Discord/Slack/Feedly/Telegram)."""
    all_repos = []
    seen = set()
    for cat_repos in data["categories"].values():
        for r in cat_repos:
            if r["full_name"] not in seen:
                seen.add(r["full_name"])
                all_repos.append(r)

    top_repos = sorted(all_repos, key=lambda x: x["stars_today"], reverse=True)[:25]
    rfc822_date = datetime.datetime.now(datetime.timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")

    rss_items = []
    for r in top_repos:
        velocity = f"+{r['stars_today']:,} stars today" if r['stars_today'] > 0 else f"{r['total_stars']} stars"
        desc_escaped = (
            r['description']
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
        )
        topics_tag = f"[{', '.join(r.get('topics', []))}]" if r.get("topics") else ""
        title_escaped = f"[{r['language']}] {r['full_name']} {topics_tag} ({velocity})"
        rss_items.append(f"""    <item>
      <title>{title_escaped}</title>
      <link>{r['url']}</link>
      <description>{desc_escaped} | Total Stars: {r['total_stars']}</description>
      <guid isPermaLink="false">{r['full_name']}#{date_str}</guid>
      <pubDate>{rfc822_date}</pubDate>
    </item>""")

    rss_content = f"""<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>GitHub Trending Intelligence Feed ({REPO_FULL_NAME})</title>
    <link>{REPO_URL}</link>
    <description>Autonomous daily tracking of breakout repositories, star velocities, and AI innovations on GitHub.</description>
    <language>en-us</language>
    <lastBuildDate>{rfc822_date}</lastBuildDate>
    <atom:link href="{REPO_URL}/raw/main/feed.xml" rel="self" type="application/rss+xml" />
{chr(10).join(rss_items)}
  </channel>
</rss>
"""

    with open("feed.xml", "w", encoding="utf-8") as f:
        f.write(rss_content)

    print("[+] Generated RSS 2.0 feed: feed.xml")


def main():
    start_time = datetime.datetime.now(datetime.timezone.utc)
    date_str = start_time.strftime("%Y-%m-%d")
    iso_time = start_time.isoformat()

    print(f"=== Starting GitHub Trending Intelligence Engine v4.0 ({date_str}) ===")
    session = create_resilient_session()

    all_data = {
        "updated_at": iso_time,
        "date": date_str,
        "repo": REPO_FULL_NAME,
        "categories": {}
    }

    for cat in TRACKED_CATEGORIES:
        repos = scrape_category(session, cat)
        all_data["categories"][cat["name"]] = repos

    save_json_data(all_data, date_str)
    generate_archive_markdown(all_data, date_str)
    generate_readme_dashboard(all_data, date_str)
    generate_rss_feed(all_data, date_str)

    duration = (datetime.datetime.now(datetime.timezone.utc) - start_time).total_seconds()
    print(f"=== Intelligence Tracker Run Completed in {duration:.2f}s ===")


if __name__ == "__main__":
    main()
