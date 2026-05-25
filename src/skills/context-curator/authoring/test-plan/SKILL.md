---
name: test-plan
description: >
  Test plan authoring assistant. Load when working on a file matching *test-plan*.md.
  Enforces banned patterns, fix priority tiers, and feature-group structure.
---

# /test-plan — Test Plan Format Skill

## Mandatory Sections (for /test-plan new)

1. Testing Philosophy
2. Banned Patterns (numbered list, minimum 6 items)
3. Fix Priority Tiers (Tier 1–5 or similar)
4. Environment Setup / Prerequisites
5. Feature Test Groups (one per F-XXX, same order as PRD)
6. Summary / Coverage Matrix

## Banned Patterns (enforce in all test code)

1. **Vacuous OR fallbacks** — `|| output.includes('context')`
2. **Conditional file-existence guards** — `if (fileExists(path)) { expect(...) }`
3. **Tautological type assertions** — `typeof x === 'number'`
4. **Placeholder assertions** — `expect(true).toBe(true)`
5. **Self-fulfilling setup** — Creating the file the test then checks for
6. **Broad digit regex** — `/\d+/.test(output)` when count is known
7. **Missing exit code assertion** — success must assert `exitCode === 0`

## Fix Priority Tiers

When reviewing test failures or auditing tests, classify each issue:

- **Tier 1 (Critical)**: Test verifies wrong thing; passes vacuously; exit-code assertion missing on non-zero path
- **Tier 2 (High)**: Banned pattern in use; assertion is too broad to catch regressions
- **Tier 3 (Medium)**: Test is flaky or depends on timing/ordering
- **Tier 4 (Low)**: Missing edge case coverage
- **Tier 5 (Informational)**: Code quality / readability

## On /test-plan new

Scaffold a complete test plan document following the mandatory section order above.
Pull F-XXX codes from the current PRD and create a feature test group for each.
