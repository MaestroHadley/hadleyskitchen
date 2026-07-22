"use client";

import { useState } from "react";
import { ArrowRight, EnvelopeSimple, GoogleLogo, SpinnerGap } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

export function AuthPanel({ error }: { error?: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(error ?? "");
  const [pending, setPending] = useState<"google" | "email" | null>(null);

  async function google() {
    setPending("google");
    setMessage("");
    location.assign("/api/auth/google?next=/dashboard");
  }

  async function emailCode() {
    const supabase = createClient();
    if (!supabase) return setMessage("Sign-in is temporarily unavailable.");
    if (!email.trim()) return setMessage("Enter your email address first.");
    setPending("email");
    setMessage("");
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/api/auth/callback?next=/dashboard` },
    });
    setPending(null);
    setMessage(authError ? authError.message : "Check your inbox for a secure sign-in link.");
  }

  return <div className="sign-in-card">
    <div className="sign-in-heading">
      <p className="eyebrow">Your private baking workspace</p>
      <h2>Welcome to your planner.</h2>
      <p>Save recipes once, turn quantities into a production plan, and keep every market organized.</p>
    </div>
    <button className="button google-button" onClick={google} disabled={pending !== null}>
      {pending === "google" ? <SpinnerGap className="spin" weight="bold" /> : <GoogleLogo weight="bold" />}
      Continue with Google
      <ArrowRight weight="bold" />
    </button>
    <div className="or-divider"><span>or use a secure email link</span></div>
    <label className="field-label" htmlFor="sign-in-email">Email address</label>
    <div className="input-with-icon"><EnvelopeSimple aria-hidden="true" /><input id="sign-in-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="baker@example.com" autoComplete="email" /></div>
    <button className="button secondary full-width" onClick={emailCode} disabled={pending !== null}>
      {pending === "email" && <SpinnerGap className="spin" weight="bold" />}
      Email me a sign-in link
    </button>
    {message && <p className="inline-message" role="status">{message}</p>}
    <p className="sign-in-footnote">Free for market bakers. Your recipes stay private to your account.</p>
  </div>;
}
