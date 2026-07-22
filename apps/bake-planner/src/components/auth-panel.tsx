"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type GoogleCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            nonce: string;
          }): void;
          renderButton(
            parent: HTMLElement,
            options: {
              type: "standard";
              theme: "outline";
              size: "large";
              shape: "rectangular";
              text: "continue_with";
              width: number;
            },
          ): void;
        };
      };
    };
  }
}

async function googleNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...bytes));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce));
  const hashed = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { nonce, hashed };
}

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const googleButton = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN_CLIENT_ID;

  useEffect(() => {
    if (!googleReady || !googleClientId || !googleButton.current || !window.google || !supabase) return;
    let active = true;

    void googleNonce().then(({ nonce, hashed }) => {
      if (!active || !googleButton.current || !window.google) return;
      googleButton.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        nonce: hashed,
        callback: async ({ credential }) => {
          const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: credential, nonce });
          setMessage(error ? error.message : "Signed in securely with Google.");
        },
      });
      window.google.accounts.id.renderButton(googleButton.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: Math.min(360, googleButton.current.clientWidth),
      });
    });

    return () => {
      active = false;
    };
  }, [googleClientId, googleReady, supabase]);

  async function emailCode() {
    if (!supabase) return setMessage("Sign-in is temporarily unavailable.");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/api/auth/callback` } });
    setMessage(error ? error.message : "Check your email for a secure sign-in link.");
  }

  return <article className="panel">
    <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setGoogleReady(true)} />
    <h2>Sign in</h2>
    <p className="muted">Use Google for one-tap access or receive a secure link by email.</p>
    {googleClientId ? <div ref={googleButton} aria-label="Continue with Google" /> : <p className="muted">Google sign-in is being configured.</p>}
    <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="baker@example.com" /></label>
    <button className="button secondary" onClick={emailCode}>Email me a sign-in link</button>
    {message && <p role="status" className="muted">{message}</p>}
  </article>;
}
