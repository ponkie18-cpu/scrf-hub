import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

// Helper to call an edge function
async function callFunction(
  name: string,
  body: Record<string, unknown>,
  token?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// ── send-contact-email ──────────────────────────────────────

Deno.test("send-contact-email — rejects missing fields", async () => {
  const res = await callFunction("send-contact-email", { name: "Test" });
  const json = await res.json();
  assertEquals(res.status, 400);
  assertEquals(json.success, false);
  assertEquals(json.errorCode, "VALIDATION_ERROR");
});

Deno.test("send-contact-email — rejects invalid email", async () => {
  const res = await callFunction("send-contact-email", {
    name: "Test",
    email: "not-an-email",
    message: "hello",
  });
  const json = await res.json();
  assertEquals(res.status, 400);
  assertEquals(json.success, false);
  assertEquals(json.errorCode, "VALIDATION_ERROR");
});

// ── scoring-engine ──────────────────────────────────────────

Deno.test("scoring-engine — rejects unauthenticated request", async () => {
  const res = await callFunction("scoring-engine", { type: "calculate_overall" });
  const json = await res.json();
  assertEquals(res.status, 401);
  assertExists(json.error);
});

// ── contract-analyser ───────────────────────────────────────

Deno.test("contract-analyser — rejects unauthenticated request", async () => {
  const res = await callFunction("contract-analyser", { contractText: "x".repeat(60) });
  const json = await res.json();
  assertEquals(res.status, 401);
  assertEquals(json.success, false);
});

// ── delete-user-data ────────────────────────────────────────

Deno.test("delete-user-data — rejects unauthenticated request", async () => {
  const res = await callFunction("delete-user-data", { confirm: "DELETE_MY_ACCOUNT" });
  const json = await res.json();
  assertEquals(res.status, 401);
  assertEquals(json.success, false);
});

// ── send-feedback-email ─────────────────────────────────────

Deno.test("send-feedback-email — rejects missing fields", async () => {
  const res = await callFunction("send-feedback-email", { email: "a@b.com" });
  const json = await res.json();
  assertEquals(res.status, 400);
  assertEquals(json.success, false);
  assertEquals(json.errorCode, "VALIDATION_ERROR");
});

// ── Response envelope structure ─────────────────────────────

Deno.test("error responses follow standard envelope", async () => {
  const res = await callFunction("send-contact-email", {});
  const json = await res.json();
  assertEquals(json.success, false);
  assertExists(json.errorCode);
  assertExists(json.message);
  assertEquals(typeof json.retryable, "boolean");
});
