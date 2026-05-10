# Table of Contents

## Context Curator Documentation

---

### [Introduction](introduction.md)

What Context Curator does, the problem it solves, and who it's for.

---

### [Getting Started](getting-started.md)

Install Context Curator, initialize a project, create your first task, and switch between tasks.

- Installation
- Initializing a project with `/task-init`
- Creating and naming tasks
- Switching tasks with `/task`
- The default task
- Task ID rules

---

### [Managing Contexts](managing-contexts.md)

Save named snapshots of warmed-up sessions, restore them on demand, and share the best ones with your team.

- Saving personal contexts with `/context-save`
- Saving golden contexts with `/context-save --golden`
- Listing contexts with `/context-list`
- AI-generated summaries
- Promoting to golden with `/context-promote`
- Managing contexts with `/context-manage`
- Storage locations

---

### [Context Monitoring](context-monitoring.md)

Track session health in real time and know when to save before compaction hits.

- The three context zones (Healthy, Degrading, Critical)
- The status line and its fields
- Warm-up baseline calibration
- Zone warnings
- Burn rate and cost estimation
- Monitor configuration
- How the monitor works

---

### [Workflows](workflows.md)

Common usage patterns: solo developer loop, team golden context sharing, handling interruptions, returning to default, and native Claude Code commands.

- Solo developer loop
- Team collaboration with golden contexts
- Handling interruptions without losing context
- Returning to the default task
- Native Claude Code commands (`/fork`, `/rewind`, `/rename`, `/compact`, `/context`)

---

### [Hooks and Automation](hooks-automation.md)

Automatic session protection that fires before and after every compaction event.

- PreCompact auto-save hook
- PostCompact task re-injection hook
- Hook registration
- When hooks are and aren't enough

---

### [Security](security.md)

Secret detection before every golden save, and a git footprint that never creates merge conflicts.

- What gets detected (AWS keys, Stripe keys, GitHub tokens, RSA keys, generic passwords)
- When scanning happens
- Redaction workflow
- What gets committed vs. what stays local
- No git conflicts

---

### [Skill Marketplace](skill-marketplace.md)

Install only the bundles you need, or publish your own team bundles alongside Context Curator's.

- Available bundles: `authoring`, `session`, `monitor`, `full`
- Installing a specific bundle
- Browsing available bundles
- Manifest format and version verification
- Team manifests
- User-scope vs. project-scope skills

---

### [Boss-Fight Workflow](boss-fight-workflow.md)

PRD-driven development with an adversarial review phase that prevents tests from vacuously passing.

- Document authoring skills (`/prd`, `/test-plan`, `/dev-plan`, `/test-inventory`)
- User documentation generation (`/docs-markdown`, `/docs-html`)
- The full process flow (Phases 1–8)
- The adversary task and what it produces
- Risk acceptances
- Process sequencing with `/prd-process`
- The specialized task framework

---

### [Reference](reference.md)

The CLAUDE.md two-file system, `/resume` re-read behavior, cross-platform compatibility, and error handling.

- The two-file CLAUDE.md system
- How `/resume` re-reads CLAUDE.md
- Cross-platform compatibility (macOS, Linux, WSL2)
- Error handling behavior
- Complete directory reference table

---

### [Glossary](glossary.md)

Definitions for every significant term used in Context Curator documentation.

*adversary task · auto-save · boss fight · bundle · compaction · context · context rot · context zone · default task · dev plan · feature-section map · golden context · hook · manifest · monitor · personal context · permuted index · PRD · re-injection · risk acceptance · session · skill · status line · task · task DNA · test inventory · test plan · warm-up · warm-up baseline*

---

### [Permuted Index](permuted-index.md)

Every significant term rotated to the front for multi-angle lookup.
