# Testing Guide for Context Curator

## Test Suite Overview

The test suite validates all features specified in PRD v13.0 through comprehensive integration tests.

### Test Groups

| Group | File | Coverage |
|-------|------|----------|
| 1 | `initialization.test.ts` | Project initialization, .claude/ directory structure |
| 2-3 | `task-operations.test.ts` | Task creation, switching, validation |
| 4-7 | `context-operations.test.ts` | Context save, list, manage, promote |
| 8 | `claude-md-system.test.ts` | Two-file CLAUDE.md system |
| 9 | `secret-detection.test.ts` | AWS, Stripe, GitHub, private key detection |
| 11 | `git-integration.test.ts` | Git tracking, .gitignore, no conflicts |
| 12-13 | `error-handling.test.ts` | Error handling, cross-platform |

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run tests with watch mode (re-runs on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Run Specific Test Groups

```bash
# Initialization tests
npm run test:init

# Task operations
npm run test:task

# Context operations
npm run test:context

# CLAUDE.md system
npm run test:claudemd

# Secret detection
npm run test:secrets

# Git integration
npm run test:git

# Error handling
npm run test:errors
```

## Using Ralph Loop for Iterative Test Fixing

Ralph Loop is a Claude Code plugin that iteratively runs until a completion condition is met. Use it to automatically fix failing tests.

### Start Ralph Loop for Test Fixing

```
/ralph-loop Run npm test and fix any failing tests. After each fix, run the tests again to verify. --completion-promise 'All tests passing' --max-iterations 20
```

This will:
1. Run the test suite
2. If tests fail, analyze failures and fix them
3. Re-run tests
4. Repeat until all tests pass or max iterations reached

### Monitor Progress

```bash
# Check current iteration
head -10 .claude/ralph-loop.local.md

# Watch test output
npm run test:watch
```

### Cancel Ralph Loop

```
/cancel-ralph
```

## Test File Structure

```
tests/
├── fixtures/
│   ├── sample-contexts.ts    # Pre-built context data
│   └── sample-secrets.ts     # Secret detection test data
├── utils/
│   └── test-helpers.ts       # Test utilities and helpers
└── integration/
    ├── initialization.test.ts
    ├── task-operations.test.ts
    ├── context-operations.test.ts
    ├── claude-md-system.test.ts
    ├── secret-detection.test.ts
    ├── git-integration.test.ts
    └── error-handling.test.ts
```

## Writing New Tests

1. Add test scenarios to the appropriate test file
2. Use `createTestEnvironment()` for isolated test directories
3. Use `runScript()` to execute context-curator scripts
4. Clean up with `ctx.cleanup()` in `afterEach`

### Example Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestEnvironment, runScript, fileExists } from '../utils/test-helpers';

describe('My Feature', () => {
  let ctx;

  beforeEach(() => {
    ctx = createTestEnvironment('mytest');
  });

  afterEach(() => {
    ctx.cleanup();
  });

  it('should do something', async () => {
    const result = await runScript('my-script', ['arg1'], ctx.projectDir);
    expect(result.exitCode).toBe(0);
    expect(fileExists(join(ctx.projectDir, 'expected-file'))).toBe(true);
  });
});
```

## PRD Test Coverage Verification

Tests are designed to match PRD v13.0 Testing section (lines 1066-1396). Each test group corresponds to PRD feature behaviors:

- **Project Initialization** (PRD 1084-1100)
- **Task Creation** (PRD 1102-1120)  
- **Task Switching** (PRD 1122-1141)
- **Context Saving** (PRD 1143-1167)
- **Context Listing** (PRD 1169-1186)
- **Context Management** (PRD 1188-1208)
- **Context Promotion** (PRD 1210-1229)
- **Two-File CLAUDE.md** (PRD 1231-1247)
- **Secret Detection** (PRD 1249-1269)
- **Git Integration** (PRD 1291-1308)
- **Cross-Platform** (PRD 1319-1329)
- **Error Handling** (PRD 1331-1350)
