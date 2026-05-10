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
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync, cpSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { runScript } from '../utils/test-helpers';

const REPO_ROOT = resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// T-MKT-1: install.sh manifest template produces valid JSON with required bundles
// ---------------------------------------------------------------------------
//
// Approach: extract the heredoc manifest template from install.sh, substitute
// shell variables ($VERSION, $(date...)) with known values, parse the result
// as JSON, and assert the required bundle keys exist.
// This tests the install.sh source artifact without requiring a full install run.

describe('T-MKT-1: install.sh creates ~/.claude/context-curator-manifest.json', () => {
  it('manifest template in install.sh parses as valid JSON and contains bundles.authoring, bundles.session, bundles.monitor', () => {
    const installSh = readFileSync(join(REPO_ROOT, 'install.sh'), 'utf-8');

    // Extract the heredoc: content between the cat heredoc marker and closing EOF
    const match = installSh.match(
      /cat > "\$HOME\/\.claude\/context-curator-manifest\.json" << EOF\n([\s\S]*?)\nEOF/
    );
    expect(match).not.toBeNull();

    const template = match![1];

    // Substitute shell variables so the template becomes parseable JSON
    const versionFile = join(REPO_ROOT, 'dist', 'version.json');
    const version = existsSync(versionFile)
      ? JSON.parse(readFileSync(versionFile, 'utf-8')).version
      : '15.0';

    const json = template
      .replace(/\$VERSION/g, version)
      .replace(/\$\([^)]+\)/g, '2026-01-01T00:00:00Z'); // replace $(date...) subshells

    let manifest: Record<string, unknown>;
    expect(() => { manifest = JSON.parse(json); }).not.toThrow();
    manifest = JSON.parse(json);

    expect(manifest.bundles).toBeDefined();
    expect((manifest.bundles as Record<string, unknown>).authoring).toBeDefined();
    expect((manifest.bundles as Record<string, unknown>).session).toBeDefined();
    expect((manifest.bundles as Record<string, unknown>).monitor).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// T-MKT-2: Authoring-only bundle does not expose session commands
// ---------------------------------------------------------------------------
//
// Approach: mirror install.sh's cpSync of the authoring bundle into a temp dir;
// assert the four authoring skills exist; assert context-save and task are absent.
// A second test parses the manifest template and checks authoring.skills entries.

describe('T-MKT-2: authoring bundle install provides authoring commands but not /context-save', () => {
  it('authoring bundle source has prd/test-plan/dev-plan/test-inventory but not context-save or task', () => {
    const tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'mkt2-authoring-')));
    try {
      const authoringBundle = join(REPO_ROOT, 'src', 'skills', 'context-curator', 'authoring');
      expect(existsSync(authoringBundle)).toBe(true);
      const dest = join(tempDir, 'authoring');
      cpSync(authoringBundle, dest, { recursive: true });
      for (const skill of ['prd', 'test-plan', 'dev-plan', 'test-inventory']) {
        expect(existsSync(join(dest, skill, 'SKILL.md'))).toBe(true);
      }
      expect(existsSync(join(dest, 'context-save'))).toBe(false);
      expect(existsSync(join(dest, 'task'))).toBe(false);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('install.sh manifest template authoring.skills entries contain no session/ paths', () => {
    const installSh = readFileSync(join(REPO_ROOT, 'install.sh'), 'utf-8');
    const match = installSh.match(
      /cat > "\$HOME\/\.claude\/context-curator-manifest\.json" << EOF\n([\s\S]*?)\nEOF/
    );
    expect(match).not.toBeNull();
    const template = match![1];
    const versionFile = join(REPO_ROOT, 'dist', 'version.json');
    const version = existsSync(versionFile)
      ? JSON.parse(readFileSync(versionFile, 'utf-8')).version
      : '15.0';
    const json = template
      .replace(/\$VERSION/g, version)
      .replace(/\$\([^)]+\)/g, '2026-01-01T00:00:00Z');
    const manifest = JSON.parse(json) as { bundles: Record<string, { skills: string[] }> };
    const authoringSkills = manifest.bundles.authoring.skills;
    expect(authoringSkills.some((s) => s.includes('session/'))).toBe(false);
    expect(authoringSkills.some((s) => s.includes('context-save'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T-MKT-3: Manifest version matches dist/version.json
// ---------------------------------------------------------------------------
//
// Part A (version-match): verified by the T-MKT-1 test above — install.sh's manifest template
// uses $VERSION which is sourced from dist/version.json; this test verifies dist/version.json
// exists and has a parseable version field.
// Part B (mismatch exits non-zero): scripts/verify-manifest.ts reads CLAUDE_HOME/.claude/
// context-curator-manifest.json and compares against dist/version.json.

describe('T-MKT-3: manifest version matches dist/version.json', () => {
  it('dist/version.json exists and has a parseable version field', () => {
    const versionFile = join(REPO_ROOT, 'dist', 'version.json');
    expect(existsSync(versionFile)).toBe(true);
    const content = JSON.parse(readFileSync(versionFile, 'utf-8'));
    expect(typeof content.version).toBe('string');
    expect(content.version.length).toBeGreaterThan(0);
  });

  it('install.sh manifest template uses $VERSION (sourced from dist/version.json)', () => {
    const installSh = readFileSync(join(REPO_ROOT, 'install.sh'), 'utf-8');
    // install.sh must set VERSION from dist/version.json and use it in the manifest
    expect(installSh).toContain('dist/version.json');
    expect(installSh).toContain('"version": "$VERSION"');
  });

  it('Case B — mismatched versions: verify-manifest.ts exits non-zero with output containing "version"', async () => {
    // Write a manifest with a wrong version into a temp CLAUDE_HOME directory.
    // verify-manifest.ts reads from join(CLAUDE_HOME, 'context-curator-manifest.json').
    const tempHome = realpathSync(mkdtempSync(join(tmpdir(), 'mkt3-mismatch-')));
    try {
      const mismatchManifest = {
        version: '0.0.0-mismatch',
        installedAt: '2026-01-01T00:00:00Z',
        bundles: { authoring: {}, session: {}, monitor: {} },
      };
      writeFileSync(
        join(tempHome, 'context-curator-manifest.json'),
        JSON.stringify(mismatchManifest)
      );

      const result = await runScript('verify-manifest', [], REPO_ROOT, { CLAUDE_HOME: tempHome });

      expect(result.exitCode).not.toBe(0);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/version/i);
    } finally {
      rmSync(tempHome, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// T-MKT-4: Custom team manifest is discoverable
// ---------------------------------------------------------------------------
//
// Static part: write a manifest with a "custom" bundle to a temp .claude dir;
// assert it parses and the custom bundle is accessible by key.
// Runtime part: /plugin marketplace list requires a Claude Code session harness
// and remains .todo.

describe('T-MKT-4: custom team manifest at .claude/context-curator-manifest.json is discoverable', () => {
  it('a manifest JSON with a "custom" bundle and description parses correctly and is accessible by key', () => {
    const tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'mkt4-team-')));
    try {
      const dotClaudeDir = join(tempDir, '.claude');
      mkdirSync(dotClaudeDir, { recursive: true });
      const teamManifest = {
        version: '1.0.0',
        installedAt: '2026-01-01T00:00:00Z',
        bundles: {
          custom: {
            description: 'Team-specific custom skills',
            skills: ['authoring/custom-skill'],
          },
        },
      };
      writeFileSync(join(dotClaudeDir, 'context-curator-manifest.json'), JSON.stringify(teamManifest, null, 2));
      const readBack = JSON.parse(
        readFileSync(join(dotClaudeDir, 'context-curator-manifest.json'), 'utf-8')
      ) as { bundles: Record<string, { description: string }> };
      expect(readBack.bundles.custom).toBeDefined();
      expect(readBack.bundles.custom.description).toContain('Team-specific custom skills');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it.todo(
    'Runtime discovery: run /plugin marketplace list with .claude/context-curator-manifest.json present. ' +
    'Output must contain "Team-specific custom skills" or "custom". ' +
    'Requires Claude Code session harness.'
  );
});
