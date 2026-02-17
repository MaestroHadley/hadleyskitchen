"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

function LoginForm() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) return setErr(error.message);

    router.push(next);
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 460, margin: "56px auto", padding: 16 }}>
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          boxShadow: "0 14px 32px rgba(17, 24, 39, 0.08)",
          padding: 24,
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Log in</h1>
        <p style={{ margin: "0 0 20px", color: "#4b5563" }}>
          Access your baking prep planner.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "11px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: 15,
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "11px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: 15,
              }}
            />
          </label>

          {err && <p style={{ margin: 0, color: "#b91c1c" }}>{err}</p>}

          <input
            type="submit"
            disabled={loading}
            value={loading ? "Signing in..." : "Sign in"}
            style={{
              marginTop: 4,
              padding: "11px 12px",
              borderRadius: 10,
              border: "none",
              background: "var(--hk-button)",
              color: "#ffffff",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          />
        </form>

        <p style={{ marginTop: 18, color: "#4b5563" }}>
          No account?{" "}
          <a href="/signup" style={{ color: "#1f2937", fontWeight: 700 }}>
            Create one
          </a>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
