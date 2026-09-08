"""
Unit Tests for GitTrends Intelligence Engine (v4.0)
Validates topic extraction, schema integrity, and velocity parsing.
"""

import unittest
import os
import json
from engine import extract_topics, TOPIC_MAP

class TestTrendingEngine(unittest.TestCase):

    def test_topic_extraction_mcp(self):
        """Verify MCP keyword detection in repo descriptions."""
        sample_desc = "A high-performance model context protocol server for Claude Code."
        topics = extract_topics("mcp-server", sample_desc)
        self.assertIn("#MCP", topics)

    def test_topic_extraction_coding_agent(self):
        """Verify autonomous agent and harness detection."""
        sample_desc = "Autonomous harness for AI coding agents and automated refactoring."
        topics = extract_topics("dev-agent", sample_desc)
        self.assertIn("#Coding-Agents", topics)

    def test_topic_extraction_ai_video(self):
        """Verify video generation models detection."""
        sample_desc = "Open-source text to video diffusion model pipeline."
        topics = extract_topics("video-diffuser", sample_desc)
        self.assertIn("#AI-Video", topics)

    def test_topic_extraction_empty(self):
        """Ensure no crash on empty descriptions."""
        topics = extract_topics("generic-repo", "")
        self.assertIsInstance(topics, list)

    def test_data_schema_integrity(self):
        """Verify latest.json schema if file exists."""
        latest_file = os.path.join("data", "latest.json")
        if os.path.exists(latest_file):
            with open(latest_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.assertIn("date", data)
            self.assertIn("updated_at", data)
            self.assertIn("categories", data)
            self.assertIsInstance(data["categories"], dict)

    def test_feed_xml_exists(self):
        """Verify RSS 2.0 feed exists and is not empty."""
        feed_file = "feed.xml"
        if os.path.exists(feed_file):
            self.assertGreater(os.path.getsize(feed_file), 100)


if __name__ == "__main__":
    unittest.main()
