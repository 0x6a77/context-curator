# Development Ideas

This document collects ideas that I would like to add to Context-Curator

## Context Management

### Task-Context Focus

The rough idea is a skill that recursively iterates across each of the source subdirectories and does a thorough analysis of the code in the subdirectory and summarizes that in a SUMMARY.md file in each subdirectory. Then, when we have a refactor task, we can focus Claude Code to just the right source directories. For very large projects and monorepos, this allows us to use the minimum context window to do the work. It's also token efficient in that we maintain hard-won "code understanding" without having to regenerate that for each Claude Code session in the future. This should also allow Claude Code to only pull out the parts of the summary that matter to the task at hand. It would be cool if this summary included an AST analysis with call-site information and other orthographic understanding that will greatly accelerate changes.

### Auto-Restore Baseline Instead of Compact

Motivation: I run `autoCompactWindow` low (150k) on purpose — focused context is more
efficient than a bloated one — but that means native Claude Code auto-compact (generic
LLM summarization) fires often, and every hit is a lossy, expensive re-summarize instead
of a clean reset to a known-good task baseline.

Findings from auditing the current hook wiring (2026-07):

- `prepare-context.js` already does the hard part — it seeds a **new** session file from
  a saved golden/personal context (`.claude/tasks/<id>/contexts/*.jsonl`) and hands back a
  `/resume <id>`. This is the "restore baseline" primitive; it's just manual today.
- `on-compaction.js` / `postcompact-reinject.js` are clearly written for a `PostCompact`
  hook, but `~/.claude/settings.json` only registers `PostToolUse` / `Stop` /
  `SessionStart`. **`PostCompact` isn't wired up at all** — so right now compaction runs
  raw (generic summary) and the reinject step never fires. Fix this regardless of the
  bigger idea below; it's a one-line settings change using code that already exists.
- Just raising `autoCompactWindow` back toward 1M doesn't achieve "restore instead of
  compact" — it only delays when the generic summarizer runs. It's not a substitute for
  the baseline-restore idea.
- Hard constraint: hooks can't swap the *live* transcript mid-session. `update-monitor-state.js`
  can detect crossing the threshold on `PostToolUse`, but nothing in the Claude Code hook
  system can then kill the current turn and splice in a different session file mid-flight.
  Two real options:
  1. **`PreCompact` hook** — can bias what the built-in summarizer preserves (still an LLM
     summary, not a hard reset, but the only in-process lever before compaction runs).
  2. **External supervisor** — a process outside the Claude Code hook system that watches
     `monitor-state.json` (`fillPct` / `currentZone`) and, on crossing threshold, restarts
     the `claude` CLI with `--resume <baseline-session>` via `prepare-context.js`. This is
     really just automating the manual `prepare-context` flow that already exists.

Next steps when I pick this back up: (1) wire `PostCompact` to the existing scripts as a
quick win, (2) prototype the external supervisor since that's the only path to a true
hard reset instead of a re-summarize.

## Code Tasks

### Three-Phase Refactor

I am a huge fan of large refactors — especially in large, legacy systems. The world does not like this. Perhaps I'm a weirdo, but I don't mind mega-extra-double-large refactors if they really move the needle long overdue exorcism of bullshit from the system. At BigCo it's nearly impossible to get out from under the weight of decades of cruft if refactors are a few lines at a time.

OK, fine I get it — this is not a battle I will ever win, but I have a compromise in what I call the "Three-Phase Refactor." You basically break up these refactors into three activities:

#### Rename

In this phase you cannot change the code structurally at all! You can only change the names of things. This is effectively a zero-risk refactor and it can be ENORMOUS without introducing any risk, so these are very easy to review. You only need to argue over the names of things, but the risk is low, so the review's cognitive load is low.

#### Restructure

In this phase all you can do is move things around structurally — you cannot change how things work. No algorithm changes, no logic changes, etc. An example is a function that is way too big. You can break that function up into better or more logical chunks, but you cannot rename anything or change the logic. You can only make pure structural changes. These types of changes introduce modest risks, but they're easier for humans to reason about, and we can safely cover them with integration tests. There can be a lot of changes and primarliy the reviewer can focus on whether the integration test changes really cover the work.

#### Refactor

This is the phase where you're really trying to make the real change. The other two phases were just to get the code into shape for the true refactor. This change is likely small and focused because you already did most of the bulk, mindless code changes in the other two phases. Now the burden on your team members is much lower because there should only be one or two high-risk changes. 

With this process we can make good progress on moving out of the swamp!

## Documentation

### Live Documentation

In PRD-driven development we already generate the user/system documentation every time we update the PRD. So it should be possible to generate the documentation as part of the system under development. That is, whatever documentation we used in the development process becomes a live part of the deployed system. That also means the documentation should be searchable which isn't necessary for the PRD-driven development process. (Tho' maybe it is because we may want a way to share docs with users over the web. TBD)
