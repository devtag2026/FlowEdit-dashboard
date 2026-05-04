/**
 * Notification Preferences Integration Test
 *
 * Verifies the notification_preferences JSONB column exists on profiles
 * and that reads/writes persist correctly.
 *
 * Run with: node src/tests/notification-prefs.test.js
 *
 * Requires these env vars (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY   (service role — bypasses RLS so any profile can be tested)
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("FAIL: Missing env vars. Run: node --env-file=.env.local src/tests/notification-prefs.test.js");
  process.exit(1);
}

const supabase = createClient(url, key);

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`  ✓  ${label}`);
  passed++;
}

function fail(label, detail) {
  console.error(`  ✗  ${label}${detail ? ` — ${detail}` : ""}`);
  failed++;
}

async function run() {
  console.log("\nNotification Preferences — Integration Test\n");

  // ── 1. Find a profile to test with ─────────────────────────────────────────
  const { data: profiles, error: listErr } = await supabase
    .from("profiles")
    .select("id, notification_preferences")
    .limit(1)
    .maybeSingle();

  if (listErr) {
    if (listErr.message?.includes("notification_preferences")) {
      fail("Column exists", "notification_preferences column not found — run the migration:\n     ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT \\'{}\\'::jsonb;");
    } else {
      fail("Fetch profile", listErr.message);
    }
    console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
    process.exit(failed > 0 ? 1 : 0);
  }

  if (!profiles) {
    fail("Find test profile", "No profiles found in DB — seed at least one user first");
    console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
    process.exit(1);
  }

  pass("Column exists — notification_preferences is queryable");

  const profileId = profiles.id;
  const originalPrefs = profiles.notification_preferences ?? {};
  console.log(`  → Testing with profile: ${profileId}`);
  console.log(`  → Original prefs:`, JSON.stringify(originalPrefs));

  // ── 2. Write a test preference ──────────────────────────────────────────────
  const testPrefs = {
    ...originalPrefs,
    _test_marker: true,
    project_updates: true,
    revision_requests: false,
  };

  const { error: writeErr } = await supabase
    .from("profiles")
    .update({ notification_preferences: testPrefs })
    .eq("id", profileId);

  if (writeErr) {
    fail("Write preferences", writeErr.message);
  } else {
    pass("Write preferences — update succeeded");
  }

  // ── 3. Re-fetch and verify ──────────────────────────────────────────────────
  const { data: refetched, error: refetchErr } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", profileId)
    .single();

  if (refetchErr) {
    fail("Re-fetch profile", refetchErr.message);
  } else if (refetched?.notification_preferences?._test_marker !== true) {
    fail("Preferences persisted", `Expected _test_marker=true, got: ${JSON.stringify(refetched?.notification_preferences)}`);
  } else if (refetched?.notification_preferences?.project_updates !== true) {
    fail("Preferences persisted", "project_updates should be true");
  } else if (refetched?.notification_preferences?.revision_requests !== false) {
    fail("Preferences persisted", "revision_requests should be false");
  } else {
    pass("Preferences persisted — values match after re-fetch");
  }

  // ── 4. Revert to original ───────────────────────────────────────────────────
  const { error: revertErr } = await supabase
    .from("profiles")
    .update({ notification_preferences: originalPrefs })
    .eq("id", profileId);

  if (revertErr) {
    fail("Revert preferences", revertErr.message);
  } else {
    pass("Revert — original preferences restored");
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
