---
name: docs-brief
description: >
  Design brief for Context Curator documentation. Defines the core message,
  reader journey gates, navigation architecture, and editorial rules that
  guide /docs-markdown and /docs-html generation. The feature routing table
  at the bottom replaces docs/feature-section-map.md.
---

# Documentation Brief: Context Curator

## Core Message

Working with AI feels fast but stays expensive. Every session starts cold —
Claude doesn't know your codebase, your constraints, your reasoning from last
week. You spend the first hour rebuilding understanding you already had. Then
the session compacts and you start over.

Context Curator changes one thing: accumulated understanding doesn't have to
be disposable. You save it, name it, restore it, give it to a teammate. The
session that took two hours to warm up becomes the starting point for every
session after it.

That's the whole idea. Everything else in these docs is elaboration.

---

## The Bigger Claim

*Position this section on the Introduction page only, after the core message.
It is for readers who want to understand why this project exists beyond their
own productivity. Do not repeat it on any other page.*

We are at the beginning of a transition. Code generation is no longer the
bottleneck in software development — AI handles most of it. The new
bottlenecks are:

1. **Accumulated understanding** — does anyone, human or AI, deeply know
   this codebase?
2. **Quality without a reviewer** — when AI writes the code, who challenges
   it honestly?
3. **Knowledge transfer** — how do you share what AI has learned with the
   rest of the team?

Traditional software practices were designed for a world where humans wrote
code slowly and reviewed each other's work continuously. That world is
changing faster than the practices are.

Context Curator is infrastructure for the world that's coming: AI
understanding that persists, transfers across a team, and is governed by a
review process that doesn't share the constructor's blind spots.

---

## Reader Journey Gates

Each gate defines a reader's state, what they need to learn, and what to
hide. The docs skill generates content and navigation depth appropriate to
each gate. A feature's gate determines how prominently it surfaces — not just
which page it lands on.

### Gate 0 — Before Reading

**Reader state:** Knows Claude Code. Has felt the friction of losing context
warmth. Has not yet named the problem or found a systematic solution.

**What we must accomplish:** Name their pain clearly enough that they
recognize it in the first paragraph. Deliver the core insight immediately.
Don't make them read anything before they can take the first action.

---

### Gate 1 — The Insight (target: 5 minutes)

**Reader state:** Just arrived. Curious. Possibly skeptical.

**What they learn:**
- Sessions warm up; warmth is expensive and currently disposable
- Four commands: `/task-init`, `/task`, `/context-save`, `/resume`
- They can try it today

**What is hidden at this gate:**
Hooks, monitoring, golden contexts, boss-fight workflow, skill marketplace,
security internals, sandbox config, container-use setup — anything that does
not help them take the first action.

**Exit condition:** They understand what the tool does and want to try it.
They leave the Introduction page with the four commands and a clear next step.

---

### Gate 2 — First Week Solo (target: 30 minutes total reading)

**Reader state:** Has tried or is actively using the tool solo. Wants to use
it well.

**What they learn:**
- **Tasks:** focused environments with their own instructions for Claude
- **Contexts:** named saved sessions; personal by default; never committed
  to git
- **Hooks:** automatic save before compaction fires — they don't have to
  remember
- **Monitoring:** the status line shows fill level and zone; zone warnings
  tell them when quality is degrading and it's time to save

**What is hidden at this gate:**
Team workflows, golden contexts, context promotion, boss-fight, adversary
task, PRD methodology, skill marketplace, security details

**Exit condition:** Working solo setup. At least one saved context. Hooks
are protecting them automatically. They know when to save without having to
think about it.

---

### Gate 3 — Bringing in the Team

**Reader state:** Using the tool solo successfully. Has something worth
sharing with teammates, or wants teammates on the same footing.

**What they learn:**
- **Golden contexts:** promote a personal context so teammates can restore it
- **Project-scope install:** commit the skill set; teammates get it
  automatically with no global install required
- **Security:** what commits, what stays local, why personal contexts never
  touch git
- **Skill bundles:** how teams share a curated set of skills via manifests

**What is hidden at this gate:**
Boss-fight, adversary task, PRD-driven development methodology

**Exit condition:** A second developer can restore a warmed-up context in
under five minutes. The team has a shared starting point.

---

### Gate 4 — Governing AI Work

*This gate is a separate documentation section. It does not appear in the
primary navigation. Readers arrive here by choice, not by default. Most
readers will never reach it — that is by design.*

**Reader state:** Comfortable with the tool. Wants governance over
AI-generated work, not just productivity.

**The framing shift:** Gates 1–3 document using the tool. Gate 4 documents
a methodology that the tool supports. The audience is developers who want
structured quality assurance over AI-generated code.

**What they learn:**
- **The problem:** standard code review catches bugs but misses coverage
  gaps — AI doesn't know what it doesn't know about its own output
- **Boss-Fight Coding:** a governance process borrowed from financial
  services LoD2 assurance — an isolated adversary reviews tests against
  acceptance criteria with no knowledge of the constructor's intent;
  structural independence enforced by hooks, not by instruction
- **PRD-driven development:** requirements → user docs → test plan →
  dev plan → adversary → implementation; code generation is the last
  step, not the first
- **Process sequencing:** the `/prd-process` skill enforces phase order
  and warns when the adversary's test inventory is stale before
  implementation continues
- **Risk acceptances:** the documented governance record for findings that
  cannot be automatically verified

**Exit condition:** A team has a complete governance framework for
AI-generated software with documented risk acceptances for anything the
automated adversary cannot verify.

---

## Navigation Architecture

The docs skill must generate navigation that reflects these tiers exactly.
Primary nav is what every reader encounters. Secondary nav is visible but
not the main path. Separate section has its own nav tier and is not mixed
with usage pages. Footer links appear on every page but not in the nav.

### Primary Navigation (Gates 1–2)

1. Introduction
2. Getting Started
3. Managing Contexts
4. Context Monitoring
5. Hooks and Automation

### Secondary Navigation (Gate 3 + Reference)

6. For Teams *(golden contexts + project-scope install + skill bundles)*
7. Security
8. Reference *(CLAUDE.md internals, cross-platform, error handling)*

### Separate Section (Gate 4 — own nav tier)

9. Boss-Fight Workflow

### Footer Only (not in nav)

- Glossary *(linked from first use in text on each page)*
- Permuted Index *(linked from Glossary)*

---

## Editorial Rules

### Always

- Lead with the problem before the solution on every page
- Let heading hierarchy create visual separation — never use `---` horizontal rule dividers between sections
- Show the command before explaining what it does
- End every Gate 1–2 page with a "you now have everything you need for [X]"
  sentence and links to the next gate — not links to every other page
- Link every glossary term on its first occurrence in each page
- Use relative links so docs work from the filesystem without a server

### Never in Primary-Tier Pages (Gates 1–2)

- Mention Boss-Fight Workflow or the adversary task — not even in passing
- Use F-XXX codes (spec language, not user language)
- Explain the CLAUDE.md two-file system (that belongs in Reference)
- List every feature on a page — list only the features the reader at this
  gate needs
- Mix optional setup (sandbox config, container-use, WSL2 notes) into the
  main flow — these belong in a callout at the bottom of Getting Started or
  in Reference

### Progressive Disclosure Rule

If removing something from a page would make a first-time reader's life
easier without making an experienced reader's life harder, remove it from
the page body and link to it from a "Going deeper" section at the bottom.

### The Bigger Claim

Appears on the Introduction page only, after the core message. Never
summarize or reference it elsewhere in the primary nav pages. Readers who
want it will find it; readers who don't won't be slowed by it.

---

## Feature Routing

*Derived from gate assignments above. This table replaces
`docs/feature-section-map.md`. When a new F-XXX feature ships, assign it a
gate first; the page and nav tier follow from that decision.*

| Feature        | Gate | Page                | Nav Tier  |
|----------------|------|---------------------|-----------|
| F-INIT         | 1    | Getting Started     | Primary   |
| F-TASK-CREATE  | 1–2  | Getting Started     | Primary   |
| F-TASK-SWITCH  | 2    | Getting Started     | Primary   |
| F-CTX-SAVE     | 2    | Managing Contexts   | Primary   |
| F-CTX-LIST     | 2    | Managing Contexts   | Primary   |
| F-SUMMARY      | 2    | Managing Contexts   | Primary   |
| F-CTX-MONITOR  | 2    | Context Monitoring  | Primary   |
| F-HOOK         | 2    | Hooks & Automation  | Primary   |
| F-HOOK-POST    | 2    | Hooks & Automation  | Primary   |
| F-CTX-PROMOTE  | 3    | For Teams           | Secondary |
| F-CTX-MANAGE   | 3    | For Teams           | Secondary |
| F-MARKETPLACE  | 3    | For Teams           | Secondary |
| F-SEC          | 3    | Security            | Secondary |
| F-GIT          | 3    | Security            | Secondary |
| F-CLMD         | ref  | Reference           | Secondary |
| F-XPLAT        | ref  | Reference           | Secondary |
| F-ERR          | ref  | Reference           | Secondary |
| F-SPEC         | 4    | Boss-Fight Workflow | Separate  |
| F-ADVERSARY    | 4    | Boss-Fight Workflow | Separate  |
| F-PRD          | 4    | Boss-Fight Workflow | Separate  |
| F-DOC-SKILLS   | 4    | Boss-Fight Workflow | Separate  |
| F-DOC          | 4    | Boss-Fight Workflow | Separate  |
| F-PROCESS      | 4    | Boss-Fight Workflow | Separate  |
