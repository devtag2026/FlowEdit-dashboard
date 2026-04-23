// src/app/auth/callback/route.js
// Kept simple — the DB trigger handles pending_subscriptions merge on user creation
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/dashboard";

  if (!next.startsWith("/")) {
    next = "/dashboard";
  }

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Auto-complete base onboarding steps for contractors on every login
      const userId = sessionData?.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (profile?.role === "contractor") {
          const now = new Date().toISOString();

          // Ensure all 5 step rows exist — ignoreDuplicates means existing rows are never overwritten
          await supabase
            .from("onboarding_steps")
            .upsert(
              [
                { contractor_id: userId, step_key: "start",    label: "Start",    completed: false },
                { contractor_id: userId, step_key: "account",  label: "Account",  completed: false },
                { contractor_id: userId, step_key: "profile",  label: "Profile",  completed: false },
                { contractor_id: userId, step_key: "contract", label: "Contract", completed: false },
                { contractor_id: userId, step_key: "signed",   label: "Signed",   completed: false },
              ],
              { onConflict: "contractor_id,step_key", ignoreDuplicates: true }
            );

          // Mark start/account/profile complete only on first login (when start isn't done yet)
          const { data: startStep } = await supabase
            .from("onboarding_steps")
            .select("completed")
            .eq("contractor_id", userId)
            .eq("step_key", "start")
            .single();

          if (!startStep?.completed) {
            await supabase
              .from("onboarding_steps")
              .update({ completed: true, completed_at: now })
              .eq("contractor_id", userId)
              .in("step_key", ["start", "account", "profile"]);
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
