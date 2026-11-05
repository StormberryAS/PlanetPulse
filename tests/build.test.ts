// The build: the committed app.js is what ts/app.ts compiles to, and the only JavaScript in the
// repository is that compiled output plus the generator output cities.js, each marked for GitHub's
// language bar (Marcos, 2026-10-17: no hand-written JavaScript). The generator output (cities.js)
// is held byte for byte: SunApp's update_cities.py writes it, and it is never edited here. When the
// generator writes a new version, update its hash below in the same commit.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const COMPILED = ['app.js'];
/** The generator output, by sha256, as at 7019baf (cities.js is also SunApp's, byte for byte). */
const GENERATED: Record<string, string> = {
  'cities.js': '2f08782c7f41df5eb95c15a4a668a389505bd4bfba059040d048cbc1324afce2',
};
const GENERATED_JS = Object.keys(GENERATED).filter((f) => f.endsWith('.js'));

test('tools/build-ts.sh --check passes: app.js equals a fresh compile', () => {
  const out = execFileSync(`${root}tools/build-ts.sh`, ['--check'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  assert.match(out, /^build-ts: app\.js matches ts\/app\.ts$/m);
  assert.match(out, /^build-ts: check passed$/m);
});

test('the generator output (cities.js) is unchanged, byte for byte', () => {
  for (const [f, sha] of Object.entries(GENERATED)) {
    assert.equal(createHash('sha256').update(readFileSync(`${root}${f}`)).digest('hex'), sha, f);
  }
  assert.match(readFileSync(`${root}cities.js`, 'utf8'), /^\/\/ Stormberry Labs shared city catalogue\.\n\/\/ GENERATED FILE, DO NOT EDIT BY HAND\.\n/);
});

test('the only JavaScript is compiled or generated output, each file marked so', (t) => {
  const git = (...args: string[]): string => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  let inGit = false;
  try { inGit = git('rev-parse', '--is-inside-work-tree').trim() === 'true'; } catch { inGit = false; }
  if (!inGit) { t.skip('not a git checkout'); return; }
  const js = git('ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '*.js', '*.mjs', '*.cjs').split('\0').filter(Boolean);
  assert.deepEqual([...new Set(js)].sort(), [...COMPILED, ...GENERATED_JS].sort());
  for (const f of [...COMPILED, ...GENERATED_JS]) assert.equal(git('check-attr', 'linguist-generated', '--', f).trim(), `${f}: linguist-generated: true`);
});
