import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendScheduledBroadcast } from "@/lib/queries/broadcast";

// Service-role client bypasses RLS — this route runs with no logged-in user,
// but insertRecipientsAndNotify() writes recipients/notifications for other users.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export async function POST(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: overdue, error } = await supabase
      .from("broadcasts")
      .select("id")
      .eq("status", "scheduled")
      .lte("scheduled_for", new Date().toISOString());

    if (error) throw error;

    const results = await Promise.allSettled(
      (overdue || []).map((b) => sendScheduledBroadcast(b.id, { client: supabase }))
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results
      .map((r, i) => (r.status === "rejected" ? { id: overdue[i].id, error: r.reason?.message } : null))
      .filter(Boolean);

    if (failed.length) console.error("[cron/send-scheduled-broadcasts] failures:", failed);

    return NextResponse.json({ success: true, checked: overdue?.length || 0, sent, failed });
  } catch (err) {
    console.error("[cron/send-scheduled-broadcasts] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
