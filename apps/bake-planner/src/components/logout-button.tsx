"use client";

import { useState } from "react";
import { SignOut, SpinnerGap } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    const supabase = createClient();
    if (!supabase) return setError("Sign-out is temporarily unavailable.");
    setPending(true);
    const { error: authError } = await supabase.auth.signOut();
    if (authError) {
      setError(authError.message);
      setPending(false);
      return;
    }
    location.assign("/");
  }
  return <div><button className="button secondary icon-button" onClick={logout} disabled={pending}>{pending ? <SpinnerGap className="spin" /> : <SignOut />}Log out</button>{error && <p className="inline-message error">{error}</p>}</div>;
}
