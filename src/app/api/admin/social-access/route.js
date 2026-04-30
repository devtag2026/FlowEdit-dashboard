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
    const { clientId, socialAccess } = await req.json();
    if (!clientId || !socialAccess) {
      return NextResponse.json(
        { error: "Missing clientId or socialAccess" },
        { status: 400 }
      );
    }

    // Verify caller is authenticated and is an admin
    const authClient = await createAuthClient();
    const {
      data: { user: caller },
    } = await authClient.auth.getUser();

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ social_access: socialAccess })
      .eq("id", clientId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/social-access] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
