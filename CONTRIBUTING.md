# Contributing to GitTrends Intelligence

Thank you for your interest in contributing! We welcome community contributions to help track emerging technologies and improve open-source intelligence.

## How Can You Contribute?

### 1. Suggesting New Languages or Categories
If you would like to track a new programming language (e.g. Kotlin, Swift, Elixir, C#), open an issue or submit a pull request modifying `TRACKED_CATEGORIES` in [`engine.py`](engine.py).

### 2. Enhancing the Web Dashboard
Improvements to `index.html`, `style.css`, and `app.js` (such as new visualizations, charts, or accessibility enhancements) are always welcome.

### 3. Local Development Setup
1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/github-trending-tracker.git
   cd github-trending-tracker
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the intelligence engine:
   ```bash
   python engine.py
   ```
4. Test the web dashboard locally:
   ```bash
   python -m http.server 3000 --bind 127.0.0.1
   ```
   Open `http://localhost:3000` in your browser.

## Code Style & Standards
- Python code should follow PEP 8 standards.
- Keep dependencies minimal and lightweight.
- Ensure all tests pass before submitting a pull request.
