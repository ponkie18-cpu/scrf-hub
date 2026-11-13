import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

// A separate, fresh Supabase workdir: never link or reset the hosted project.
const target = resolve(process.argv[2] ?? '');
const runnerTemp = process.env.RUNNER_TEMP && resolve(process.env.RUNNER_TEMP);
if (!runnerTemp || !target.startsWith(runnerTemp + '/') || existsSync(target)) {
  throw new Error('Pass a new directory inside RUNNER_TEMP; existing directories are refused.');
}
const source = resolve('supabase/migrations');
const files = readdirSync(source).filter(name => /^\d+_.+\.sql$/.test(name)).sort();
if (!files.length) throw new Error('No migrations found');
const versions = files.map(name => name.split('_')[0]);
if (new Set(versions).size !== versions.length) throw new Error('Duplicate migration versions');
if (versions.some(version => version >= '20990101000000')) throw new Error('Migration collides with CI marker version');
mkdirSync(join(target, 'supabase/migrations'), { recursive: true });
const manifest = files.map(name => {
  const contents = readFileSync(join(source, name));
  writeFileSync(join(target, 'supabase/migrations', name), contents);
  return { name, sha256: createHash('sha256').update(contents).digest('hex') };
});
writeFileSync(join(target, 'migration-manifest.json'), JSON.stringify(manifest, null, 2));
writeFileSync(join(target, 'supabase/config.toml'), `project_id = "scrf-security-ci"
[api]
port = 55431
[db]
port = 55432
shadow_port = 55430
major_version = 15
[db.seed]
enabled = false
[studio]
enabled = false
[local_smtp]
enabled = false
[storage]
enabled = false
[analytics]
enabled = false
[edge_runtime]
enabled = false
`);
// This marker exists ONLY in the disposable workdir, never in deployed migrations.
writeFileSync(join(target, 'supabase/migrations/20990101000000_ci_safety_marker.sql'), `
CREATE SCHEMA scrf_ci;
REVOKE ALL ON SCHEMA scrf_ci FROM PUBLIC, anon, authenticated, service_role;
CREATE TABLE scrf_ci.disposable_marker (purpose text PRIMARY KEY);
INSERT INTO scrf_ci.disposable_marker VALUES ('scrf-security-ci-only');
`);
console.log(`Prepared ${files.length} unmodified migrations plus one CI-only safety marker.`);
console.log(`No hosted credentials are read; database port is fixed to loopback:55432.`);