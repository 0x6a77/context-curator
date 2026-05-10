# Context Curator

Context Curator is a task-based context management system for Claude Code. It solves a specific, expensive problem: losing hard-won Claude understanding when the session compacts.

## The Problem

Working on a large codebase takes hours before Claude really understands the subsystem you're in — the quirky auth flow, the three places state gets stored, the reason the retry logic is unusual. Then auto-compact fires and you start over.

Even with large context windows, this is real. Context quality degrades well before the token ceiling — multi-needle recall drops, suggestions become generic, the "sweet spot" is gone. Developers call this [context rot](glossary.md#context-rot).

## What Context Curator Does

Context Curator gives you five things:

**Tasks** — Focused work environments, each with their own instructions for Claude. Switch between them instantly; Claude loads the right context for the work.

**Contexts** — Named snapshots of warmed-up sessions. Save before compaction, restore on demand — Claude resumes at peak understanding without the warm-up cost.

**Personal by default** — Your contexts stay in your home directory, never committed to git, never visible to teammates.

**Golden contexts** — When a session is genuinely valuable to share, promote it. Golden contexts live in the project repo; any teammate can restore them.

**Hooks** — Automatic protection. A pre-compaction hook saves your session before anything is lost. A post-compaction hook re-injects your task context so work continues without interruption.

## Who This Is For

Context Curator is for developers who use Claude Code on complex, multi-session projects. It works best when:

- You return to the same codebase areas repeatedly
- Warm-up time is measurable (30 minutes or more before Claude is productive)
- You want to share warmed-up understanding with teammates
- You want structure around how you use Claude on a project

## What's in This Documentation

- [Getting Started](getting-started.md) — install, initialize a project, create your first task
- [Managing Contexts](managing-contexts.md) — save, list, promote, and clean up contexts
- [Context Monitoring](context-monitoring.md) — status line, zone warnings, burn rate
- [Security](security.md) — secret scanning before every save, git footprint
- [Hooks and Automation](hooks-automation.md) — automatic pre- and post-compaction protection
- [Skill Marketplace](skill-marketplace.md) — install individual bundles, team manifests
- [Boss-Fight Workflow](boss-fight-workflow.md) — PRD-driven development, adversarial review, process sequencing
- [Reference](reference.md) — CLAUDE.md system internals, cross-platform notes, error handling
- [Glossary](glossary.md) — all terms defined
