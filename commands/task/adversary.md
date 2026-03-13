---
description: Activate the adversary red-team task to audit test coverage against PRD acceptance criteria
allowed-tools: Bash, Read
---

# Adversary

**Usage:** `/adversary`

Activate the adversary specialized task. The adversary is a red-team operator that audits test coverage against PRD acceptance criteria.

## Step 1: Activate the Adversary Task

```bash
node ~/.claude/context-curator/dist/scripts/update-import.js adversary
```

If this fails with "Task 'adversary' not found", install.sh has not been run. Ask the user to run `./install.sh` from the context-curator repo.

## Step 2: Confirm Activation

Display to the user:

```
✓ Adversary task activated

STRICT isolation is in effect:
  — No context save or restore
  — Each session starts fresh with no prior knowledge
  — /context-save and /context-list are disabled for this task

Run: /resume <session-id>

Your mission:
  Find failures in test coverage.
  Your success condition: a test that passes when the implementation is wrong.
  Your failure condition: approving something you should have caught.

Produce output to: ./prod-mgmt/test-inventory.md
```

## Step 3: Get a Fresh Session ID

```bash
SESSION_ID=$(node ~/.claude/context-curator/dist/scripts/prepare-context.js adversary 2>/dev/null || node -e "const {randomUUID}=require('crypto');console.log(randomUUID())")
echo "Run: /resume $SESSION_ID"
```

## Important Notes

- The adversary task uses **STRICT isolation** — context save and restore are disabled by design
- Every adversary session must start fresh with no memory of prior runs
- `/context-save` and `/context-list` will return an error when this task is active
- To return to normal work: `/task <your-task-id>`
- The adversary reads the PRD and test plan; it does not read other task contexts
