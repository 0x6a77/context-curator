---
name: test-inventory
description: >
  Adversary task output format skill. Only available when adversary task is active.
  Loads the test inventory output schema and verdict definitions for consistent LoD2 reporting.
invocation: auto
guard: adversary-task-active
---

# /test-inventory — LoD2 Test Inventory Output Format

If the adversary task is NOT active, output:
```
Error: /test-inventory is only available when the adversary task is active.
```
and stop.

## Output Schema

The adversary's LoD2 analysis must produce `prod-mgmt/test-inventory.md` with the following structure:

### Findings Table

| T-Code | Feature | Test File | Verdict | Issue |
|--------|---------|-----------|---------|-------|
| T-XXX-N | F-XXX feature name | path/to/test.ts:line | PASS / FAIL / WEAK / MISSING | Short description |

Verdict definitions:
- **PASS**: Test correctly verifies the acceptance criterion
- **FAIL**: Test has a defect (banned pattern, wrong assertion, vacuous pass)
- **WEAK**: Test verifies *something* but not the specific criterion
- **MISSING**: No test found for this T-XXX code

### Coverage Gaps Section

After the findings table, list every F-XXX feature with zero test coverage.

### Summary Line

End with:
```
Coverage: N/M T-codes covered (X%)
```

## Banned Pattern Checklist

Before marking PASS, verify the test does NOT contain:
1. Vacuous OR fallback (broad `|| output.includes(...)`)
2. Conditional file-existence guard
3. Tautological type assertion
4. Placeholder `expect(true).toBe(true)`
5. Self-fulfilling setup
6. Broad digit regex when count is known
7. Missing exit code assertion on non-zero path
