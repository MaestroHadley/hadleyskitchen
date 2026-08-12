"use client";

import { useEffect, useState } from "react";
import { ArrowsClockwise, CheckCircle, GoogleDriveLogo, SpinnerGap, Trash, WarningCircle } from "@phosphor-icons/react";
import { googleConnectionFailureMessage } from "@/lib/google-oauth";

type ConnectionStatus = {
  connected: boolean;
  needsReconnect?: boolean;
  googleEmail?: string;
  signedInEmail?: string;
  accountMismatch?: boolean;
};

export function DriveConnection({ connectedFromCallback, failedFromCallback, failureReason }: { connectedFromCallback?: boolean; failedFromCallback?: boolean; failureReason?: string }) {
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [message, setMessage] = useState(connectedFromCallback ? "Google Drive connected." : failedFromCallback ? googleConnectionFailureMessage(failureReason) : "");
  useEffect(() => {
    let active = true;
    void fetch("/api/google/status").then(async (response) => {
      const result = await response.json();
      if (active) setConnection(response.ok ? result : { connected: false });
    }).catch(() => { if (active) setConnection({ connected: false }); });
    return () => { active = false; };
  }, []);
  async function disconnect() {
    const response = await fetch("/api/google/export", { method: "DELETE" });
    if (response.ok) {
      setConnection({ connected: false });
      setMessage("Google Drive disconnected and its stored authorization was removed.");
    } else setMessage("Google Drive could not be disconnected. Please try again.");
  }
  const reconnect = connection?.needsReconnect;
  return <article className="panel connection-card">
    <span className="feature-icon"><GoogleDriveLogo weight="duotone" /></span>
    <div className="connection-card-copy"><p className="eyebrow">Optional integration</p><h2>Google Drive</h2><p className="muted">Create Docs and Sheets only when you choose to export. Planner sign-in never requests Drive access.</p></div>
    {connection === null ? <p className="inline-message"><SpinnerGap className="spin" />Checking connection…</p> : connection.connected ? <>
      <div className={connection.accountMismatch ? "connected-account mismatch" : "connected-account"}>
        {connection.accountMismatch ? <WarningCircle weight="fill" /> : <CheckCircle weight="fill" />}
        <span><strong>Connected Google account</strong><small>{connection.googleEmail}</small>{connection.accountMismatch && <em>Different from your Hearthworks sign-in: {connection.signedInEmail}</em>}</span>
      </div>
      <div className="button-row connection-actions"><a className="button secondary button-link icon-button" href="/api/google/connect?returnTo=/account"><ArrowsClockwise />Switch account</a><button className="button ghost icon-button" onClick={disconnect}><Trash />Disconnect</button></div>
    </> : <>
      <a className="button google-button button-link connection-primary-action" href="/api/google/connect?returnTo=/account"><GoogleDriveLogo weight="bold" />{reconnect ? "Reconnect Google Drive" : "Connect Google Drive"}</a>
      {reconnect && <p className="inline-message error">Reconnect once to identify which Google account owns your exports.</p>}
    </>}
    {message && <p className={failedFromCallback ? "inline-message error" : "inline-message"}>{message}</p>}
  </article>;
}
