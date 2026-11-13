// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Synthetic PostgreSQL identities only; never connects to a hosted database.
const db = new PGlite();
const member = "00000000-0000-0000-0000-000000000001";
const other = "00000000-0000-0000-0000-000000000002";
const session = "00000000-0000-0000-0000-000000000003";
const legacyUser = "00000000-0000-0000-0000-000000000004";
const migration = (name: string) => readFile(path.join(process.cwd(), "supabase/migrations", name), "utf8");
async function actor(id: string | null, role = "authenticated") {
  await db.exec(`SET LOCAL ROLE ${role}`);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
    [id ?? "", role, JSON.stringify({ sub: id, role })]);
}
const reserve = () => db.query<{ allowed: boolean; remaining: number }>("SELECT * FROM reserve_agent_quota($1)", [member]);

beforeAll(async () => {
  await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.role',true) $$;
    GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;`);
  await db.exec(await migration("20260107091025_cca43e46-c7e3-4ed3-bea4-0ae9dc3fd355.sql"));
  await db.exec((await migration("20260107092703_8449732d-fa50-449e-942a-38af2f1aa252.sql")).split("-- Enable realtime")[0]);
  // Existing account from before the signup handler provisioned subscription rows.
  await db.query("INSERT INTO auth.users(id,email) VALUES ($1,'legacy@example.test')", [legacyUser]);
  for (const name of [
    "20260112053757_6a3aa9f6-bd96-4666-8139-9a797eaeab2b.sql",
    "20260308104855_8715f879-2b3e-4544-9f8c-9ab3d27caf32.sql",
    "20260308122433_1bc39ab4-7b79-46c6-ab16-458ef344722d.sql",
    "20260308164102_686e51e9-7c16-4310-8d11-653d3d49dfa5.sql",
    "20260308070132_5c5ea407-ddb6-44a2-a61e-6cc0670bfdd7.sql",
    "20260308093217_44f10e04-10b4-4da5-bd79-90d6c191edbe.sql",
  ]) await db.exec(await migration(name));
  // Model Supabase table grants before the forward migration revokes client writes.
  await db.exec("GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO anon,authenticated,service_role");
  await db.query("INSERT INTO auth.users(id,email) VALUES ($1,'first@example.test'),($2,'second@example.test')", [member, other]);
  await db.query("INSERT INTO agent_conversations(user_id,session_id,role,content) VALUES ($1,$2,'assistant','Untrusted legacy row')", [member, session]);
  await db.exec(await migration("20261113160000_authorization_hardening.sql"));
}, 30000);
beforeEach(() => db.exec("BEGIN"));
afterEach(() => db.exec("ROLLBACK; RESET ROLE"));
afterAll(() => db.close());

describe("subscription authority", () => {
  it.each(["tier='pro'", "trial_ends_at=now()+interval '1 year'", "max_saves=100000", "saves_used=0"])("denies direct client change: %s", async (change) => {
    await actor(member);
    await expect(db.query(`UPDATE user_subscriptions SET ${change} WHERE user_id=$1`, [member])).rejects.toThrow("permission denied");
  });
  it("denies direct entitlement insertion", async () => {
    await actor(member);
    await expect(db.query("INSERT INTO user_subscriptions(user_id,tier) VALUES ($1,'pro')", [member])).rejects.toThrow("permission denied");
  });
  it("preserves own reads without exposing another account", async () => {
    await actor(member);
    expect((await db.query("SELECT user_id FROM user_subscriptions")).rows).toEqual([{ user_id: member }]);
  });
  it("preserves signup provisioning", async () => {
    await db.exec("INSERT INTO auth.users(id,email) VALUES ('00000000-0000-0000-0000-000000000099','new@example.test')");
    expect((await db.query("SELECT * FROM user_subscriptions")).rows).toHaveLength(3);
  });
  it("repairs only the caller's missing row with free defaults", async () => {
    await actor(legacyUser);
    expect((await db.query("SELECT ensure_own_subscription() AS created")).rows).toEqual([{ created: true }]);
    expect((await db.query("SELECT user_id,tier,saves_used,max_saves,trial_started_at FROM user_subscriptions")).rows).toEqual([
      { user_id: legacyUser, tier: "free_registered", saves_used: 0, max_saves: 3, trial_started_at: null },
    ]);
  });
  it("cannot reset an existing subscription by repeating repair", async () => {
    await db.query("UPDATE user_subscriptions SET tier='pro',saves_used=2 WHERE user_id=$1", [member]);
    await actor(member);
    expect((await db.query("SELECT ensure_own_subscription() AS created")).rows).toEqual([{ created: false }]);
    expect((await db.query("SELECT tier,saves_used FROM user_subscriptions")).rows).toEqual([{ tier: "pro", saves_used: 2 }]);
  });
  it("does not expose provisioning to anonymous callers", async () => {
    await actor(null, "anon");
    await expect(db.query("SELECT ensure_own_subscription()")).rejects.toThrow("permission denied");
  });
  it("preserves one-time own-account trials", async () => {
    await actor(member);
    expect((await db.query("SELECT start_pro_trial($1) AS started", [member])).rows).toEqual([{ started: true }]);
    expect((await db.query("SELECT start_pro_trial($1) AS started", [member])).rows).toEqual([{ started: false }]);
  });
  it("preserves own-account save increments", async () => {
    await actor(member);
    expect((await db.query("SELECT increment_saves_used($1) AS saved", [member])).rows).toEqual([{ saved: true }]);
  });
  it("protects the subscription row even if UPDATE is accidentally granted again", async () => {
    await db.exec("GRANT UPDATE ON user_subscriptions TO authenticated; CREATE POLICY test_accidental_update ON user_subscriptions FOR UPDATE TO authenticated USING (auth.uid()=user_id)");
    await actor(member);
    await expect(db.query("UPDATE user_subscriptions SET tier='pro' WHERE user_id=$1", [member])).rejects.toThrow("authorized backend operation");
  });
  it("protects insertion even if table INSERT is accidentally granted again", async () => {
    await db.exec("GRANT INSERT ON user_subscriptions TO authenticated");
    await actor(member);
    await expect(db.query("INSERT INTO user_subscriptions(user_id,tier) VALUES ($1,'pro')", [member])).rejects.toThrow("row-level security");
  });
  it("preserves own entitlement helpers while concealing another user's paid tier", async () => {
    await db.query("UPDATE user_subscriptions SET tier='pro' WHERE user_id=$1", [other]);
    await actor(member);
    expect((await db.query("SELECT get_user_tier($1) AS tier,can_user_save($1) AS can_save", [member])).rows).toEqual([{ tier: "free_registered", can_save: true }]);
    expect((await db.query("SELECT get_user_tier($1) AS tier,can_user_save($1) AS can_save", [other])).rows).toEqual([{ tier: "anonymous", can_save: false }]);
  });
  it.each(["start_pro_trial", "increment_saves_used", "get_user_tier", "can_user_save"])("removes anonymous execution of %s", async (fn) => {
    expect((await db.query("SELECT has_function_privilege('anon',$1,'EXECUTE') AS allowed", [`${fn}(uuid)`])).rows).toEqual([{ allowed: false }]);
  });
  it.each(["start_pro_trial", "increment_saves_used"])("denies cross-user %s", async (fn) => {
    await actor(member);
    await expect(db.query(`SELECT ${fn}($1)`, [other])).rejects.toThrow("Own account required");
  });
  it.each(["anon", "authenticated"])("removes %s access to payment RPCs", async (role) => {
    const result = await db.query("SELECT has_function_privilege($1,'activate_paid_subscription(uuid,text,text,text,timestamptz)','EXECUTE') AS activate,has_function_privilege($1,'deactivate_subscription(uuid)','EXECUTE') AS deactivate", [role]);
    expect(result.rows).toEqual([{ activate: false, deactivate: false }]);
  });
  it("denies actual client invocation of backend billing", async () => {
    await actor(member);
    await expect(db.query("SELECT activate_paid_subscription($1,'x','x','x',now())", [other])).rejects.toThrow("permission denied");
  });
  it("preserves service-role payment activation and cancellation", async () => {
    await actor(null, "service_role");
    expect((await db.query("SELECT activate_paid_subscription($1,'x','x','x',now()) AS changed", [other])).rows).toEqual([{ changed: true }]);
    expect((await db.query("SELECT tier FROM user_subscriptions WHERE user_id=$1", [other])).rows).toEqual([{ tier: "pro" }]);
    expect((await db.query("SELECT deactivate_subscription($1) AS changed", [other])).rows).toEqual([{ changed: true }]);
  });
});

describe("atomic agent quota", () => {
  it("allows ten free reservations then denies without incrementing", async () => {
    await actor(null, "service_role");
    for (let i = 0; i < 10; i++) expect((await reserve()).rows).toEqual([{ allowed: true, remaining: 9 - i }]);
    expect((await reserve()).rows).toEqual([{ allowed: false, remaining: 0 }]);
    expect((await db.query("SELECT call_count FROM ai_rate_limits")).rows).toEqual([{ call_count: 10 }]);
  });
  it("resets a prior UTC day atomically", async () => {
    await db.query("INSERT INTO ai_rate_limits(user_id,call_count,window_start) VALUES ($1,10,now()-interval '2 days')", [member]);
    await actor(null, "service_role");
    expect((await reserve()).rows).toEqual([{ allowed: true, remaining: 9 }]);
  });
  it("derives paid limits from stored entitlements", async () => {
    await actor(null, "service_role");
    await db.query("SELECT activate_paid_subscription($1,'x','x','x',now())", [member]);
    expect((await reserve()).rows).toEqual([{ allowed: true, remaining: 999998 }]);
  });
  it("recognizes a valid trial without changing the stored tier", async () => {
    await actor(member);
    await db.query("SELECT start_pro_trial($1)", [member]);
    await actor(null, "service_role");
    expect((await reserve()).rows).toEqual([{ allowed: true, remaining: 999998 }]);
  });
  it.each(["anon", "authenticated"])("denies %s direct quota access", async (role) => {
    await actor(member, role);
    await expect(reserve()).rejects.toThrow("permission denied");
  });
});

describe("server-owned conversation history", () => {
  it("does not retroactively trust legacy messages", async () => {
    expect((await db.query("SELECT server_verified FROM agent_conversations")).rows).toEqual([{ server_verified: false }]);
  });
  it.each(["user", "assistant"])("blocks direct client inserts, including claimed verification: %s", async (role) => {
    await actor(member);
    await expect(db.query("INSERT INTO agent_conversations(user_id,session_id,role,content,server_verified) VALUES ($1,$2,$3,'Forged',true)", [member, session, role])).rejects.toThrow("permission denied");
  });
  it("preserves backend writes and own-user reads", async () => {
    await actor(null, "service_role");
    await db.query("INSERT INTO agent_conversations(user_id,session_id,role,content,server_verified) VALUES ($1,$2,'assistant','Verified',true),($3,$2,'assistant','Other user',true)", [member, session, other]);
    await actor(member);
    expect((await db.query("SELECT content FROM agent_conversations WHERE server_verified=true")).rows).toEqual([{ content: "Verified" }]);
  });
  it("keeps history client-insert protection if table INSERT is accidentally granted again", async () => {
    await db.exec("GRANT INSERT ON agent_conversations TO authenticated");
    await actor(member);
    await expect(db.query("INSERT INTO agent_conversations(user_id,session_id,role,content,server_verified) VALUES ($1,$2,'assistant','Forged',true)", [member, session])).rejects.toThrow("row-level security");
  });
});