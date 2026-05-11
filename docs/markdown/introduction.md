# Context Curator

Working with AI feels fast but stays expensive. Every session starts cold —
Claude doesn't know your codebase, your constraints, your reasoning from last
week. You spend the first hour rebuilding understanding you already had. Then
the session compacts and you start over.

Context Curator changes one thing: accumulated understanding doesn't have to
be disposable. You save it, name it, restore it, give it to a teammate. The
session that took two hours to warm up becomes the starting point for every
session after it.

## The Four Commands

```bash
/task-init          # set up a project (once)
/task <name>        # switch to a focused task environment
/context-save <name>  # bottle the current session's understanding
/resume <uuid>      # restore it — Claude picks up at peak understanding
```

That's the whole tool. Everything else is depth on top of these four.

→ [Getting Started](getting-started.md) — install, first task, first save

---

## Why This Matters

*For readers who want the larger context.*

We are at the beginning of a transition. Code generation is no longer the
bottleneck in software development — AI handles most of it. The new
bottlenecks are harder to see:

**Accumulated understanding.** A codebase's complexity lives in the subtle
things — the quirky auth flow, the three places state gets stored, the reason
the retry logic is unusual. That understanding takes time to build. When AI
builds it, the session is the only place it lives. When the session ends, it's
gone.

**Quality without a reviewer.** Standard code review catches bugs. It misses
coverage gaps — the cases the AI didn't think to test because it doesn't know
what it doesn't know about its own output. You need a reviewer who genuinely
doesn't share your blind spots.

**Knowledge transfer.** When one developer has a deeply warmed-up session and
another starts cold, they're not working from the same understanding. There's
no good way to share what AI has learned with the rest of the team.

Context Curator is infrastructure for the world that's coming: AI
understanding that persists, transfers across a team, and is governed by a
review process that doesn't share the constructor's blind spots.

- **Tasks and contexts** solve accumulated understanding — save warmth, share
  it, restore it on demand
- **Hooks and monitoring** solve continuity — automatic protection before
  compaction fires, status line shows when quality is degrading
- **Boss-Fight Coding** solves quality without a reviewer — structural
  adversarial review borrowed from financial services governance

You don't need all of this on day one. [Getting Started](getting-started.md)
covers what you need for the first week.
