// src/app/login/LoginClient.jsx
"use client";


import { CheckCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { getSupabaseClient } from "../../lib/supabase/client";
const supabase = getSupabaseClient()

export default function LoginClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();

  const paid = searchParams.get("paid") === "true";
  const plan = searchParams.get("plan");
  const authError = searchParams.get("error");

  const planLabels = {
    starter: "Starter",
    pro: "Professional",
    agency: "Enterprise",
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-accent">FlowEdit</h1>
          <p className="text-accent/60 mt-2">Sign in to your dashboard</p>
        </div>

    

        {/* ── Auth error from callback ── */}
        {authError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            Sign-in failed. Please try again.
          </div>
        )}

        {/* ── Regular error ── */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-accent/20 hover:border-primary/50 hover:bg-accent/5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span className="font-semibold text-accent">
            {isLoading
              ? "Redirecting..."
              : paid
              ? "Sign in to access your account"
              : "Continue with Google"}
          </span>
        </button>

        <p className="text-center text-xs text-accent/40 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
