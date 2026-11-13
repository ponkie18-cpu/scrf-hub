import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { localPostgresEnv } from './security-db-env.mjs';

const root = process.cwd();
const temporaryRoot = resolve('.security-ci-safety-tests');
mkdirSync(temporaryRoot, { recursive: true });
const runnerTemp = mkdtempSync(join(temporaryRoot, 'run-'));
const env = { ...process.env, RUNNER_TEMP: runnerTemp };
const prepare = resolve('scripts/prepare-security-db.mjs');
const integration = resolve('scripts/test-security-db.mjs');
const node = process.execPath;

test('local connections omit empty and inherited libpq services and connection overrides', () => {
  for (const service of ['', 'hosted-service']) {
    const childEnv = localPostgresEnv({
      PATH: '/usr/bin', PGSERVICE: service, PGSERVICEFILE: '/hosted/services',
      PGHOST: 'remote.invalid', PGHOSTADDR: '192.0.2.1', PGPORT: '5432',
      PGDATABASE: 'hosted', PGUSER: 'remote-user', PGPASSWORD: 'not-a-real-secret',
      PGPASSFILE: '/hosted/passwords', PGOPTIONS: '-c search_path=hosted',
      PGSSLMODE: 'require', PGTARGETSESSIONATTRS: 'read-write',
    });
    assert.deepEqual(childEnv, {
      PATH: '/usr/bin', PGPASSWORD: 'postgres', PGHOSTADDR: '127.0.0.1',
      PGOPTIONS: '', PGSSLMODE: 'disable',
    });
    assert(!Object.hasOwn(childEnv, 'PGSERVICE'));
  }
});

test('preparation refuses a path outside RUNNER_TEMP', () => {
  const result = spawnSync(node, [prepare, root], { env, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /new directory inside RUNNER_TEMP/);
});
test('preparation refuses absent RUNNER_TEMP', () => {
  const result = spawnSync(node, [prepare, join(runnerTemp, 'absent')], {
    env: { ...env, RUNNER_TEMP: '' }, encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
});
test('preparation refuses existing directories without deleting their contents', () => {
  const result = spawnSync(node, [prepare, runnerTemp], { env, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
});
test('preparation copies every migration unchanged and isolates its CI-only marker', () => {
  const target = join(runnerTemp, 'fresh');
  execFileSync(node, [prepare, target], { env });
  const source = readdirSync('supabase/migrations').filter(n => n.endsWith('.sql')).sort();
  const copied = readdirSync(join(target, 'supabase/migrations')).sort();
  assert.deepEqual(copied, [...source, '20990101000000_ci_safety_marker.sql'].sort());
  for (const name of source) {
    assert.deepEqual(readFileSync(join(target, 'supabase/migrations', name)), readFileSync(join('supabase/migrations', name)));
  }
  const manifest = JSON.parse(readFileSync(join(target, 'migration-manifest.json'), 'utf8'));
  assert.deepEqual(manifest.map(m => m.name), source);
  assert(manifest.every(m => /^[a-f0-9]{64}$/.test(m.sha256)));
  const config = readFileSync(join(target, 'supabase/config.toml'), 'utf8');
  assert.match(config, /project_id = "scrf-security-ci"/);
  assert.match(config, /port = 55432/);
  assert.match(config, /\[local_smtp\]\nenabled = false/);
  assert.doesNotMatch(config, /\[inbucket\]/);
  assert.doesNotMatch(config, /woiezcydmmngzlbxraxl|supabase\.co/);
});
test('integration refuses an outside directory before attempting a database connection', () => {
  const result = spawnSync(node, [integration, root], { env, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /disposable workdir inside RUNNER_TEMP/);
  assert.doesNotMatch(result.stderr, /ENOENT.*psql|connection refused/i);
});