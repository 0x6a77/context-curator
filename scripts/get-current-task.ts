#!/usr/bin/env tsx

/**
 * get-current-task.ts - Get the current task from .claude/CLAUDE.md @import line
 * 
 * v13.0: Supports both golden and personal task imports
 * - Golden: @import .claude/tasks/<task-id>/CLAUDE.md
 * - Personal: @import ~/.claude/projects/<project-id>/tasks/<task-id>/CLAUDE.md
 */

import { getCurrentTask } from '../src/utils.js';

getCurrentTask()
  .then(task => console.log(task))
  .catch(() => console.log('default'));
