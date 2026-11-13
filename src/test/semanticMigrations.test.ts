// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Real PostgreSQL (WASM), synthetic identities only. Never connects to Supabase.
const db = new PGlite();
const adminA = "00000000-0000-0000-0000-000000000001";
const adminB = "00000000-0000-0000-0000-000000000002";
const member = "00000000-0000-0000-0000-000000000003";
const other = "00000000-0000-0000-0000-000000000004";
const correction = "00000000-0000-0000-0000-000000000005";
const review = "00000000-0000-0000-0000-000000000006";
const readMigration = (name: string) => readFile(path.join(process.cwd(), "supabase/migrations", name), "utf8");
async function actor(id: string, role = "authenticated") {
  await db.exec(`SET LOCAL ROLE ${role}`);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claim.role',$2,true)", [id, role]);
}
async function submit() {
  await actor(adminA);
  return (await db.query<{ id: string }>("SELECT public.submit_knowledge_correction($1) AS id", [correction])).rows[0].id;
}
async function approve(id: string) {
  return db.query<{ id: string }>("SELECT public.approve_knowledge_correction($1,'ZA',now()+interval '90 days') AS id", [id]);
}

beforeAll(async () => {
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
      SELECT current_setting('request.jwt.claim.role',true) $$;
    GRANT USAGE ON SCHEMA auth,public TO authenticated,service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated,service_role;
  `);
  // Relevant historical DDL is read from the repository, not reimplemented.
  await db.exec(await readMigration("20260107091025_cca43e46-c7e3-4ed3-bea4-0ae9dc3fd355.sql"));
  await db.exec((await readMigration("20260107092703_8449732d-fa50-449e-942a-38af2f1aa252.sql")).split("-- Enable realtime")[0]);
  await db.exec(await readMigration("20260404074339_5ef15b07-9c14-480e-967f-c5ad4cf68c81.sql"));
  await db.exec(`CREATE TABLE public.expert_reviews(id uuid PRIMARY KEY, review_status text);
    INSERT INTO public.expert_reviews VALUES ('${review}','reviewed');`);
  await db.exec((await readMigration("20260308143940_0f618a6a-2ff7-4ddd-85a7-4f9aabb53499.sql")).split("-- Knowledge Corrections")[1]);
  await db.exec(await readMigration("20260308150724_59b941c4-853d-47ed-94a9-2acfd5a9eeeb.sql"));
  await db.exec((await readMigration("20260308093217_44f10e04-10b4-4da5-bd79-90d6c191edbe.sql"))
    .split("-- 3. Create audit_log")[1].split("CREATE TABLE IF NOT EXISTS public.audit_log")[1]
    .replace(/^/, "CREATE TABLE IF NOT EXISTS public.audit_log").split("-- 4.")[0]);
  await db.exec(`
    INSERT INTO auth.users(id,email) VALUES ('${adminA}','a@example.test'),('${adminB}','b@example.test'),
      ('${member}','member@example.test'),('${other}','other@example.test');
    INSERT INTO public.user_roles(user_id,role) VALUES ('${adminA}','admin'),('${adminB}','admin');
    INSERT INTO public.knowledge_corrections(id,review_id,domain,correction_type,original_agent_statement,corrected_statement,supporting_reference,severity)
      VALUES ('${correction}','${review}','general','factual_error','Old','Reviewed guidance','Synthetic reference','medium');
    INSERT INTO public.agent_knowledge_base(correction_id,domain,corrected_statement,applied_by)
      VALUES ('${correction}','general','Legacy unreviewed guidance','legacy@example.test');
  `);
  for (const name of ["20261113120000_context_access_policies.sql", "20261113120100_context_knowledge.sql", "20261113120200_context_audit.sql"]) {
    await db.exec(await readMigration(name));
  }
  await db.exec("GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated,service_role");
}, 30000);
beforeEach(() => db.exec("BEGIN"));
afterEach(() => db.exec("ROLLBACK; RESET ROLE"));
afterAll(() => db.close());

describe("semantic-layer migrations in isolated PostgreSQL", () => {
  it("leaves legacy knowledge in draft and invisible to ordinary users", async () => {
    expect((await db.query<{ status: string }>("SELECT status FROM agent_knowledge_base")).rows[0].status).toBe("draft");
    await actor(member);
    expect((await db.query("SELECT * FROM agent_knowledge_base")).rows).toHaveLength(0);
  });
  it("allows ordinary own-profile edits", async () => {
    await actor(member);
    expect((await db.query("UPDATE profiles SET name='Updated' WHERE id=$1 RETURNING name", [member])).rows).toHaveLength(1);
  });
  it.each(["role='admin'", `company_id=(SELECT company_id FROM profiles WHERE id='${member}')`])("blocks membership/role tampering: %s", async (change) => {
    // Set a known different company before switching to the authenticated role.
    const target = (await db.query<{ company_id: string }>("SELECT company_id FROM profiles WHERE id=$1", [other])).rows[0].company_id;
    await actor(member);
    const statement = change.startsWith("company_id") ? `company_id='${target}'` : change;
    await expect(db.query(`UPDATE profiles SET ${statement} WHERE id=$1`, [member])).rejects.toThrow("require administrator approval");
  });
  it("preserves trusted signup provisioning after profile INSERT policy restriction", async () => {
    const id = "00000000-0000-0000-0000-000000000099";
    await db.query("INSERT INTO auth.users(id,email) VALUES ($1,'new@example.test')", [id]);
    expect((await db.query("SELECT * FROM profiles WHERE id=$1", [id])).rows).toHaveLength(1);
  });
  it("denies ordinary-user publication RPC access", async () => {
    await actor(member);
    await expect(db.query("SELECT submit_knowledge_correction($1)", [correction])).rejects.toThrow("Administrator role required");
  });
  it("stages a reviewed snapshot idempotently without publishing", async () => {
    const first = await submit();
    const second = await submit();
    expect(first).toBe(second);
    expect((await db.query("SELECT * FROM agent_knowledge_base WHERE status='approved'")).rows).toHaveLength(0);
  });
  it("enforces four-eyes approval server-side", async () => {
    const id = await submit();
    await expect(approve(id)).rejects.toThrow("different verified administrator");
  });
  it("publishes atomically with verified approver, revision, audit record and retry safety", async () => {
    const id = await submit();
    await actor(adminB);
    const first = (await approve(id)).rows[0].id;
    expect((await approve(id)).rows[0].id).toBe(first);
    const entries = (await db.query<{ approved_by: string; revision: number; jurisdiction: string }>("SELECT * FROM agent_knowledge_base WHERE status='approved'")).rows;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ approved_by: adminB, revision: 2, jurisdiction: "ZA" });
    expect((await db.query("SELECT * FROM audit_log WHERE action='knowledge_correction_published'")).rows).toHaveLength(1);
    expect((await db.query<{ applied_to_system_prompt: boolean }>("SELECT applied_to_system_prompt FROM knowledge_corrections")).rows[0].applied_to_system_prompt).toBe(true);
  });
  it("rejects changed corrections rather than approving a stale snapshot", async () => {
    const id = await submit();
    await db.query("UPDATE knowledge_corrections SET corrected_statement='Changed' WHERE id=$1", [correction]);
    await actor(adminB);
    await expect(approve(id)).rejects.toThrow("changed since submission");
  });
  it("does not trust legacy email-only approval identities", async () => {
    const result = await db.query<{ id: string }>("INSERT INTO system_prompt_updates(correction_id,proposed_addition,submitted_by) VALUES ($1,'Old','someone@example.test') RETURNING id", [correction]);
    await actor(adminB);
    await expect(approve(result.rows[0].id)).rejects.toThrow("different verified administrator");
  });
  it("rolls back knowledge publication if the mandatory audit write fails", async () => {
    const id = await submit();
    await db.exec("RESET ROLE; CREATE FUNCTION reject_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit unavailable'; END; $$; CREATE TRIGGER reject_audit BEFORE INSERT ON audit_log FOR EACH ROW EXECUTE FUNCTION reject_test_audit();");
    await actor(adminB);
    await db.exec("SAVEPOINT attempt");
    await expect(approve(id)).rejects.toThrow("audit unavailable");
    await db.exec("ROLLBACK TO SAVEPOINT attempt");
    expect((await db.query("SELECT * FROM agent_knowledge_base WHERE status='approved'")).rows).toHaveLength(0);
    expect((await db.query<{ status: string }>("SELECT status FROM system_prompt_updates WHERE id=$1", [id])).rows[0].status).toBe("pending");
  });
  it("prevents direct authenticated approval-table writes", async () => {
    await actor(adminA);
    await expect(db.query("INSERT INTO system_prompt_updates(correction_id,proposed_addition,submitted_by) VALUES ($1,'Bypass','spoofed')", [correction])).rejects.toThrow("row-level security");
  });
  it("only returns eligible global or own-company knowledge under RLS", async () => {
    await db.exec(`INSERT INTO agent_knowledge_base(domain,corrected_statement,supporting_reference,status,scope,company_id,jurisdiction,approved_by,approved_at,review_due_at)
      SELECT 'general','Company knowledge','Synthetic','approved','company',company_id,'ZA','${adminB}',now(),now()+interval '90 days' FROM profiles WHERE id='${other}';`);
    await actor(member);
    expect((await db.query("SELECT * FROM agent_knowledge_base")).rows).toHaveLength(0);
  });
  it("keeps context metadata user-private and hides expired metadata", async () => {
    await db.exec(`INSERT INTO agent_context_events(request_id,user_id,context_schema_version,policy_version,scoring_version,configuration_hash,fetch_latency_ms,expires_at)
      VALUES (gen_random_uuid(),'${member}','1','policy','score','hash',1,now()+interval '1 day'),
      (gen_random_uuid(),'${other}','1','policy','score','hash',1,now()+interval '1 day'),
      (gen_random_uuid(),'${member}','1','policy','score','hash',1,now()-interval '1 day');`);
    await actor(member);
    expect((await db.query("SELECT * FROM agent_context_events")).rows).toHaveLength(1);
  });
});