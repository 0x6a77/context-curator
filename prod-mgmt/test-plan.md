# Context Curator Integration Test Plan

**Version:** 1.0  
**Last Updated:** January 18, 2026  
**Purpose:** Detailed integration test specifications for context-curator

---

## Testing Philosophy

This test plan focuses on **integration tests** that validate real-world usage patterns. Each test:

- Tests complete user workflows, not isolated functions
- Has deterministic, reproducible outcomes
- Validates task appropriateness, not code structure
- Can be automated with clear pass/fail criteria
- Runs in isolation without dependencies on other tests

**Test Organization:**
- Tests grouped by feature/command
- Each test has: setup, execution steps, validation criteria
- Shared test fixtures and utilities where appropriate
- Clear documentation of test data requirements


---

## Test Quality Rules

These rules are mandatory. A test that violates them is considered a failing test regardless of whether its assertions pass.

### Banned Patterns

The following patterns are banned from all test files:

1. **Vacuous OR fallbacks** — `|| output.includes('context')`, `|| result.exitCode === 0`, `|| /\d+/.test(output)`, `|| typeof x === 'number'`. These convert meaningful checks into tautologies.

2. **Conditional file-existence guards** — `if (fileExists(path)) { expect(...) }`. Replace with: `expect(fileExists(path)).toBe(true)` then assert contents.

3. **Tautological type assertions** — `typeof x === 'number'` when x is always a number. Assert a specific value or range.

4. **Placeholder assertions** — `expect(true).toBe(true)`. Delete them or replace with a real check.

5. **Self-fulfilling setup** — Creating the file the test then checks for in `beforeEach`. The script under test must create it.

6. **Broad digit regex** — `/\d+/.test(output)` when a specific count is known. Use `new RegExp(\`\\\\b${count}\\\\b\`).test(output)`.

7. **Missing exit code assertion** — Success tests must assert `exitCode === 0`. Error tests must assert `exitCode !== 0`. Skipping is banned.

### Fix Priority Tiers

Fixes are prioritized by effort:

**Tier 1 — Immediate (<1hr each, fix first):**
- Replace `expect(true).toBe(true)` placeholders
- Fix inverted boolean logic
- Replace `typeof exitCode === 'number'` with specific values
- Remove self-fulfilling backup creation from test setup

**Tier 2 — Strengthen assertions (1-2hr each):**
- Remove all OR escape hatches from existing assertions
- Replace `if (fileExists)` guards with unconditional assertions
- Replace broad regex (`/\d+/`) with specific patterns

**Tier 3 — Add unconditional file existence checks:**
- Any test that checks file contents must first assert the file exists unconditionally

**Tier 4 — Add missing tests (new test cases):**
- 100KB golden context size cap
- Overwrite protection with backup verification
- PreCompact hook auto-save
- MEMORY.md update after save
- Golden context deletion protection
- No-contexts → fresh start offer
- All 3 message types scanned for secrets
- Redaction + rescan workflow
- Exact secret count assertion

**Tier 5 — Architectural (git integration tests):**
- Use real git repo with bare remote for pull simulation
- Use `git check-ignore` for gitignore verification

---

## Test Environment Setup

### Prerequisites

```bash
# Required tools
- Claude Code CLI
- git (for git integration tests)
- jq (for JSON validation)
- Python 3.8+ (for test runner)
- bash 4.0+ or zsh

# Test directory structure
test-projects/
├── fixtures/              # Reusable test data
│   ├── sample-contexts/   # Pre-built .jsonl contexts
│   ├── sample-secrets/    # Contexts with known secrets
│   └── sample-projects/   # Template projects
├── tmp/                   # Temporary test workspaces
└── results/               # Test outputs and logs
```

### Test Utilities

```python
# test_utils.py - Common test helpers

import json
import subprocess
import os
from pathlib import Path
import tempfile
import shutil

class ContextCuratorTestCase:
    """Base class for integration tests"""
    
    def setUp(self):
        """Create isolated test environment"""
        self.test_dir = tempfile.mkdtemp(prefix="cc-test-")
        self.project_dir = Path(self.test_dir) / "test-project"
        self.project_dir.mkdir()
        os.chdir(self.project_dir)
        
    def tearDown(self):
        """Clean up test environment"""
        os.chdir("/")
        shutil.rmtree(self.test_dir)
    
    def run_command(self, command: str) -> dict:
        """Execute Claude Code command and capture output"""
        result = subprocess.run(
            ["claude", "-c", command],
            capture_output=True,
            text=True,
            cwd=self.project_dir
        )
        return {
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        }
    
    def verify_file_exists(self, path: str) -> bool:
        """Check if file exists at path"""
        return (self.project_dir / path).exists()
    
    def verify_file_content(self, path: str, expected: str) -> bool:
        """Verify file contains expected content"""
        content = (self.project_dir / path).read_text()
        return expected in content
    
    def verify_jsonl(self, path: str) -> bool:
        """Validate JSONL file format"""
        try:
            with open(self.project_dir / path) as f:
                for line in f:
                    json.loads(line)  # Each line must be valid JSON
            return True
        except json.JSONDecodeError:
            return False
    
    def verify_git_ignored(self, path: str) -> bool:
        """Check if file is git-ignored"""
        result = subprocess.run(
            ["git", "check-ignore", path],
            cwd=self.project_dir,
            capture_output=True
        )
        return result.returncode == 0
    
    def create_test_context(self, messages: list) -> str:
        """Create a .jsonl context file from messages"""
        content = "\n".join(json.dumps(msg) for msg in messages)
        return content
```

---

## Feature Test Groups

## 1. Project Initialization Tests · F-INIT

**Acceptance Criteria:**

| AC ID | Criterion |
|-------|-----------|
| T-INIT-1 | `init-project` creates `.claude/CLAUDE.md` containing an `@import` line; the file must not exist before the script runs |
| T-INIT-2 | `init-project` copies root `CLAUDE.md` byte-for-byte to the stash path; backup must not exist before script runs (not created in test setup) |
| T-INIT-3 | `.claude/tasks/default/CLAUDE.md` content equals root `CLAUDE.md` character-for-character |
| T-INIT-4 | Running `init-project` twice exits 0 both times and produces identical file contents |
| T-INIT-5 | Writing a file to project A's personal dir does not make it visible in project B's personal dir |

### Test 1.1: Initialize Fresh Project (No CLAUDE.md)

**Setup:**
```bash
mkdir test-project && cd test-project
# No CLAUDE.md exists
```

**Execution:**
```bash
claude
> /task-init
```

**Validation:**
```python
def test_init_fresh_project():
    # Verify directory structure
    assert verify_file_exists(".claude/")
    assert verify_file_exists(".claude/.gitignore")
    assert verify_file_exists(".claude/tasks/default/CLAUDE.md")
    
    # Verify .gitignore content
    assert verify_file_content(".claude/.gitignore", "CLAUDE.md")
    
    # Verify backup created
    home_backup = Path.home() / ".claude/projects" / sanitize_path(project_dir) / ".stash/original-CLAUDE.md"
    assert not home_backup.exists()  # No backup when no original CLAUDE.md
    
    # Verify git ignore works
    assert verify_git_ignored(".claude/CLAUDE.md")
```

**Expected Output:**
```
✓ Created .claude/ directory
✓ Created .claude/.gitignore
✓ Created default task
✓ Project initialized successfully
```

---

### Test 1.2: Initialize Project with Existing CLAUDE.md

**Setup:**
```bash
mkdir test-project && cd test-project
echo "# My Project Instructions" > CLAUDE.md
echo "Use Python 3.11 for all scripts" >> CLAUDE.md
```

**Execution:**
```bash
claude
> /task-init
```

**Validation:**
```python
def test_init_with_claude_md():
    # Verify root CLAUDE.md unchanged
    root_content = Path("CLAUDE.md").read_text()
    assert "My Project Instructions" in root_content
    assert "Use Python 3.11" in root_content
    
    # Verify backup created
    home_backup = Path.home() / ".claude/projects" / sanitize_path(project_dir) / ".stash/original-CLAUDE.md"
    assert home_backup.exists()
    backup_content = home_backup.read_text()
    assert backup_content == root_content
    
    # Verify default task has copy
    default_content = Path(".claude/tasks/default/CLAUDE.md").read_text()
    assert default_content == root_content
    
    # Verify .claude/CLAUDE.md created with import
    working_content = Path(".claude/CLAUDE.md").read_text()
    assert "@import ./tasks/default/CLAUDE.md" in working_content
```

---

### Test 1.3: Initialize Project Twice (Idempotent)

**Setup:**
```bash
mkdir test-project && cd test-project
echo "# Instructions" > CLAUDE.md
```

**Execution:**
```bash
claude
> /task-init
> /task-init  # Run again
```

**Validation:**
```python
def test_init_idempotent():
    # First init should succeed
    result1 = run_command("/task-init")
    assert result1["returncode"] == 0
    
    # Second init should not error
    result2 = run_command("/task-init")
    assert result2["returncode"] == 0
    assert "already initialized" in result2["stdout"].lower()
    
    # Verify no duplicate directories or files
    assert len(list(Path(".claude/tasks/").iterdir())) == 1  # Only default
    
    # Verify only one backup
    backup_dir = Path.home() / ".claude/projects" / sanitize_path(project_dir) / ".stash"
    backups = list(backup_dir.glob("original-CLAUDE.md*"))
    assert len(backups) == 1
```

---

### Test 1.4: Initialize with Existing .claude/ Directory

**Setup:**
```bash
mkdir test-project && cd test-project
mkdir .claude
echo "existing content" > .claude/existing-file.txt
```

**Execution:**
```bash
claude
> /task-init
```

**Validation:**
```python
def test_init_preserves_existing():
    # Verify existing content preserved
    assert verify_file_exists(".claude/existing-file.txt")
    assert verify_file_content(".claude/existing-file.txt", "existing content")
    
    # Verify new initialization happened
    assert verify_file_exists(".claude/.gitignore")
    assert verify_file_exists(".claude/tasks/default/CLAUDE.md")
```

---

## 2. Task Creation Tests · F-TASK-CREATE

### Test 2.1: Create New Task with Valid Name

**Setup:**
```bash
cd test-project  # Already initialized
```

**Execution:**
```bash
claude
> /task oauth-refactor
What should this task focus on? > Refactoring OAuth implementation in src/auth/
```

**Validation:**
```python
def test_create_task_valid():
    # Verify task directories created
    assert verify_file_exists(".claude/tasks/oauth-refactor/")
    assert verify_file_exists(".claude/tasks/oauth-refactor/CLAUDE.md")
    assert verify_file_exists(".claude/tasks/oauth-refactor/README.md")
    assert verify_file_exists(".claude/tasks/oauth-refactor/contexts/")
    
    # Verify task CLAUDE.md has description
    task_md = Path(".claude/tasks/oauth-refactor/CLAUDE.md").read_text()
    assert "OAuth" in task_md
    assert "src/auth" in task_md
    
    # Verify README.md has metadata
    readme = Path(".claude/tasks/oauth-refactor/README.md").read_text()
    assert "oauth-refactor" in readme
    assert "Refactoring OAuth" in readme
    
    # Verify .claude/CLAUDE.md updated
    working_md = Path(".claude/CLAUDE.md").read_text()
    assert "@import ./tasks/oauth-refactor/CLAUDE.md" in working_md
    
    # Verify personal task directory created
    personal_task = Path.home() / ".claude/projects" / sanitize_path(project_dir) / "tasks/oauth-refactor"
    assert personal_task.exists()
    assert (personal_task / "contexts").exists()
    
    # Verify output includes resume instruction
    assert "Run: /resume sess-" in result["stdout"]
```

**Expected Output:**
```
What should this task focus on?
> Refactoring OAuth implementation in src/auth/

✓ Created task: oauth-refactor
✓ Location: ./.claude/tasks/oauth-refactor/

Run: /resume sess-abc123

Your focus:
  Refactoring OAuth implementation in src/auth/
```

---

### Test 2.2: Create Task with Invalid Name

**Setup:**
```bash
cd test-project
```

**Execution:**
```bash
claude
> /task OAuth Refactor  # Spaces and uppercase
```

**Validation:**
```python
def test_create_task_invalid_name():
    result = run_command("/task 'OAuth Refactor'")
    
    # Verify error message
    assert result["returncode"] != 0
    assert "invalid" in result["stderr"].lower() or "invalid" in result["stdout"].lower()
    assert "alphanumeric" in result["stdout"].lower() or "hyphens" in result["stdout"].lower()
    
    # Verify no directory created
    assert not verify_file_exists(".claude/tasks/OAuth Refactor/")
    assert not verify_file_exists(".claude/tasks/oauth refactor/")
```

**Expected Output:**
```
Error: Invalid task ID 'OAuth Refactor'
Task IDs must contain only lowercase letters, numbers, and hyphens
Examples: oauth-refactor, payment-integration, bug-fix-123
```

---

### Test 2.3: Create Task with Multi-line Description

**Setup:**
```bash
cd test-project
```

**Execution:**
```bash
claude
> /task complex-refactor
What should this task focus on? > This is a complex refactor involving:
- OAuth 2.0 migration
- Session state cleanup
- Token refresh logic
```

**Validation:**
```python
def test_create_task_multiline_description():
    # Verify all description lines captured
    task_md = Path(".claude/tasks/complex-refactor/CLAUDE.md").read_text()
    assert "OAuth 2.0 migration" in task_md
    assert "Session state cleanup" in task_md
    assert "Token refresh logic" in task_md
```

---

### Test 2.4: Create Task with Empty Description

**Setup:**
```bash
cd test-project
```

**Execution:**
```bash
claude
> /task minimal-task
What should this task focus on? > [press enter]
```

**Validation:**
```python
def test_create_task_empty_description():
    # Verify task created with generic description
    task_md = Path(".claude/tasks/minimal-task/CLAUDE.md").read_text()
    assert len(task_md) > 0  # Should have some default content
    
    # Should still be functional
    assert verify_file_exists(".claude/tasks/minimal-task/contexts/")
```

---

## 3. Task Switching Tests · F-TASK-SWITCH

### Test 3.1: Switch to Task with Personal Contexts Only

**Setup:**
```bash
cd test-project
# Create task and save personal context
claude > /task auth-work
> What should this task focus on? > Authentication work
[do some work...]
> /context-save my-progress
> Save as golden? > n
```

**Execution:**
```bash
claude
> /task auth-work
```

**Validation:**
```python
def test_switch_with_personal_contexts():
    result = run_command("/task auth-work")
    
    # Verify context listing shown
    assert "Personal contexts:" in result["stdout"]
    assert "my-progress" in result["stdout"]
    assert "msgs" in result["stdout"]  # Message count shown
    
    # Verify golden contexts section empty or not shown
    assert "Golden contexts" not in result["stdout"] or \
           "No golden contexts" in result["stdout"]
    
    # Verify prompt for selection
    assert "Choice" in result["stdout"] or "Select" in result["stdout"]
```

**Expected Output:**
```
Which context to load?

Personal contexts:
1. my-progress (12 msgs) - 2026-01-18
   Summary: Initial auth flow implementation

Choice (or enter for default): 
```

---

### Test 3.2: Switch to Task with Golden Contexts Only

**Setup:**
```bash
cd test-project
# Create task and save golden context
claude > /task oauth-work
> /context-save oauth-deep-dive
> Save as golden? > y
```

**Execution:**
```bash
# Simulate teammate loading task
claude
> /task oauth-work
```

**Validation:**
```python
def test_switch_with_golden_contexts():
    result = run_command("/task oauth-work")
    
    # Verify golden contexts shown
    assert "Golden contexts" in result["stdout"]
    assert "oauth-deep-dive" in result["stdout"]
    assert "⭐" in result["stdout"] or "golden" in result["stdout"].lower()
    
    # Verify author shown (if available)
    # Note: May be "unknown" if author not set
```

**Expected Output:**
```
Which context to load?

Golden contexts (team shared):
1. oauth-deep-dive (47 msgs) - 2026-01-15 - by: alice ⭐
   Summary: Complete OAuth flow analysis with session state deep-dive

Choice (or enter for default): 
```

---

### Test 3.3: Switch to Task with Mixed Contexts

**Setup:**
```bash
cd test-project
# Create personal contexts
claude > /task mixed-work
> /context-save personal-1
> Save as golden? > n
> /context-save personal-2
> Save as golden? > n

# Create golden context
> /context-save golden-1
> Save as golden? > y
```

**Execution:**
```bash
claude
> /task mixed-work
```

**Validation:**
```python
def test_switch_with_mixed_contexts():
    result = run_command("/task mixed-work")
    
    # Verify both sections shown
    assert "Personal contexts:" in result["stdout"]
    assert "Golden contexts" in result["stdout"]
    
    # Verify all contexts listed
    assert "personal-1" in result["stdout"]
    assert "personal-2" in result["stdout"]
    assert "golden-1" in result["stdout"]
    
    # Verify grouping (personal first, then golden)
    personal_idx = result["stdout"].find("personal-1")
    golden_idx = result["stdout"].find("golden-1")
    assert personal_idx < golden_idx
```

---

### Test 3.4: Switch to Task with No Contexts

**Setup:**
```bash
cd test-project
# Create task but save no contexts
claude > /task empty-task
```

**Execution:**
```bash
claude
> /task empty-task
```

**Validation:**
```python
def test_switch_with_no_contexts():
    result = run_command("/task empty-task")
    
    # Verify friendly message
    assert "no contexts" in result["stdout"].lower() or \
           "start fresh" in result["stdout"].lower()
    
    # Verify task still switches
    working_md = Path(".claude/CLAUDE.md").read_text()
    assert "@import ./tasks/empty-task/CLAUDE.md" in working_md
```

**Expected Output:**
```
No contexts found for task 'empty-task'

✓ Task: empty-task
✓ Starting fresh

Run: /resume sess-new123
```

---

### Test 3.5: Switch to Default Task

**Setup:**
```bash
cd test-project
# Currently on some task
claude > /task oauth-work
```

**Execution:**
```bash
claude
> /task default
```

**Validation:**
```python
def test_switch_to_default():
    result = run_command("/task default")
    
    # Verify .claude/CLAUDE.md imports default
    working_md = Path(".claude/CLAUDE.md").read_text()
    assert "@import ./tasks/default/CLAUDE.md" in working_md
    
    # Verify message indicates vanilla mode
    assert "default" in result["stdout"].lower() or \
           "vanilla" in result["stdout"].lower()
```

**Expected Output:**
```
✓ Task: default
✓ Restored to vanilla project context

Run: /resume sess-new123
```

---

### Test 3.6: Multiple Task Switches

**Setup:**
```bash
cd test-project
claude > /task task-a
> /task task-b
> /task task-c
> /task task-a  # Back to task-a
```

**Validation:**
```python
def test_multiple_task_switches():
    # Each switch should update .claude/CLAUDE.md
    
    run_command("/task task-a")
    assert verify_file_content(".claude/CLAUDE.md", "@import ./tasks/task-a/CLAUDE.md")
    
    run_command("/task task-b")
    assert verify_file_content(".claude/CLAUDE.md", "@import ./tasks/task-b/CLAUDE.md")
    assert not verify_file_content(".claude/CLAUDE.md", "task-a")
    
    run_command("/task task-c")
    assert verify_file_content(".claude/CLAUDE.md", "@import ./tasks/task-c/CLAUDE.md")
    
    run_command("/task task-a")
    assert verify_file_content(".claude/CLAUDE.md", "@import ./tasks/task-a/CLAUDE.md")
```

---

## 4. Context Saving Tests · F-CTX-SAVE

### Test 4.1: Save Personal Context with Valid Name

**Setup:**
```bash
cd test-project
claude > /task save-test
[have conversation with 10 messages]
```

**Execution:**
```bash
> /context-save my-work
Save as golden? > n
```

**Validation:**
```python
def test_save_personal_context():
    # Verify file created in personal storage
    personal_path = Path.home() / ".claude/projects" / sanitize_path(project_dir) / \
                    "tasks/save-test/contexts/my-work.jsonl"
    assert personal_path.exists()
    
    # Verify JSONL format
    assert verify_jsonl(personal_path)
    
    # Verify metadata file created
    metadata_path = personal_path.with_suffix(".meta.json")
    assert metadata_path.exists()
    
    metadata = json.loads(metadata_path.read_text())
    assert metadata["name"] == "my-work"
    assert metadata["type"] == "personal"
    assert "timestamp" in metadata
    assert "message_count" in metadata
    assert metadata["message_count"] == 10
    assert "summary" in metadata
    
    # Verify NOT in project .claude/ directory
    project_context = Path(".claude/tasks/save-test/contexts/my-work.jsonl")
    assert not project_context.exists()
```

**Expected Output:**
```
✓ Generating summary...
✓ Saved context: my-work (10 msgs)
✓ Location: ~/.claude/projects/.../tasks/save-test/contexts/my-work.jsonl
✓ Type: Personal
```

---

### Test 4.2: Save Golden Context (After Secret Scan)

**Setup:**
```bash
cd test-project
claude > /task golden-test
[have conversation with 15 messages, no secrets]
```

**Execution:**
```bash
> /context-save team-knowledge
Save as golden? > y
```

**Validation:**
```python
def test_save_golden_context():
    # Verify secret scan ran
    # (Check logs or output for scan messages)
    
    # Verify file created in project directory
    golden_path = Path(".claude/tasks/golden-test/contexts/team-knowledge.jsonl")
    assert golden_path.exists()
    
    # Verify JSONL format
    assert verify_jsonl(golden_path)
    
    # Verify metadata
    metadata_path = golden_path.with_suffix(".meta.json")
    metadata = json.loads(metadata_path.read_text())
    assert metadata["name"] == "team-knowledge"
    assert metadata["type"] == "golden"
    assert "author" in metadata
    
    # Verify git tracks it
    result = subprocess.run(
        ["git", "add", str(golden_path)],
        cwd=project_dir,
        capture_output=True
    )
    assert result.returncode == 0
    
    # Verify also saved to personal storage
    personal_path = Path.home() / ".claude/projects" / sanitize_path(project_dir) / \
                    "tasks/golden-test/contexts/team-knowledge.jsonl"
    assert personal_path.exists()
```

**Expected Output:**
```
✓ Scanning for secrets...
✓ No secrets detected
✓ Generating summary...
✓ Saved context: team-knowledge (15 msgs)
✓ Location: ./.claude/tasks/golden-test/contexts/team-knowledge.jsonl
✓ Type: Golden (team shared) ⭐
✓ Remember to commit and push!
```

---

### Test 4.3: Save with Invalid Name

**Setup:**
```bash
cd test-project
claude > /task invalid-test
```

**Execution:**
```bash
> /context-save "my work!"  # Invalid characters
```

**Validation:**
```python
def test_save_invalid_name():
    result = run_command('/context-save "my work!"')
    
    assert result["returncode"] != 0
    assert "invalid" in result["stdout"].lower()
    assert "alphanumeric" in result["stdout"].lower() or \
           "hyphens" in result["stdout"].lower() or \
           "underscores" in result["stdout"].lower()
    
    # Verify no file created
    personal_dir = Path.home() / ".claude/projects" / sanitize_path(project_dir) / \
                   "tasks/invalid-test/contexts"
    if personal_dir.exists():
        assert not any(personal_dir.glob("my work*"))
```

**Expected Output:**
```
Error: Invalid context name 'my work!'
Context names must contain only lowercase letters, numbers, hyphens, and underscores
Examples: my-work, auth-flow, experiment_1
```

---

### Test 4.4: Save with Overwrite Prompt

**Setup:**
```bash
cd test-project
claude > /task overwrite-test
> /context-save existing
# Save same name again
> /context-save existing
```

**Validation:**
```python
def test_save_overwrite():
    # First save succeeds
    result1 = run_command("/context-save existing")
    assert result1["returncode"] == 0
    
    # Second save prompts for confirmation
    # (This requires interactive testing or mocking)
    result2 = run_command("/context-save existing")
    assert "already exists" in result2["stdout"].lower() or \
           "overwrite" in result2["stdout"].lower()
```

**Expected Output:**
```
Context 'existing' already exists (10 msgs, 2026-01-18)
Overwrite? (y/n): 
```

---

### Test 4.5: Save with Varying Message Counts

**Setup:**
```bash
cd test-project
```

**Execution:**
```bash
# Test with empty context
claude > /task empty-save
> /context-save empty-ctx

# Test with small context (5 msgs)
> /task small-save
[5 message conversation]
> /context-save small-ctx

# Test with large context (200+ msgs)
> /task large-save
[200+ message conversation]
> /context-save large-ctx
```

**Validation:**
```python
def test_save_varying_sizes():
    # Empty context
    empty_meta = load_metadata("empty-save", "empty-ctx")
    assert empty_meta["message_count"] == 0
    assert len(empty_meta["summary"]) > 0  # Should still have summary
    
    # Small context
    small_meta = load_metadata("small-save", "small-ctx")
    assert small_meta["message_count"] == 5
    
    # Large context
    large_meta = load_metadata("large-save", "large-ctx")
    assert large_meta["message_count"] > 200
    assert verify_jsonl_size(large_meta["file_path"]) > 50000  # Reasonable file size
```

---

### Test 4.6: Save Without Active Task

**Setup:**
```bash
cd test-project
claude  # No task selected
```

**Execution:**
```bash
> /context-save no-task
```

**Validation:**
```python
def test_save_without_task():
    result = run_command("/context-save no-task")
    
    # Should either error or prompt to select task
    assert "no task" in result["stdout"].lower() or \
           "select a task" in result["stdout"].lower()
    
    # Or could save to default task
    # (Depends on implementation choice)
```

---

## 5. Context Listing Tests · F-CTX-LIST

### Test 5.1: List Contexts for Current Task

**Setup:**
```bash
cd test-project
claude > /task list-test
> /context-save ctx-1
> /context-save ctx-2
```

**Execution:**
```bash
> /context-list
```

**Validation:**
```python
def test_list_current_task():
    result = run_command("/context-list")
    
    # Verify task name shown
    assert "list-test" in result["stdout"]
    
    # Verify both contexts shown
    assert "ctx-1" in result["stdout"]
    assert "ctx-2" in result["stdout"]
    
    # Verify metadata shown
    assert "msgs" in result["stdout"]
    assert "2026-01" in result["stdout"]  # Date format
    
    # Verify summaries shown
    # (Summaries should be truncated if long)
```

**Expected Output:**
```
Contexts for task: list-test

Personal contexts:
1. ctx-1 (10 msgs) - 2026-01-18
   Summary: Initial setup and configuration...
   
2. ctx-2 (15 msgs) - 2026-01-18
   Summary: Testing authentication flows...
```

---

### Test 5.2: List Contexts for Different Task

**Setup:**
```bash
cd test-project
claude > /task task-a
> /context-save ctx-a

> /task task-b  # Switch to different task
```

**Execution:**
```bash
> /context-list task-a
```

**Validation:**
```python
def test_list_different_task():
    result = run_command("/context-list task-a")
    
    # Verify task-a contexts shown, not task-b
    assert "task-a" in result["stdout"]
    assert "ctx-a" in result["stdout"]
    assert "task-b" not in result["stdout"]
```

---

### Test 5.3: List When No Contexts Exist

**Setup:**
```bash
cd test-project
claude > /task no-contexts
```

**Execution:**
```bash
> /context-list
```

**Validation:**
```python
def test_list_no_contexts():
    result = run_command("/context-list")
    
    assert "no contexts" in result["stdout"].lower() or \
           "0 contexts" in result["stdout"]
```

**Expected Output:**
```
Contexts for task: no-contexts

No contexts found. Use /context-save to create one.
```

---

### Test 5.4: List with Mix of Personal and Golden

**Setup:**
```bash
cd test-project
claude > /task mixed
> /context-save personal-ctx
> n  # Not golden
> /context-save golden-ctx
> y  # Make golden
```

**Execution:**
```bash
> /context-list
```

**Validation:**
```python
def test_list_mixed():
    result = run_command("/context-list")
    
    # Verify sections
    assert "Personal contexts:" in result["stdout"]
    assert "Golden contexts" in result["stdout"]
    
    # Verify indicators
    assert "personal-ctx" in result["stdout"]
    assert "golden-ctx" in result["stdout"]
    assert "⭐" in result["stdout"] or "(golden)" in result["stdout"]
    
    # Verify author shown for golden
    # (May be "unknown" if not set)
```

**Expected Output:**
```
Contexts for task: mixed

Personal contexts:
1. personal-ctx (10 msgs) - 2026-01-18
   Summary: Personal exploration...

Golden contexts (team shared):
2. golden-ctx (20 msgs) - 2026-01-18 - by: alice ⭐
   Summary: Team knowledge base...
```

---

### Test 5.5: List Non-existent Task

**Setup:**
```bash
cd test-project
```

**Execution:**
```bash
> /context-list nonexistent-task
```

**Validation:**
```python
def test_list_nonexistent():
    result = run_command("/context-list nonexistent-task")
    
    assert result["returncode"] != 0 or \
           "not found" in result["stdout"].lower() or \
           "does not exist" in result["stdout"].lower()
```

---

## 6. Context Management Tests · F-CTX-MANAGE

### Test 6.1: Manage When No Contexts Exist

**Setup:**
```bash
cd test-project
# No contexts saved
```

**Execution:**
```bash
claude > /context-manage
```

**Validation:**
```python
def test_manage_no_contexts():
    result = run_command("/context-manage")
    
    assert "0 contexts" in result["stdout"] or \
           "no contexts" in result["stdout"].lower()
```

**Expected Output:**
```
Scanning for contexts...

Found 0 contexts across 0 tasks

Nothing to manage. Use /context-save to create contexts.
```

---

### Test 6.2: Manage with Stale Contexts

**Setup:**
```bash
cd test-project
# Create old contexts (mock old timestamps)
# This requires test fixtures with pre-dated contexts
```

**Execution:**
```bash
claude > /context-manage
```

**Validation:**
```python
def test_manage_stale():
    # Create context with old timestamp
    create_stale_context("task-1", "old-ctx", days_ago=90)
    
    result = run_command("/context-manage")
    
    # Verify stale context identified
    assert "stale" in result["stdout"].lower() or \
           "old" in result["stdout"].lower()
    assert "old-ctx" in result["stdout"]
    
    # Verify suggestions provided
    assert "clean" in result["stdout"].lower() or \
           "delete" in result["stdout"].lower()
```

**Expected Output:**
```
Scanning for contexts...

Found 3 contexts across 2 tasks

Stale contexts (>60 days old):
- task-1/old-ctx (120 days old, 5 msgs)

What would you like to do?
- clean: Delete recommended contexts
- review: Review each context individually  
- cancel: Exit without changes

Choice: 
```

---

### Test 6.3: Manage with Duplicate Contexts

**Setup:**
```bash
cd test-project
# Create duplicate contexts
# (Same content, different names)
```

**Execution:**
```bash
claude > /context-manage
```

**Validation:**
```python
def test_manage_duplicates():
    # Create two contexts with identical content
    create_context("task-1", "ctx-1", content=SAMPLE_CONTENT)
    create_context("task-1", "ctx-2", content=SAMPLE_CONTENT)
    
    result = run_command("/context-manage")
    
    # Verify duplicates identified
    assert "duplicate" in result["stdout"].lower() or \
           "similar" in result["stdout"].lower()
    assert "ctx-1" in result["stdout"]
    assert "ctx-2" in result["stdout"]
```

---

### Test 6.4: Review Mode

**Setup:**
```bash
cd test-project
# Contexts with issues
```

**Execution:**
```bash
claude > /context-manage
> review
```

**Validation:**
```python
def test_manage_review_mode():
    # Interactive test - verify prompts shown
    result = run_command("/context-manage\nreview")
    
    # Verify individual context details shown
    assert "Context:" in result["stdout"]
    assert "Keep" in result["stdout"] or "Delete" in result["stdout"]
```

---

### Test 6.5: Clean Mode with Confirmation

**Setup:**
```bash
cd test-project
# Stale contexts present
```

**Execution:**
```bash
claude > /context-manage
> clean
> yes  # Confirm deletion
```

**Validation:**
```python
def test_manage_clean():
    create_stale_context("task-1", "stale-1", days_ago=90)
    
    result = run_command("/context-manage\nclean\nyes")
    
    # Verify deletion happened
    personal_path = get_context_path("task-1", "stale-1", personal=True)
    assert not personal_path.exists()
    
    # Verify summary shown
    assert "deleted" in result["stdout"].lower()
    assert "1" in result["stdout"]  # Count of deleted
```

---

### Test 6.6: Preserve Golden Contexts

**Setup:**
```bash
cd test-project
# Golden context that appears stale
```

**Execution:**
```bash
claude > /context-manage
> clean
```

**Validation:**
```python
def test_manage_preserve_golden():
    # Create old golden context
    create_stale_context("task-1", "golden-old", days_ago=120, golden=True)
    
    result = run_command("/context-manage\nclean")
    
    # Verify golden context NOT in deletion list
    # or requires explicit confirmation
    assert "golden" in result["stdout"].lower()
    assert "warning" in result["stdout"].lower() or \
           "careful" in result["stdout"].lower()
    
    # Verify golden context preserved unless explicitly confirmed
    golden_path = get_context_path("task-1", "golden-old", personal=False)
    assert golden_path.exists()
```

---

## 7. Context Promotion Tests · F-CTX-PROMOTE

### Test 7.1: Promote Clean Context (No Secrets)

**Setup:**
```bash
cd test-project
claude > /task promote-test
> /context-save clean-ctx
> n  # Personal context
```

**Execution:**
```bash
> /context-promote clean-ctx
```

**Validation:**
```python
def test_promote_clean():
    result = run_command("/context-promote clean-ctx")
    
    # Verify secret scan ran
    assert "scanning" in result["stdout"].lower()
    assert "no secrets" in result["stdout"].lower()
    
    # Verify promotion happened
    golden_path = Path(".claude/tasks/promote-test/contexts/clean-ctx.jsonl")
    assert golden_path.exists()
    
    # Verify metadata updated
    metadata = load_metadata_from_path(golden_path)
    assert metadata["type"] == "golden"
    
    # Verify original personal context still exists
    personal_path = get_context_path("promote-test", "clean-ctx", personal=True)
    assert personal_path.exists()
    
    # Verify files are identical
    assert files_identical(personal_path, golden_path)
```

**Expected Output:**
```
✓ Scanning for secrets...
✓ No secrets detected
✓ Promoting to golden context...
✓ Context promoted: clean-ctx
✓ Location: ./.claude/tasks/promote-test/contexts/clean-ctx.jsonl
✓ Type: Golden (team shared) ⭐
✓ Remember to commit and push!
```

---

### Test 7.2: Promote Context with API Keys

**Setup:**
```bash
cd test-project
# Create context with API key in conversation
```

**Execution:**
```bash
> /context-promote secret-ctx
```

**Validation:**
```python
def test_promote_with_secrets():
    # Create context with known secret
    create_context_with_secret(
        "task-1", 
        "secret-ctx",
        secret_type="stripe_key",
        secret_value="sk_live_abcdef123456"
    )
    
    result = run_command("/context-promote secret-ctx")
    
    # Verify secrets detected
    assert "secrets detected" in result["stdout"].lower() or \
           "found" in result["stdout"].lower()
    assert "sk_live_" in result["stdout"] or \
           "Stripe" in result["stdout"]
    
    # Verify promotion blocked or requires action
    assert result["returncode"] != 0 or \
           "redact" in result["stdout"].lower() or \
           "cannot promote" in result["stdout"].lower()
```

**Expected Output:**
```
✓ Scanning for secrets...
⚠ Secrets detected!

Found 1 secret:
1. Stripe API Key (sk_live_...)
   Line 23: "Here's the API key: sk_live_abcdef123456"

Cannot promote context with secrets.
Options:
1. /context-promote secret-ctx --redact
2. Manually edit context to remove secrets
3. Cancel promotion
```

---

### Test 7.3: Promote with Redaction

**Setup:**
```bash
cd test-project
# Context with secrets
```

**Execution:**
```bash
> /context-promote secret-ctx --redact
```

**Validation:**
```python
def test_promote_with_redaction():
    create_context_with_secret("task-1", "secret-ctx", 
                                secret_value="sk_live_abc123")
    
    result = run_command("/context-promote secret-ctx --redact")
    
    # Verify redaction options shown
    # Interactive: user chooses mask/remove/replace for each secret
    
    # After redaction, verify:
    golden_path = Path(".claude/tasks/task-1/contexts/secret-ctx.jsonl")
    golden_content = golden_path.read_text()
    
    # Verify secret not present
    assert "sk_live_abc123" not in golden_content
    # Verify redaction marker present
    assert "REDACTED" in golden_content or \
           "***" in golden_content
    
    # Verify still valid JSONL
    assert verify_jsonl(golden_path)
```

---

### Test 7.4: Promote Non-existent Context

**Setup:**
```bash
cd test-project
claude > /task task-1
```

**Execution:**
```bash
> /context-promote nonexistent
```

**Validation:**
```python
def test_promote_nonexistent():
    result = run_command("/context-promote nonexistent")
    
    assert result["returncode"] != 0
    assert "not found" in result["stdout"].lower() or \
           "does not exist" in result["stdout"].lower()
```

**Expected Output:**
```
Error: Context 'nonexistent' not found in task 'task-1'

Available contexts:
- ctx-1 (personal)
- ctx-2 (personal)

Use /context-list to see all contexts
```

---

### Test 7.5: Promote Already-Golden Context

**Setup:**
```bash
cd test-project
claude > /task task-1
> /context-save golden-ctx
> y  # Already golden
```

**Execution:**
```bash
> /context-promote golden-ctx
```

**Validation:**
```python
def test_promote_already_golden():
    result = run_command("/context-promote golden-ctx")
    
    # Should warn or error
    assert "already golden" in result["stdout"].lower() or \
           "already promoted" in result["stdout"].lower()
```

**Expected Output:**
```
Context 'golden-ctx' is already a golden context

Location: ./.claude/tasks/task-1/contexts/golden-ctx.jsonl
Type: Golden (team shared) ⭐
```

---

## 8. Two-File CLAUDE.md System Tests · F-CLMD

### Test 8.1: Root CLAUDE.md Never Modified

**Setup:**
```bash
cd test-project
echo "# Original Content" > CLAUDE.md
git init && git add CLAUDE.md && git commit -m "initial"
```

**Execution:**
```bash
claude > /task-init
> /task task-1
> /task task-2
> /task default
```

**Validation:**
```python
def test_root_claude_md_unchanged():
    original_content = "# Original Content\n"
    
    # Record original
    assert Path("CLAUDE.md").read_text() == original_content
    
    # After all operations
    run_command("/task-init")
    run_command("/task task-1")
    run_command("/task task-2")
    run_command("/task default")
    
    # Verify unchanged
    assert Path("CLAUDE.md").read_text() == original_content
    
    # Verify git shows no changes
    result = subprocess.run(
        ["git", "status", "--porcelain", "CLAUDE.md"],
        capture_output=True,
        text=True,
        cwd=project_dir
    )
    assert result.stdout == ""  # No changes
```

---

### Test 8.2: .claude/CLAUDE.md Auto-generated

**Setup:**
```bash
cd test-project
```

**Execution:**
```bash
claude > /task-init
> /task task-1
```

**Validation:**
```python
def test_working_claude_md_generated():
    run_command("/task-init")
    
    # Verify .claude/CLAUDE.md created
    assert verify_file_exists(".claude/CLAUDE.md")
    
    # Verify contains @import
    working_content = Path(".claude/CLAUDE.md").read_text()
    assert "@import" in working_content
    
    # Switch task, verify updated
    run_command("/task task-1")
    working_content = Path(".claude/CLAUDE.md").read_text()
    assert "@import ./tasks/task-1/CLAUDE.md" in working_content
```

---

### Test 8.3: .claude/CLAUDE.md Git Ignored

**Setup:**
```bash
cd test-project
git init
```

**Execution:**
```bash
claude > /task-init
> /task task-1
```

**Validation:**
```python
def test_working_claude_md_ignored():
    # Verify .gitignore exists
    gitignore = Path(".claude/.gitignore").read_text()
    assert "CLAUDE.md" in gitignore
    
    # Verify git ignores file
    assert verify_git_ignored(".claude/CLAUDE.md")
    
    # Verify git status doesn't show it
    result = subprocess.run(
        ["git", "status", "--short"],
        capture_output=True,
        text=True,
        cwd=project_dir
    )
    assert ".claude/CLAUDE.md" not in result.stdout
```

---

### Test 8.4: Import Path Updates on Task Switch

**Setup:**
```bash
cd test-project
```

**Execution:**
```bash
claude > /task-init
> /task auth
> /task payment
> /task default
```

**Validation:**
```python
def test_import_path_updates():
    working_md = Path(".claude/CLAUDE.md")
    
    run_command("/task auth")
    assert "@import ./tasks/auth/CLAUDE.md" in working_md.read_text()
    assert "payment" not in working_md.read_text()
    
    run_command("/task payment")
    assert "@import ./tasks/payment/CLAUDE.md" in working_md.read_text()
    assert "auth" not in working_md.read_text()
    
    run_command("/task default")
    assert "@import ./tasks/default/CLAUDE.md" in working_md.read_text()
```

---

### Test 8.5: /resume Loads Task Instructions

**Setup:**
```bash
cd test-project
claude > /task oauth-work
# Task CLAUDE.md contains specific instructions
```

**Execution:**
```bash
# Exit and resume
exit
claude --resume sess-abc123
```

**Validation:**
```python
def test_resume_loads_task_instructions():
    # Create task with specific instructions
    run_command("/task oauth-work")
    task_md = Path(".claude/tasks/oauth-work/CLAUDE.md")
    task_md.write_text("# OAuth Task\n\nFocus on src/auth/ directory\n")
    
    # Get session ID from task switch output
    result = run_command("/task oauth-work")
    sess_id = extract_session_id(result["stdout"])
    
    # Resume session
    resume_result = run_command(f"/resume {sess_id}")
    
    # Verify task instructions loaded
    # (Check that Claude has access to task-specific context)
    # This may require checking Claude's response or system prompt
    # Note: This is integration with Claude Code itself
```

---

### Test 8.6: Multiple Developers Different .claude/CLAUDE.md

**Setup:**
```bash
# Two developers, same repo
cd /tmp/repo
git clone project.git dev1-workspace
git clone project.git dev2-workspace
```

**Execution:**
```bash
# Dev 1
cd dev1-workspace
claude > /task-init
> /task auth-work

# Dev 2
cd dev2-workspace
claude > /task-init
> /task payment-work
```

**Validation:**
```python
def test_multiple_developers():
    # Dev 1's working CLAUDE.md
    dev1_working = Path("dev1-workspace/.claude/CLAUDE.md").read_text()
    assert "@import ./tasks/auth-work/CLAUDE.md" in dev1_working
    
    # Dev 2's working CLAUDE.md
    dev2_working = Path("dev2-workspace/.claude/CLAUDE.md").read_text()
    assert "@import ./tasks/payment-work/CLAUDE.md" in dev2_working
    
    # Verify they're different
    assert dev1_working != dev2_working
    
    # Verify root CLAUDE.md identical
    dev1_root = Path("dev1-workspace/CLAUDE.md").read_text()
    dev2_root = Path("dev2-workspace/CLAUDE.md").read_text()
    assert dev1_root == dev2_root
    
    # Verify git shows no conflicts
    # Both can pull/push without issues
```

---

## 9. Secret Detection Tests · F-SEC

### Test 9.1: Detect AWS Access Keys

**Setup:**
```bash
cd test-project
# Create context with AWS key
```

**Validation:**
```python
def test_detect_aws_keys():
    context = create_context_with_content(
        "task-1", "aws-ctx",
        messages=[
            {"role": "user", "content": "Here's the key: AKIAIOSFODNN7EXAMPLE"},
            {"role": "assistant", "content": "Thanks, I'll use that"}
        ]
    )
    
    secrets = detect_secrets(context)
    
    assert len(secrets) > 0
    assert any(s["type"] == "aws_access_key" for s in secrets)
    assert any("AKIAIOSFODNN7EXAMPLE" in s["value"] for s in secrets)
```

---

### Test 9.2: Detect Stripe API Keys

**Validation:**
```python
def test_detect_stripe_keys():
    test_keys = [
        "sk_live_abcdefghijklmnop1234567890",
        "sk_test_xyz789",
        "pk_live_abc123"
    ]
    
    for key in test_keys:
        context = create_context_with_content(
            "task-1", "stripe-ctx",
            messages=[{"role": "user", "content": f"API key: {key}"}]
        )
        
        secrets = detect_secrets(context)
        assert len(secrets) > 0
        assert any("stripe" in s["type"].lower() for s in secrets)
```

---

### Test 9.3: Detect GitHub Tokens

**Validation:**
```python
def test_detect_github_tokens():
    tokens = [
        "ghp_abcdefghijklmnopqrstuvwxyz123456",
        "gho_abc123",
        "github_pat_abc123"
    ]
    
    for token in tokens:
        secrets = detect_secrets_in_text(token)
        assert any("github" in s["type"].lower() for s in secrets)
```

---

### Test 9.4: Detect Private Keys

**Validation:**
```python
def test_detect_private_keys():
    ssh_key = """-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"""
    
    secrets = detect_secrets_in_text(ssh_key)
    assert any("private key" in s["type"].lower() for s in secrets)
```

---

### Test 9.5: Detect Generic Passwords

**Validation:**
```python
def test_detect_passwords():
    test_strings = [
        "password: MySecretPass123",
        "pwd=SuperSecret!",
        "PASSWORD=admin123"
    ]
    
    for s in test_strings:
        secrets = detect_secrets_in_text(s)
        # May or may not detect depending on heuristics
        # Focus on high-confidence patterns
```

---

### Test 9.6: False Positives

**Validation:**
```python
def test_false_positives():
    # Strings that look like secrets but aren't
    false_positives = [
        "AKIAIOSFODNN7EXAMPLE",  # Example from AWS docs
        "sk_test_123",  # Test key (may be real, but often examples)
        "password=<your-password>",  # Placeholder
        "api_key: YOUR_API_KEY"  # Placeholder
    ]
    
    # These should either:
    # 1. Not be detected
    # 2. Be flagged with low confidence
    # 3. Be in an allowlist
```

---

### Test 9.7: Multiple Secrets in Single Message

**Validation:**
```python
def test_multiple_secrets():
    message = """
    AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
    AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
    STRIPE_KEY=sk_live_abc123
    """
    
    secrets = detect_secrets_in_text(message)
    assert len(secrets) >= 3
```

---

### Test 9.8: Secrets in Different Message Types

**Validation:**
```python
def test_secrets_in_message_types():
    context = create_context_with_content(
        "task-1", "multi-type",
        messages=[
            {"role": "user", "content": "Key: AKIA..."},
            {"role": "assistant", "content": "I'll use AKIA..."},
            {"role": "tool", "content": "Output: AKIA..."}
        ]
    )
    
    secrets = detect_secrets(context)
    # Should find secrets in all message types
    assert len(secrets) >= 3
```

---

### Test 9.9: Redaction Produces Valid JSONL

**Validation:**
```python
def test_redaction_valid_jsonl():
    context = create_context_with_secret(
        "task-1", "redact-test",
        secret_value="sk_live_abc123"
    )
    
    # Redact the secret
    redacted = redact_secrets(context, secrets, method="mask")
    
    # Verify still valid JSONL
    assert verify_jsonl_string(redacted)
    
    # Verify structure intact
    original_lines = context.split("\n")
    redacted_lines = redacted.split("\n")
    assert len(original_lines) == len(redacted_lines)
```

---

## 10. AI-Generated Summary Tests · F-SUMMARY

### Test 10.1: Summary for Small Context

**Validation:**
```python
def test_summary_small_context():
    context = create_context_with_content(
        "task-1", "small",
        messages=[
            {"role": "user", "content": "Let's work on authentication"},
            {"role": "assistant", "content": "Great, I'll help with auth"},
            {"role": "user", "content": "Focus on OAuth 2.0"},
            {"role": "assistant", "content": "Understood"},
            {"role": "user", "content": "Start with src/auth/oauth.py"}
        ]
    )
    
    summary = generate_summary(context)
    
    # Verify summary exists and is reasonable length
    assert len(summary) > 20
    assert len(summary) < 500
    
    # Verify contains relevant keywords
    assert "auth" in summary.lower() or "oauth" in summary.lower()
```

---

### Test 10.2: Summary for Medium Context

**Validation:**
```python
def test_summary_medium_context():
    # 50 messages
    messages = create_conversation_messages(50, topic="database migration")
    context = create_context_with_content("task-1", "medium", messages)
    
    summary = generate_summary(context)
    
    assert len(summary) > 50
    assert "database" in summary.lower() or "migration" in summary.lower()
```

---

### Test 10.3: Summary for Large Context

**Validation:**
```python
def test_summary_large_context():
    # 200+ messages
    messages = create_conversation_messages(250, topic="payment integration")
    context = create_context_with_content("task-1", "large", messages)
    
    summary = generate_summary(context)
    
    # Should still be concise despite large input
    assert len(summary) < 1000
    assert len(summary.split(".")) <= 5  # ~3-5 sentences
```

---

### Test 10.4: Summary for Code-Heavy Content

**Validation:**
```python
def test_summary_code_heavy():
    messages = [
        {"role": "user", "content": "Fix the auth bug"},
        {"role": "assistant", "content": "Here's the code:\n```python\ndef authenticate(user):\n    return user.verify()\n```"},
        # ... more code exchanges
    ]
    
    context = create_context_with_content("task-1", "code", messages)
    summary = generate_summary(context)
    
    # Should focus on what was done, not code itself
    assert "fix" in summary.lower() or "auth" in summary.lower()
    # Should not be full of code
    assert "```" not in summary
```

---

### Test 10.5: Summary for Minimal Content

**Validation:**
```python
def test_summary_minimal():
    messages = [
        {"role": "user", "content": "Hi"},
        {"role": "assistant", "content": "Hello!"}
    ]
    
    context = create_context_with_content("task-1", "minimal", messages)
    summary = generate_summary(context)
    
    # Should handle gracefully
    assert len(summary) > 0
    assert len(summary) < 200
```

---

### Test 10.6: Summary Stored in Metadata

**Validation:**
```python
def test_summary_in_metadata():
    run_command("/task task-1")
    # Have conversation...
    run_command("/context-save with-summary")
    
    metadata = load_metadata("task-1", "with-summary")
    
    assert "summary" in metadata
    assert len(metadata["summary"]) > 0
    assert isinstance(metadata["summary"], str)
```

---

### Test 10.7: Summary Displayed in List

**Validation:**
```python
def test_summary_displayed():
    run_command("/task task-1")
    run_command("/context-save ctx-1")
    
    result = run_command("/context-list")
    
    # Verify summary shown
    assert "Summary:" in result["stdout"] or \
           metadata["summary"][:50] in result["stdout"]
```

---

## 11. Git Integration Tests · F-GIT

### Test 11.1: .gitignore Setup

**Validation:**
```python
def test_gitignore_setup():
    subprocess.run(["git", "init"], cwd=project_dir)
    run_command("/task-init")
    
    # Verify .gitignore exists
    gitignore = Path(".claude/.gitignore")
    assert gitignore.exists()
    
    # Verify content
    content = gitignore.read_text()
    assert "CLAUDE.md" in content
```

---

### Test 11.2: Task Files Tracked by Git

**Validation:**
```python
def test_task_files_tracked():
    subprocess.run(["git", "init"], cwd=project_dir)
    run_command("/task-init")
    run_command("/task auth-work")
    
    subprocess.run(["git", "add", "."], cwd=project_dir)
    
    # Verify task CLAUDE.md tracked
    result = subprocess.run(
        ["git", "ls-files", ".claude/tasks/auth-work/CLAUDE.md"],
        capture_output=True,
        text=True,
        cwd=project_dir
    )
    assert result.stdout.strip() == ".claude/tasks/auth-work/CLAUDE.md"
```

---

### Test 11.3: Golden Contexts Tracked

**Validation:**
```python
def test_golden_contexts_tracked():
    subprocess.run(["git", "init"], cwd=project_dir)
    run_command("/task-init")
    run_command("/task task-1")
    run_command("/context-save golden-ctx")
    # Respond 'y' to golden prompt
    
    subprocess.run(["git", "add", "."], cwd=project_dir)
    
    # Verify golden context tracked
    result = subprocess.run(
        ["git", "ls-files", ".claude/tasks/task-1/contexts/golden-ctx.jsonl"],
        capture_output=True,
        text=True,
        cwd=project_dir
    )
    assert "golden-ctx.jsonl" in result.stdout
```

---

### Test 11.4: Personal Storage Never Committed

**Validation:**
```python
def test_personal_storage_never_committed():
    subprocess.run(["git", "init"], cwd=project_dir)
    run_command("/task-init")
    run_command("/task task-1")
    run_command("/context-save personal-ctx")
    # Respond 'n' to golden prompt
    
    subprocess.run(["git", "add", "."], cwd=project_dir)
    
    # Verify ~/.claude/ path not in git
    result = subprocess.run(
        ["git", "ls-files"],
        capture_output=True,
        text=True,
        cwd=project_dir
    )
    assert ".claude/projects" not in result.stdout
    assert str(Path.home()) not in result.stdout
```

---

### Test 11.5: No Git Conflicts from Context Operations

**Validation:**
```python
def test_no_git_conflicts():
    # Setup: Two developers, same repo
    repo = create_git_repo()
    
    dev1_workspace = clone_repo(repo, "dev1")
    dev2_workspace = clone_repo(repo, "dev2")
    
    # Dev 1 creates task and golden context
    with in_directory(dev1_workspace):
        run_command("/task-init")
        run_command("/task shared-task")
        run_command("/context-save shared-ctx")
        # y to golden
        subprocess.run(["git", "add", "."])
        subprocess.run(["git", "commit", "-m", "Add shared context"])
        subprocess.run(["git", "push"])
    
    # Dev 2 pulls and works on different task
    with in_directory(dev2_workspace):
        subprocess.run(["git", "pull"])
        run_command("/task-init")
        run_command("/task different-task")
        run_command("/context-save other-ctx")
        subprocess.run(["git", "add", "."])
        subprocess.run(["git", "commit", "-m", "Add other context"])
        subprocess.run(["git", "push"])
    
    # Dev 1 pulls - should have no conflicts
    with in_directory(dev1_workspace):
        result = subprocess.run(
            ["git", "pull"],
            capture_output=True,
            text=True
        )
        assert "CONFLICT" not in result.stdout
        assert result.returncode == 0
```

---

### Test 11.6: Pull Golden Context and Load

**Validation:**
```python
def test_pull_and_load_golden():
    # Setup: Repo with golden context
    repo = create_git_repo_with_golden_context()
    
    # Clone as new developer
    workspace = clone_repo(repo, "newdev")
    
    with in_directory(workspace):
        run_command("/task-init")
        result = run_command("/task shared-task")
        
        # Verify golden context available
        assert "Golden contexts" in result["stdout"]
        assert "shared-ctx" in result["stdout"]
        
        # Load it
        # Select context interactively
        # Verify it loads
```

---

### Test 11.7: .claude/CLAUDE.md Not in Git Status

**Validation:**
```python
def test_working_claude_md_not_in_status():
    subprocess.run(["git", "init"], cwd=project_dir)
    run_command("/task-init")
    run_command("/task task-1")
    
    # Modify .claude/CLAUDE.md
    Path(".claude/CLAUDE.md").write_text("modified")
    
    # Git status should not show it
    result = subprocess.run(
        ["git", "status", "--short"],
        capture_output=True,
        text=True,
        cwd=project_dir
    )
    assert ".claude/CLAUDE.md" not in result.stdout
```

---

## 12. Cross-Platform Tests · F-XPLAT

### Test 12.1: Initialize on macOS

**Validation:**
```python
@pytest.mark.skipif(platform.system() != "Darwin", reason="macOS only")
def test_init_macos():
    run_command("/task-init")
    
    # Verify paths work
    assert verify_file_exists(".claude/")
    
    # Verify tilde expansion
    home_path = Path.home() / ".claude/projects"
    assert home_path.exists()
```

---

### Test 12.2: Initialize on Linux

**Validation:**
```python
@pytest.mark.skipif(platform.system() != "Linux", reason="Linux only")
def test_init_linux():
    run_command("/task-init")
    
    # Same verifications as macOS
    assert verify_file_exists(".claude/")
```

---

### Test 12.3: Initialize on Windows (WSL and Native)

**Validation:**
```python
@pytest.mark.skipif(platform.system() != "Windows", reason="Windows only")
def test_init_windows():
    run_command("/task-init")
    
    # Verify paths work with Windows conventions
    # Check both WSL and native Windows paths
```

---

### Test 12.4: Project Path with Spaces

**Validation:**
```python
def test_path_with_spaces():
    project_dir = Path(tempfile.mkdtemp()) / "my project"
    project_dir.mkdir()
    
    with in_directory(project_dir):
        run_command("/task-init")
        
        # Verify sanitized path in ~/.claude/projects/
        # Spaces should be replaced or escaped
        personal_storage = Path.home() / ".claude/projects"
        sanitized_dirs = list(personal_storage.glob("*my*project*"))
        assert len(sanitized_dirs) > 0
```

---

### Test 12.5: Project Path with Special Characters

**Validation:**
```python
def test_path_with_special_chars():
    # Test with characters that need escaping
    test_chars = ["project@home", "my-project_v2", "test[1]"]
    
    for name in test_chars:
        project_dir = Path(tempfile.mkdtemp()) / name
        project_dir.mkdir()
        
        with in_directory(project_dir):
            run_command("/task-init")
            # Should handle gracefully
```

---

### Test 12.6: Cross-Platform Context Compatibility

**Validation:**
```python
def test_context_portability():
    # Create context on one platform
    context = create_context("task-1", "portable")
    
    # Verify JSONL uses LF line endings
    content = Path(context).read_bytes()
    assert b"\r\n" not in content  # No CRLF
    
    # Verify can be read on other platforms
    # (Simulate by parsing on current platform)
    assert verify_jsonl(context)
```

---

### Test 12.7: Consistent Line Endings

**Validation:**
```python
def test_line_endings():
    run_command("/task-init")
    run_command("/task task-1")
    
    # Check all generated files use LF
    for file in [".claude/CLAUDE.md", 
                 ".claude/tasks/task-1/CLAUDE.md",
                 ".claude/tasks/task-1/README.md"]:
        content = Path(file).read_bytes()
        assert b"\r\n" not in content
```

---

## 13. Error Handling Tests · F-ERR

### Test 13.1: Run /task Without Initialization

**Validation:**
```python
def test_task_without_init():
    # Don't run /task-init
    result = run_command("/task some-task")
    
    # Should error or auto-initialize
    assert "not initialized" in result["stdout"].lower() or \
           "run /task-init" in result["stdout"].lower() or \
           result["returncode"] != 0
```

---

### Test 13.2: Delete .claude/ Mid-Operation

**Validation:**
```python
def test_delete_claude_dir():
    run_command("/task-init")
    
    # Delete directory
    shutil.rmtree(".claude")
    
    # Try to use commands
    result = run_command("/task task-1")
    
    # Should handle gracefully
    assert result["returncode"] != 0 or \
           "not found" in result["stdout"].lower()
```

---

### Test 13.3: Corrupt JSONL Context File

**Validation:**
```python
def test_corrupt_jsonl():
    run_command("/task-init")
    run_command("/task task-1")
    run_command("/context-save ctx-1")
    
    # Corrupt the file
    ctx_path = get_context_path("task-1", "ctx-1", personal=True)
    with open(ctx_path, "a") as f:
        f.write("not valid json\n")
    
    # Try to load context
    result = run_command("/task task-1")
    # Should detect corruption
```

---

### Test 13.4: Fill Disk During Save

**Validation:**
```python
@pytest.mark.slow
def test_disk_full():
    # Difficult to test reliably
    # Could use mock filesystem with quota
    # Or skip in normal test runs
```

---

### Test 13.5: Invalid JSON in Metadata

**Validation:**
```python
def test_invalid_metadata():
    run_command("/task-init")
    run_command("/task task-1")
    run_command("/context-save ctx-1")
    
    # Corrupt metadata
    meta_path = get_context_path("task-1", "ctx-1", personal=True)
    meta_path = meta_path.with_suffix(".meta.json")
    meta_path.write_text("not json")
    
    # Try to list contexts
    result = run_command("/context-list")
    # Should handle gracefully, maybe skip broken context
```

---

### Test 13.6: Permission Denied Errors

**Validation:**
```python
def test_permission_denied():
    run_command("/task-init")
    
    # Make directory read-only
    Path(".claude/tasks").chmod(0o444)
    
    # Try to create task
    result = run_command("/task new-task")
    
    # Should error with clear message
    assert result["returncode"] != 0
    assert "permission" in result["stdout"].lower() or \
           "access" in result["stdout"].lower()
    
    # Restore permissions
    Path(".claude/tasks").chmod(0o755)
```

---

### Test 13.7: Interrupted Operations

**Validation:**
```python
def test_interrupted_save():
    # Simulate Ctrl+C during context save
    # Difficult to test reliably
    # Ensure no partial/corrupt files left behind
```

---

### Test 13.8: Concurrent Operations

**Validation:**
```python
def test_concurrent_saves():
    # Two Claude sessions saving simultaneously
    # Use multiprocessing to simulate
    
    from multiprocessing import Process
    
    def save_context(name):
        run_command(f"/context-save {name}")
    
    p1 = Process(target=save_context, args=("ctx-1",))
    p2 = Process(target=save_context, args=("ctx-2",))
    
    p1.start()
    p2.start()
    p1.join()
    p2.join()
    
    # Both should succeed without corruption
    assert verify_file_exists_in_personal("ctx-1.jsonl")
    assert verify_file_exists_in_personal("ctx-2.jsonl")
```

---

## Test Automation Framework

### Test Runner

```python
# test_runner.py

import pytest
import sys
from pathlib import Path

def run_all_tests():
    """Run all integration tests"""
    
    # Discover and run tests
    exit_code = pytest.main([
        "tests/integration/",
        "-v",  # Verbose
        "--tb=short",  # Short traceback
        "--capture=no",  # Show output
        "-x",  # Stop on first failure
    ])
    
    return exit_code

def run_test_group(group: str):
    """Run specific test group"""
    
    test_files = {
        "init": "test_initialization.py",
        "task": "test_task_operations.py",
        "context": "test_context_operations.py",
        "git": "test_git_integration.py",
        "secret": "test_secret_detection.py",
        "summary": "test_summaries.py",
        "platform": "test_cross_platform.py",
        "error": "test_error_handling.py",
    }
    
    if group not in test_files:
        print(f"Unknown test group: {group}")
        print(f"Available groups: {', '.join(test_files.keys())}")
        return 1
    
    exit_code = pytest.main([
        f"tests/integration/{test_files[group]}",
        "-v",
    ])
    
    return exit_code

if __name__ == "__main__":
    if len(sys.argv) > 1:
        exit_code = run_test_group(sys.argv[1])
    else:
        exit_code = run_all_tests()
    
    sys.exit(exit_code)
```

### Usage

```bash
# Run all tests
python test_runner.py

# Run specific group
python test_runner.py init
python test_runner.py context
python test_runner.py git

# Run with pytest directly
pytest tests/integration/ -v

# Run specific test file
pytest tests/integration/test_task_operations.py -v

# Run specific test
pytest tests/integration/test_task_operations.py::test_create_task_valid -v
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/integration-tests.yml

name: Integration Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        python-version: ['3.8', '3.9', '3.10', '3.11']
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install pytest
        pip install -r requirements-test.txt
    
    - name: Install Claude Code
      run: |
        # Install Claude Code CLI
        # (Method depends on distribution)
    
    - name: Run integration tests
      run: |
        python test_runner.py
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results-${{ matrix.os }}-py${{ matrix.python-version }}
        path: test-results/
```

---

## Test Maintenance

### Adding New Tests

When adding a new feature:

1. Add expected behaviors to PRD Testing section
2. Create test scenarios in this test plan
3. Implement tests in appropriate test file
4. Update test fixtures if needed
5. Run tests to verify they fail (TDD)
6. Implement feature
7. Run tests to verify they pass
8. Update documentation

### Test Review Checklist

- [ ] Test has clear setup, execution, validation
- [ ] Test is deterministic (same input → same output)
- [ ] Test is isolated (no dependencies on other tests)
- [ ] Test validates actual user-facing behavior
- [ ] Test has meaningful assertions
- [ ] Test cleans up after itself
- [ ] Test failure message is clear
- [ ] Test is documented

---

## Appendix: Test Fixtures

### Sample Context Files

```python
# fixtures/sample_contexts.py

SMALL_CONTEXT = """
{"role": "user", "content": "Let's work on auth"}
{"role": "assistant", "content": "Sure, what do you need?"}
{"role": "user", "content": "Fix the OAuth flow"}
{"role": "assistant", "content": "I'll check src/auth/oauth.py"}
{"role": "user", "content": "Good idea"}
"""

CONTEXT_WITH_AWS_KEY = """
{"role": "user", "content": "Here's the AWS key: AKIAIOSFODNN7EXAMPLE"}
{"role": "assistant", "content": "Thanks, I'll use that"}
"""

CONTEXT_WITH_STRIPE_KEY = """
{"role": "user", "content": "Stripe key: sk_live_abc123def456"}
{"role": "assistant", "content": "Got it"}
"""
```

### Helper Functions

```python
# fixtures/helpers.py

def create_test_project(name: str) -> Path:
    """Create a test project directory"""
    project_dir = Path(tempfile.mkdtemp()) / name
    project_dir.mkdir(parents=True)
    return project_dir

def create_context_with_content(task: str, name: str, messages: list) -> Path:
    """Create a .jsonl context file"""
    # Implementation...
    pass

def sanitize_path(path: str) -> str:
    """Sanitize path for personal storage"""
    # Implementation matches context-curator's sanitization
    pass
```

---

## Summary

This test plan provides comprehensive coverage of context-curator functionality through integration tests. The tests:

- Validate real user workflows
- Are deterministic and repeatable
- Test task appropriateness, not code structure
- Can be automated with clear pass/fail criteria
- Enable confident refactoring

**Test Coverage:**
- ✅ Project initialization
- ✅ Task creation and switching
- ✅ Context saving (personal and golden)
- ✅ Context listing and management
- ✅ Context promotion with secret detection
- ✅ Two-file CLAUDE.md system
- ✅ Git integration
- ✅ Cross-platform compatibility
- ✅ Error handling

**Next Steps:**
1. Implement test utilities and base classes
2. Create test fixtures
3. Implement tests by feature group
4. Set up CI/CD pipeline
5. Integrate with Claude Code development loop

---

**Built to ensure context-curator works reliably across all scenarios** ✨

---

## Manual Test Checklist

### T-RESUME-MANUAL: /resume Smoke Test

Run this test when Claude Code updates or when a new version of context-curator is released.

**Frequency:** Once per Claude Code version update  
**Time required:** ~5 minutes

**Steps:**
1. In a test project, run `/task test-smoke-task` and create a task with a unique phrase in the CLAUDE.md (e.g. "SMOKE-TEST-CANARY-PHRASE")
2. Note the session ID returned
3. Run `/resume <session-id>`
4. Ask: "What are your current task instructions?"
5. **PASS** if the response contains content from `.claude/tasks/test-smoke-task/CLAUDE.md`
6. **FAIL** if the response is generic without task-specific content

**Record:** Claude Code version, date tested, pass/fail result.

---

### T-SEC-5 Policy: AKIAIOSFODNN7EXAMPLE

Amazon's documentation uses `AKIAIOSFODNN7EXAMPLE` as an example key. Our scanner **treats this as a true positive** — it matches `AKIA[A-Z0-9]{16}`. This is intentional: we prefer false positives over false negatives for secrets.

This string must **not** appear in the `FALSE_POSITIVES_CONTEXT` fixture. It belongs in `AWS_KEY_CONTEXT` or a dedicated true-positive fixture.