# Local Development

## Prerequisites

Install [uv](https://docs.astral.sh/uv/getting-started/installation/):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Setup

From the repository root, create a virtual environment and install dependencies:

```bash
uv sync
```

This reads `pyproject.toml`, creates `.venv/`, and installs `mkdocs-material` and its dependencies. No need to activate the environment manually — prefix commands with `uv run`.

## Serve docs locally

```bash
uv run mkdocs serve
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). The server watches for file changes and reloads automatically.

## Build static site

```bash
uv run mkdocs build
```

Output goes to `site/`. This directory is git-ignored.

## Deploy to GitHub Pages

```bash
uv run mkdocs gh-deploy
```

Builds the site and force-pushes to the `gh-pages` branch. GitHub Pages serves it at `https://0x6a77.github.io/context-curator/`.

## Add to .gitignore

```gitignore
.venv/
site/
```

## Dependency management

Add a new mkdocs plugin:

```bash
uv add mkdocs-some-plugin
```

This updates `pyproject.toml` and `uv.lock`. Commit both files.

Update all dependencies:

```bash
uv sync --upgrade
```
