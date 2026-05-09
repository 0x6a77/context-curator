/**
 * Skill Marketplace Tests (F-MARKETPLACE)
 *
 * T-MKT-1: install.sh creates ~/.claude/context-curator-manifest.json with bundles.authoring,
 *           bundles.session, and bundles.monitor; file is valid JSON
 * T-MKT-2: After installing authoring bundle only, /prd /test-plan /dev-plan /test-inventory
 *           are available and /context-save is NOT available
 * T-MKT-3: Manifest version field matches installed version from dist/version.json;
 *           a version mismatch exits non-zero with message containing "version"
 * T-MKT-4: A team manifest at .claude/context-curator-manifest.json with a custom bundle
 *           is discoverable via /plugin marketplace list
 *
 * All tests are .todo pending these install.sh changes:
 *   - Write ~/.claude/context-curator-manifest.json on install
 *   - Support selective bundle install (authoring-only, session-only, etc.)
 *   - Write dist/version.json during build
 *
 * T-MKT-1 could be promoted to a real test once install.sh is updated.
 */

import { describe, it } from 'vitest';

// ---------------------------------------------------------------------------
// T-MKT-1: install.sh creates valid manifest with all three bundle keys
// ---------------------------------------------------------------------------

describe('T-MKT-1: install.sh creates ~/.claude/context-curator-manifest.json', () => {
  it.todo(
    'After running ./install.sh: ' +
    '~/.claude/context-curator-manifest.json must exist. ' +
    'JSON.parse must not throw. ' +
    'Parsed object must have keys: manifest.bundles.authoring, manifest.bundles.session, manifest.bundles.monitor.'
  );
});

// ---------------------------------------------------------------------------
// T-MKT-2: Authoring-only bundle install does not expose session commands
// ---------------------------------------------------------------------------

describe('T-MKT-2: authoring bundle install provides authoring commands but not /context-save', () => {
  it.todo(
    'Install only the authoring bundle (./install.sh --bundle authoring or equivalent). ' +
    'Available slash commands must include: /prd, /test-plan, /dev-plan, /test-inventory. ' +
    '/context-save must NOT be in the available commands list.'
  );
});

// ---------------------------------------------------------------------------
// T-MKT-3: Manifest version matches dist/version.json
// ---------------------------------------------------------------------------

describe('T-MKT-3: manifest version matches dist/version.json', () => {
  it.todo(
    'Case A — matching versions: manifest.version === dist/version.json.version. Validation script exits 0. ' +
    'Case B — mismatched versions: write manifest with version "0.0.0-mismatch". ' +
    'Run verify-manifest.ts (or equivalent). Script exits non-zero AND output matches /version/i.'
  );
});

// ---------------------------------------------------------------------------
// T-MKT-4: Custom team manifest in .claude/ is discoverable
// ---------------------------------------------------------------------------

describe('T-MKT-4: custom team manifest at .claude/context-curator-manifest.json is discoverable', () => {
  it.todo(
    'Write .claude/context-curator-manifest.json with a "custom" bundle key and ' +
    'description "Team-specific custom skills". ' +
    'Run /plugin marketplace list (or the equivalent discovery command). ' +
    'Output must contain "Team-specific custom skills" or "custom".'
  );
});
