# Table of Contents

## Context Curator Documentation

### [Introduction](introduction.md)

The core idea and why it matters in the AI era.

## Getting Started

### [Getting Started](getting-started.md)

Install Context Curator, initialize a project, and save your first context.

- Installation
- Initializing a project with `/task-init`
- Creating and naming tasks with `/task`
- Switching between tasks
- Saving a context with `/context-save`
- Restoring with `/resume`

## Using Context Curator

### [Managing Contexts](managing-contexts.md)

Save named snapshots of warmed-up sessions, restore them on demand, and keep your context library tidy.

- Saving personal contexts
- Listing contexts with `/context-list`
- AI-generated summaries
- Managing your context library (rename, archive, delete)
- Storage locations

### [Context Monitoring](context-monitoring.md)

Track session health in real time and know when to save before compaction hits.

- The three context zones (Healthy, Degrading, Critical)
- The status line and its fields
- Warm-up baseline calibration
- Zone warnings
- Burn rate and cost estimation

### [Hooks and Automation](hooks-automation.md)

Automatic session protection that fires before and after every compaction event.

- PreCompact auto-save hook
- PostCompact task re-injection hook
- Hook registration

## Going Deeper

### [For Teams](for-teams.md)

Share warmed-up contexts with teammates, set up project-scope install, and publish team skill bundles.

- Golden contexts — promoting a personal context for team use
- Project-scope install — commit skills so teammates get them automatically
- Selective bundle install
- Team manifests
- Sandbox configuration

### [Security](security.md)

Secret detection before every golden save, and a git footprint that never creates merge conflicts.

- What gets detected (AWS keys, tokens, passwords, private keys)
- When scanning happens
- Redaction workflow
- What commits vs. what stays local

### [Reference](reference.md)

The CLAUDE.md two-file system, cross-platform notes, and error handling.

- The two-file CLAUDE.md system
- Cross-platform compatibility (macOS, Linux, WSL2)
- Error handling behavior
- Complete directory reference

## PRD-Driven Development

### [PRD-Driven Development](boss-fight-workflow.md)

PRD-driven development with adversarial review — a governance framework for
AI-generated software. Code generation is the last step, not the first.

- The artifact triad (PRD → test plan → dev plan)
- User documentation as a feedback mechanism (Phase 1a)
- The adversary task and what it produces
- Process sequencing with `/prd-process`
- Risk acceptances

### [Glossary](glossary.md)

Definitions for every significant term.

### [Permuted Index](permuted-index.md)

Every significant term rotated to the front for multi-angle lookup.
