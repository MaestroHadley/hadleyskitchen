"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function google() {
    if (!supabase) return setMessage("Add the rotated Supabase public settings to enable sign-in.");
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/api/auth/callback` } });
  }

  async function emailCode() {
    if (!supabase) return setMessage("Add the rotated Supabase public settings to enable sign-in.");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/api/auth/callback` } });
    setMessage(error ? error.message : "Check your email for a secure sign-in link.");
  }

  return <article className="panel"><h2>Sign in</h2><p className="muted">Use Google for one-tap access or receive a secure link by email.</p><button className="button google" onClick={google}>Continue with Google</button><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="baker@example.com" /></label><button className="button secondary" onClick={emailCode}>Email me a sign-in link</button>{message && <p role="status" className="muted">{message}</p>}</article>;
}
