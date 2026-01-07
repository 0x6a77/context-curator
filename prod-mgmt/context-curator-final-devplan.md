# Developer Implementation Plan: Unified Context Command Interface

**Version:** 6.0
**Timeline:** 2-3 days
**Approach:** Refactor to unified `context <command>` syntax

---

## Overview

This plan implements the unified command interface where all curator operations use the `context` prefix. The core functionality (session reading, analysis, editor) is already implemented. This refactoring focuses on the command interface layer.

---

## Completed Work

✅ **Already Implemented:**
- Session reader (named + unnamed)
- Session writer with backups
- Session analyzer with recommendations
- Interactive editor with Claude API
- All individual command scripts
- TypeScript compilation working
- Help system
- Init script optimized

---

## Remaining Work: Command Interface Refactor

### Phase 1: Command Dispatcher (Day 1)

#### T1.1: Create Main Entry Point
**Duration:** 2 hours
**Priority:** P0

**File: scripts/context.ts**
```typescript
#!/usr/bin/env tsx
import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command = process.argv[2];
const args = process.argv.slice(3);

const commands: Record<string, string> = {
  'list': 'list.ts',
  'analyze': 'analyze.ts',
  'manage': 'manage.ts',
  'checkpoint': 'checkpoint.ts',
  'delete': 'delete.ts',
  'dump': 'dump.ts',
  'help': 'help.ts'
};

if (!command || !commands[command]) {
  console.error('\nUsage: context <command> [args]\n');
  console.error('Commands:');
  console.error('  list                           List all sessions');
  console.error('  analyze <session-id>           Analyze a session');
  console.error('  manage <session-id> <model>    Edit session interactively');
  console.error('  checkpoint <session-id> <name> Backup a session');
  console.error('  delete <session-id>            Remove a session');
  console.error('  dump <session-id> [type]       View raw session data');
  console.error('  help                           Show detailed help\n');
  process.exit(1);
}

// Execute the command script
const scriptPath = path.join(__dirname, commands[command]);
const proc = spawn('tsx', [scriptPath, ...args], {
  stdio: 'inherit',
  shell: false
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});
```

**Testing:**
```bash
tsx scripts/context.ts list
tsx scripts/context.ts analyze <session-id>
tsx scripts/context.ts help
tsx scripts/context.ts invalid-command  # Should show usage
```

#### T1.2: Rename Script Files
**Duration:** 30 minutes
**Priority:** P0

**Renames:**
```bash
mv scripts/show-sessions.ts scripts/list.ts
mv scripts/summarize.ts scripts/analyze.ts
```

**Update imports in renamed files:**
- No code changes needed, just file renames
- Scripts already have correct functionality

#### T1.3: Update package.json
**Duration:** 15 minutes
**Priority:** P0

**File: package.json**
```json
{
  "name": "claude-context-curator",
  "version": "0.2.0",
  "description": "Claude Code session manager with unified context interface",
  "type": "module",
  "scripts": {
    "init": "tsx scripts/init.ts",
    "context": "tsx scripts/context.ts",
    "list": "tsx scripts/list.ts",
    "analyze": "tsx scripts/analyze.ts",
    "manage": "tsx scripts/manage.ts",
    "checkpoint": "tsx scripts/checkpoint.ts",
    "delete": "tsx scripts/delete.ts",
    "dump": "tsx scripts/dump.ts",
    "help": "tsx scripts/help.ts"
  },
  "keywords": ["claude", "context", "session-manager"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

**Testing:**
```bash
npm run context list
npm run context analyze <id>
npm run context help
```

---

### Phase 2: Documentation Updates (Day 2)

#### T2.1: Update CLAUDE.md
**Duration:** 2 hours
**Priority:** P0

**File: CLAUDE.md**

Key changes:
- Update initialization instructions
- Replace all command examples with `context` syntax
- Update command interpretation mapping
- Add natural language to context command mappings

**Updated command examples:**
```markdown
### context list
List all sessions (named + unnamed for current project).

Usage:
```bash
npx tsx ~/.claude/skills/context-curator/scripts/context.ts list
```

Or using npm:
```bash
npm --prefix ~/.claude/skills/context-curator run context list
```

### context analyze <session-id>
Analyze a specific session in detail.

Usage:
```bash
npx tsx ~/.claude/skills/context-curator/scripts/context.ts analyze <session-id>
```

[etc...]
```

**Updated command interpretation:**
```markdown
### Command Interpretation

Users may phrase requests differently. Map these to commands:

- "show sessions", "list sessions" → context list
- "tell me about session X" → context analyze X
- "analyze session X" → context analyze X
- "clean up session X" → context manage X sonnet
- "optimize session X" → context manage X sonnet
- "backup session X as Y" → context checkpoint X Y
- "remove session X" → context delete X
- "dump session X" → context dump X
- "show user messages for X" → context dump X user
- "help" → context help
```

#### T2.2: Update help.ts
**Duration:** 1 hour
**Priority:** P0

**File: scripts/help.ts**

Update all command syntax to use `context` prefix:

```typescript
console.log('COMMANDS:');
console.log('');

console.log('  context list');
console.log('    List all sessions (named + unnamed for current project)');
console.log('    Usage: npm run context list');
console.log('');

console.log('  context analyze <session-id>');
console.log('    Analyze a session and show token breakdown with recommendations');
console.log('    Usage: npm run context analyze <session-id>');
console.log('    Example: npm run context analyze 8e14f625-bd1a-4e79-a382-2d6c0649df97');
console.log('');

console.log('  context manage <session-id> <model>');
console.log('    Interactive session editor with Claude API integration');
console.log('    Models: sonnet, opus, haiku');
console.log('    Usage: npm run context manage <session-id> <model>');
console.log('    Example: npm run context manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet');
// [etc...]
```

#### T2.3: Update README.md
**Duration:** 1 hour
**Priority:** P0

**File: README.md**

Update:
- Usage examples with new syntax
- Command reference section
- Quick start guide
- Examples section

**Key sections to update:**
```markdown
## Available Commands

All commands use the unified `context` interface:

### context list
List all sessions with details like message count and token usage.

```bash
npm run context list
```

### context analyze <session-id>
Get detailed analysis of a specific session.

```bash
npm run context analyze 8e14f625-bd1a-4e79-a382-2d6c0649df97
```

[etc...]
```

#### T2.4: Update setup.sh
**Duration:** 30 minutes
**Priority:** P0

**File: setup.sh**

Update example commands in the output:

```bash
echo "Commands:"
echo "  context list"
echo "  context analyze <session-id>"
echo "  context manage <session-id> <model>"
```

---

### Phase 3: Testing & Validation (Day 3)

#### T3.1: Unit Testing
**Duration:** 2 hours
**Priority:** P0

**Test all command paths:**

```bash
# Test dispatcher
npm run context                    # Should show usage
npm run context invalid            # Should show usage
npm run context help               # Should show help

# Test all commands
npm run context list
npm run context analyze <session-id>
npm run context manage <session-id> sonnet
npm run context checkpoint <id> backup
npm run context delete <id>
npm run context dump <id>
npm run context dump <id> user
```

**Validation checklist:**
- [ ] `context.ts` dispatches to correct scripts
- [ ] All commands work with new names
- [ ] Error messages show correct syntax
- [ ] Help shows all commands with examples
- [ ] Tab completion friendly syntax

#### T3.2: Integration Testing
**Duration:** 2 hours
**Priority:** P0

**Test full workflows:**

1. **List and analyze workflow:**
```bash
claude -r context-curator
context list
context analyze <session-id>
```

2. **Optimize workflow:**
```bash
context list
context checkpoint <id> before-optimize
context manage <id> sonnet
# [make changes]
@apply
```

3. **Dump workflow:**
```bash
context dump <id>
context dump <id> user
context dump <id> assistant
```

**Validation:**
- [ ] Natural language requests map correctly
- [ ] Commands work from curator session
- [ ] Error messages are helpful
- [ ] All session types (named/unnamed) work
- [ ] TypeScript compilation passes

#### T3.3: Documentation Review
**Duration:** 1 hour
**Priority:** P0

**Review all documentation:**
- [ ] README has correct command syntax
- [ ] CLAUDE.md has correct examples
- [ ] help.ts shows correct usage
- [ ] Package.json scripts are correct
- [ ] All code comments updated

---

## File Changes Summary

### New Files
- `scripts/context.ts` - Main command dispatcher

### Renamed Files
- `scripts/show-sessions.ts` → `scripts/list.ts`
- `scripts/summarize.ts` → `scripts/analyze.ts`

### Modified Files
- `package.json` - Update scripts and version
- `CLAUDE.md` - Update all command examples
- `scripts/help.ts` - Update command syntax
- `README.md` - Update documentation
- `setup.sh` - Update example commands
- `scripts/init.ts` - Update displayed commands

### No Changes Needed
- `src/` directory (all core logic unchanged)
- `scripts/manage.ts`
- `scripts/checkpoint.ts`
- `scripts/delete.ts`
- `scripts/dump.ts`

---

## Testing Checklist

### Command Dispatcher
- [ ] `npm run context` shows usage
- [ ] `npm run context help` works
- [ ] `npm run context list` works
- [ ] `npm run context analyze <id>` works
- [ ] `npm run context manage <id> <model>` works
- [ ] `npm run context checkpoint <id> <name>` works
- [ ] `npm run context delete <id>` works
- [ ] `npm run context dump <id>` works
- [ ] `npm run context dump <id> user` works
- [ ] Invalid commands show helpful error

### Natural Language Mapping
- [ ] "show sessions" → context list
- [ ] "analyze session X" → context analyze X
- [ ] "optimize session X" → context manage X sonnet
- [ ] "backup session X as Y" → context checkpoint X Y
- [ ] "dump session X" → context dump X

### Documentation
- [ ] README has correct command syntax
- [ ] CLAUDE.md has correct examples
- [ ] help command shows all commands
- [ ] setup.sh shows correct examples
- [ ] All examples use `context` prefix

### Backward Compatibility
- [ ] Old npm scripts still work (list, analyze, etc.)
- [ ] Existing sessions still readable
- [ ] No data migration needed

---

## Timeline

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | Command dispatcher, renames, package.json | 3 |
| 2 | Documentation updates (CLAUDE.md, README, help, setup) | 4.5 |
| 3 | Testing, validation, polish | 5 |
| **Total** | | **12.5 hours** |

**Estimated completion: 2-3 days**

---

## Success Criteria

### Technical
- Single entry point (`context.ts`) routes all commands
- All commands work with new syntax
- TypeScript compilation passes
- No breaking changes to core functionality
- Backward compatibility maintained

### User Experience
- Intuitive command structure
- Consistent syntax across all operations
- Clear error messages with command suggestions
- Helpful usage examples

### Documentation
- All docs updated with new syntax
- Clear migration examples
- Comprehensive help command
- README shows all commands

---

## Launch Checklist

- [ ] `scripts/context.ts` implemented
- [ ] Scripts renamed (show-sessions → list, summarize → analyze)
- [ ] `package.json` updated
- [ ] `CLAUDE.md` updated
- [ ] `help.ts` updated
- [ ] `README.md` updated
- [ ] `setup.sh` updated
- [ ] All tests passing
- [ ] TypeScript compilation clean
- [ ] Documentation complete
- [ ] Version bumped to 0.2.0

---

## Migration Notes

### For Users

Old command style still works via npm:
```bash
# Old (still works)
npm run show
npm run summarize <id>

# New (recommended)
npm run context list
npm run context analyze <id>
```

### For the Curator Agent

Update CLAUDE.md instructions to use new syntax in examples and interpretations. The agent should translate user requests to the new `context` commands while maintaining backward compatibility.
