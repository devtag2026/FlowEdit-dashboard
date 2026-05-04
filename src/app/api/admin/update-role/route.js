import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Service-role client bypasses RLS — used only after admin identity is verified
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export async function POST(req) {
  try {
    const { userId, newRole } = await req.json();
    if (!userId || !newRole) {
      return NextResponse.json({ error: "Missing userId or newRole" }, { status: 400 });
    }
    if (!["client", "contractor"].includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Verify caller is authenticated and is an admin
    const authClient = await createAuthClient();
    const { data: { user: caller } } = await authClient.auth.getUser();
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();
    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)
      .select("id, role");

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: data[0] });
  } catch (err) {
    console.error("[admin/update-role] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
