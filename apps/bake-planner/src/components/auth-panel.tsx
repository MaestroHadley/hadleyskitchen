"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function google() {
    if (!supabase) return setMessage("Sign-in is temporarily unavailable.");
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/api/auth/callback` },
    });
    if (error) setMessage(error.message);
  }

  async function emailCode() {
    if (!supabase) return setMessage("Sign-in is temporarily unavailable.");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });
    setMessage(error ? error.message : "Check your email for a secure sign-in link.");
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    setMessage(error ? error.message : "You’re signed out.");
  }

  if (loading) {
    return <article className="panel"><h2>Account</h2><p className="muted" role="status">Checking your sign-in…</p></article>;
  }

  if (user) {
    return <article className="panel">
      <p className="eyebrow">Signed in</p>
      <h2>Your account</h2>
      <p className="muted">You’re signed in as <strong>{user.email}</strong>.</p>
      <button className="button secondary" onClick={signOut}>Log out</button>
      {message && <p role="status" className="muted">{message}</p>}
    </article>;
  }

  return <article className="panel">
    <p className="eyebrow">Your private workspace</p>
    <h2>Sign in</h2>
    <p className="muted">Sign in to save recipes and continue planning across devices.</p>
    <button className="button google" onClick={google}>Continue with Google</button>
    <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="baker@example.com" /></label>
    <button className="button secondary" onClick={emailCode}>Email me a sign-in link</button>
    {message && <p role="status" className="muted">{message}</p>}
  </article>;
}
