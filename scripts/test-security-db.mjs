import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const workdir = resolve(process.argv[2] ?? '');
const runnerTemp = process.env.RUNNER_TEMP && resolve(process.env.RUNNER_TEMP);
if (!runnerTemp || !workdir.startsWith(runnerTemp + '/')) {
  throw new Error('A disposable workdir inside RUNNER_TEMP is required.');
}
const manifest = JSON.parse(readFileSync(join(workdir, 'migration-manifest.json'), 'utf8'));
for (const entry of manifest) {
  const original = readFileSync(resolve('supabase/migrations', entry.name));
  const copied = readFileSync(join(workdir, 'supabase/migrations', entry.name));
  assert.equal(createHash('sha256').update(original).digest('hex'), entry.sha256);
  assert.deepEqual(original, copied, `Migration must be unmodified: ${entry.name}`);
}
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
// Deliberately no DATABASE_URL, hosted keys, or configurable host/port.
async function sql(statement, role = 'postgres', userId = null, jwtRole = role) {
  assert(['postgres', 'anon', 'authenticated', 'service_role'].includes(role));
  const claims = { role: jwtRole, ...(userId ? { sub: userId } : {}) };
  const prefix = `BEGIN; SET LOCAL statement_timeout = '15s'; SET LOCAL ROLE ${role};
    SET LOCAL "request.jwt.claims" = ${quote(JSON.stringify(claims))};
    SET LOCAL "request.jwt.claim.role" = ${quote(jwtRole)};
    SET LOCAL "request.jwt.claim.sub" = ${quote(userId ?? '')};`;
  const { stdout } = await exec('psql', [
    '-X', '--no-password', '--host=127.0.0.1', '--port=55432', '--username=postgres',
    '--dbname=postgres', '--quiet', '--tuples-only', '--no-align',
    '--set=ON_ERROR_STOP=1', '--set=VERBOSITY=verbose', '--command',
    `${prefix}\n${statement}\nCOMMIT;`,
  ], {
    timeout: 25000, maxBuffer: 1024 * 1024,
    env: { ...process.env, PGPASSWORD: 'postgres', PGHOSTADDR: '127.0.0.1',
      PGOPTIONS: '', PGSERVICE: '', PGSSLMODE: 'disable' },
  });
  return stdout.trim();
}
let passed = 0;
async function test(name, fn) {
  await fn();
  console.log(`PASS ${++passed}: ${name}`);
}
async function denied(statement, role, userId, pattern = /42501/) {
  await assert.rejects(sql(statement, role, userId), error => pattern.test(error.stderr ?? ''));
}
const scalar = async (...args) => {
  const value = await sql(...args);
  return value === 't' ? true : value === 'f' ? false : JSON.parse(value);
};
await test('disposable database safety marker', async () => {
  assert.equal(await sql('SELECT purpose FROM scrf_ci.disposable_marker;'), 'scrf-security-ci-only');
});
await test('all repository migrations were replayed, in order, without skipping', async () => {
  const actual = await scalar(`SELECT json_agg(version ORDER BY version)
    FROM supabase_migrations.schema_migrations;`);
  assert.deepEqual(actual, [...manifest.map(m => m.name.split('_')[0]), '20990101000000']);
});

const member = randomUUID();
const other = randomUUID();
const admin = randomUUID();
const race = randomUUID();
const rollover = randomUUID();
const pro = randomUUID();
const trial = randomUUID();
const expired = randomUUID();
const fixtureIds = [member, other, admin, race, rollover, pro, trial, expired];
// No cleanup DELETE/reset: this entire isolated database dies with the CI runner.
await test('real signup triggers create a free subscription for every fixture', async () => {
  await sql(`INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    ${fixtureIds.map(id => `(${quote(id)}, ${quote(id + '@example.invalid')}, '{"full_name":"CI fixture"}'::jsonb)`).join(',')};
    INSERT INTO public.user_roles (user_id, role) VALUES (${quote(admin)}, 'admin');`);
  assert.equal(await scalar(`SELECT count(*)::int FROM public.user_subscriptions
    WHERE user_id IN (${fixtureIds.map(quote).join(',')}) AND tier = 'free_registered';`), fixtureIds.length);
});
await test('JWT context and SQL roles match the requested identities', async () => {
  for (const [role, id] of [['anon', null], ['authenticated', member], ['service_role', null]]) {
    const result = await scalar(`SELECT json_build_array(current_user, auth.role(), auth.uid());`, role, id);
    assert.deepEqual(result, [role, role, id]);
  }
});

for (const [role, id] of [['anon', null], ['authenticated', member], ['authenticated', admin]]) {
  const label = id === admin ? 'administrator' : role;
  for (const statement of [
    `UPDATE public.user_subscriptions SET tier = 'pro' WHERE user_id = ${quote(member)};`,
    `INSERT INTO public.user_subscriptions (user_id, tier) VALUES (${quote(randomUUID())}, 'pro');`,
    `UPDATE public.subscriptions SET plan_type = 'pro' WHERE user_id = ${quote(member)};`,
    `INSERT INTO public.subscriptions (user_id, plan_type) VALUES (${quote(randomUUID())}, 'pro');`,
    `SELECT public.activate_paid_subscription(${quote(member)}::uuid, 'fake-ci', 'fake-ci', 'fake-plan', now() + interval '30 days');`,
    `SELECT public.deactivate_subscription(${quote(member)}::uuid);`,
    `SELECT * FROM public.reserve_agent_quota(${quote(member)}::uuid);`,
    `INSERT INTO public.agent_conversations (user_id, role, content, server_verified)
      VALUES (${quote(member)}, 'assistant', 'forged', true);`,
    `UPDATE public.agent_conversations SET server_verified = true WHERE user_id = ${quote(member)};`,
  ]) {
    await test(`${label} cannot perform protected write/RPC: ${statement.split(/\s+/).slice(0, 4).join(' ')}`,
      () => denied(statement, role, id));
  }
  await test(`${label} has no billing-row deletion privilege`, async () => {
    assert.equal(await scalar(`SELECT has_table_privilege(current_user, 'public.subscriptions', 'DELETE');`, role, id), false);
  });
}

await test('member can read own subscription but not another user subscription', async () => {
  assert.deepEqual(await scalar(`SELECT json_agg(user_id) FROM public.user_subscriptions;`, 'authenticated', member), [member]);
});
await test('anonymous subscription reads reveal no rows', async () => {
  assert.equal(await scalar('SELECT count(*)::int FROM public.user_subscriptions;', 'anon'), 0);
});
await test('billing backend can activate a paid subscription', async () => {
  const result = await scalar(`SELECT public.activate_paid_subscription(${quote(other)}::uuid, 'ci-customer', 'ci-sub', 'ci-plan', now() + interval '30 days');`, 'service_role');
  assert.equal(result, true);
  assert.equal(await sql(`SELECT tier FROM public.user_subscriptions WHERE user_id = ${quote(other)};`), 'pro');
  assert.equal(await scalar(`SELECT subscription_active FROM public.user_subscriptions WHERE user_id = ${quote(other)};`), true);
  await sql(`UPDATE public.subscriptions SET plan_type = 'pro', billing_interval = 'monthly'
    WHERE user_id = ${quote(other)};`, 'service_role');
  assert.equal(await sql(`SELECT plan_type FROM public.subscriptions WHERE user_id = ${quote(other)};`, 'authenticated', other), 'pro');
});
await test('service SQL role without a service JWT cannot reserve quota', () =>
  assert.rejects(sql(`SELECT * FROM public.reserve_agent_quota(${quote(member)}::uuid);`, 'service_role', null, 'authenticated'),
    error => /42501/.test(error.stderr ?? '')));
await test('trial identity is caller-bound and cannot target a different user', () =>
  denied(`SELECT public.start_pro_trial(${quote(other)}::uuid);`, 'authenticated', member));
await test('own trial succeeds exactly once', async () => {
  const first = await scalar(`SELECT public.start_pro_trial(${quote(member)}::uuid);`, 'authenticated', member);
  const second = await scalar(`SELECT public.start_pro_trial(${quote(member)}::uuid);`, 'authenticated', member);
  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(await scalar(`SELECT trial_started_at IS NOT NULL FROM public.user_subscriptions WHERE user_id = ${quote(member)};`), true);
});

await test('backend verified history is readable only by its owner', async () => {
  await sql(`INSERT INTO public.agent_conversations (user_id, role, content, server_verified)
    VALUES (${quote(member)}, 'assistant', 'CI verified response', true);`, 'service_role');
  assert.equal(await scalar(`SELECT count(*)::int FROM public.agent_conversations WHERE server_verified;`, 'authenticated', member), 1);
  assert.equal(await scalar(`SELECT count(*)::int FROM public.agent_conversations;`, 'authenticated', other), 0);
});
await test('evaluation question management is denied to members and allowed to admins', async () => {
  const insert = `INSERT INTO public.eval_questions (question_text, category, expected_behaviour, difficulty)
    VALUES ('CI authorization fixture', 'greeting', 'Respond with a greeting', 'basic');`;
  await denied(insert, 'authenticated', member);
  await sql(insert, 'authenticated', admin);
  assert.equal(await scalar(`SELECT count(*)::int FROM public.eval_questions
    WHERE question_text = 'CI authorization fixture';`, 'authenticated', member), 0);
  assert.equal(await scalar(`SELECT count(*)::int FROM public.eval_questions
    WHERE question_text = 'CI authorization fixture';`, 'authenticated', admin), 1);
});

async function reserve(id, notBefore = null) {
  const barrier = notBefore
    ? `SELECT pg_sleep(GREATEST(0, EXTRACT(EPOCH FROM (${quote(notBefore)}::timestamptz - clock_timestamp()))));`
    : '';
  return scalar(`${barrier} SELECT json_build_object('allowed', r.allowed, 'remaining', r.remaining,
    'pid', pg_backend_pid(), 'transaction_started_at', now())
    FROM public.reserve_agent_quota(${quote(id)}::uuid) r;`, 'service_role');
}
async function contentionBatch(id) {
  const notBefore = new Date(Date.now() + 10000).toISOString();
  const results = await Promise.all(Array.from({ length: 30 }, () => reserve(id, notBefore)));
  assert.equal(new Set(results.map(r => r.pid)).size, 30);
  assert(results.every(r => Date.parse(r.transaction_started_at) < Date.parse(notBefore)),
    'all 30 transactions must be connected before the shared contention barrier');
  return results;
}
await test('30 independent concurrent connections admit exactly 10 free-tier calls', async () => {
  // Fresh OS process + psql connection per call, not a single-connection mock.
  const results = await contentionBatch(race);
  assert.equal(results.filter(r => r.allowed).length, 10);
  assert.equal(results.filter(r => !r.allowed).length, 20);
  assert.deepEqual(results.filter(r => r.allowed).map(r => r.remaining).sort((a,b) => a-b), [0,1,2,3,4,5,6,7,8,9]);
  assert(results.filter(r => !r.allowed).every(r => r.remaining === 0));
  assert.equal(await scalar(`SELECT call_count FROM public.ai_rate_limits WHERE user_id = ${quote(race)};`), 10);
  assert.equal((await reserve(other)).allowed, true, 'another user retains an independent quota');
});
await test('UTC window rollover is atomic under another 30 concurrent calls', async () => {
  await sql(`INSERT INTO public.ai_rate_limits (user_id, call_count, window_start)
    VALUES (${quote(rollover)}, 10, date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' - interval '1 day');`);
  const results = await contentionBatch(rollover);
  assert.equal(results.filter(r => r.allowed).length, 10);
  assert.deepEqual(await scalar(`SELECT json_build_array(call_count,
    window_start = date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
    FROM public.ai_rate_limits WHERE user_id = ${quote(rollover)};`), [10, true]);
});
await test('paid, active-trial and expired-trial limits are enforced at their boundaries', async () => {
  await sql(`UPDATE public.user_subscriptions SET tier = 'pro' WHERE user_id = ${quote(pro)};
    UPDATE public.user_subscriptions SET trial_ends_at = now() + interval '1 day' WHERE user_id = ${quote(trial)};
    UPDATE public.user_subscriptions SET trial_ends_at = now() - interval '1 day' WHERE user_id = ${quote(expired)};
    INSERT INTO public.ai_rate_limits (user_id, call_count, window_start) VALUES
      (${quote(pro)}, 999998, date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'),
      (${quote(trial)}, 999998, date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'),
      (${quote(expired)}, 9, date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');`);
  for (const id of [pro, trial, expired]) {
    const last = await reserve(id);
    const deniedCall = await reserve(id);
    assert.deepEqual([last.allowed, last.remaining, deniedCall.allowed, deniedCall.remaining], [true, 0, false, 0]);
  }
});
console.log(`All ${passed} real-database security checks passed. No hosted resources were contacted.`);