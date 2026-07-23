"use client";

import { useEffect, useState } from "react";
import { CheckCircle, GoogleDriveLogo, SpinnerGap, Trash } from "@phosphor-icons/react";
import { googleConnectionFailureMessage } from "@/lib/google-oauth";

export function DriveConnection({ connectedFromCallback, failedFromCallback, failureReason }: { connectedFromCallback?: boolean; failedFromCallback?: boolean; failureReason?: string }) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [message, setMessage] = useState(connectedFromCallback ? "Google Drive connected." : failedFromCallback ? googleConnectionFailureMessage(failureReason) : "");
  useEffect(() => {
    let active = true;
    void fetch("/api/google/status").then(async (response) => {
      const result = await response.json();
      if (active) setConnected(response.ok ? result.connected : false);
    }).catch(() => { if (active) setConnected(false); });
    return () => { active = false; };
  }, []);
  async function disconnect() {
    const response = await fetch("/api/google/export", { method: "DELETE" });
    if (response.ok) {
      setConnected(false);
      setMessage("Google Drive disconnected and its stored authorization was removed.");
    } else setMessage("Google Drive could not be disconnected. Please try again.");
  }
  return <article className="panel connection-card"><span className="feature-icon small"><GoogleDriveLogo weight="duotone" /></span><div><p className="eyebrow">Optional integration</p><h2>Google Drive</h2><p className="muted">Create Docs and Sheets only when you choose to export. Planner sign-in never requests Drive access.</p></div>{connected === null ? <p className="inline-message"><SpinnerGap className="spin" />Checking connection…</p> : connected ? <><p className="connection-status"><CheckCircle weight="fill" />Connected</p><button className="button ghost icon-button" onClick={disconnect}><Trash />Disconnect Google Drive</button></> : <a className="button google-button button-link" href="/api/google/connect?returnTo=/account"><GoogleDriveLogo weight="bold" />Connect Google Drive</a>}{message && <p className={failedFromCallback ? "inline-message error" : "inline-message"}>{message}</p>}</article>;
}
