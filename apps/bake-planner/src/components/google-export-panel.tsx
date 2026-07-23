"use client";

import { useEffect, useState } from "react";
import { ArrowClockwise, ArrowSquareOut, CheckCircle, FileDoc, GoogleDriveLogo, SpinnerGap, Table } from "@phosphor-icons/react";
import { googleConnectionFailureMessage } from "@/lib/google-oauth";

type ExportRecord = { kind: "doc" | "sheet"; google_file_id: string; google_file_url: string; exported_at: string };
type Connection = { connected: boolean; connectedAt?: string; exports: ExportRecord[] };

export function GoogleExportPanel({ eventId, callbackStatus, failureReason }: { eventId: string; callbackStatus?: string; failureReason?: string }) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [state, setState] = useState<"loading" | "idle" | "exporting" | "success" | "error">("loading");
  const [message, setMessage] = useState(callbackStatus === "failed" ? googleConnectionFailureMessage(failureReason) : callbackStatus === "connected" ? "Google Drive connected." : "");
  const [file, setFile] = useState<{ url: string; exportedAt: string; kind: "doc" | "sheet" } | null>(null);

  useEffect(() => {
    let active = true;
    void fetch(`/api/google/status?eventId=${encodeURIComponent(eventId)}`).then(async (response) => {
      const result = await response.json();
      if (!active) return;
      setConnection(result);
      setState(response.ok ? "idle" : "error");
      if (!response.ok) setMessage(result.error ?? "Could not check Google Drive.");
    }).catch(() => {
      if (active) {
        setState("error");
        setMessage("Could not check Google Drive.");
      }
    });
    return () => { active = false; };
  }, [eventId]);

  async function exportFile(kind: "doc" | "sheet", update: boolean) {
    setState("exporting");
    setMessage("");
    setFile(null);
    const previous = connection?.exports.find((item) => item.kind === kind);
    try {
      const response = await fetch("/api/google/export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, eventId, existingFileId: update ? previous?.google_file_id : undefined }) });
      const result = await response.json();
      if (!response.ok) {
        setState("error");
        setMessage(result.error ?? "Google export failed.");
        if (result.reconnect) setConnection((current) => current ? { ...current, connected: false } : { connected: false, exports: [] });
        return;
      }
      setState("success");
      setFile({ url: result.fileUrl, exportedAt: result.exportedAt, kind });
      setConnection((current) => current ? { ...current, exports: [{ kind, google_file_id: result.fileId, google_file_url: result.fileUrl, exported_at: result.exportedAt }, ...current.exports.filter((item) => item.kind !== kind)] } : current);
    } catch {
      setState("error");
      setMessage("The export could not be completed. Your event is still safely saved.");
    }
  }

  if (state === "loading") return <article className="panel google-panel"><div className="google-heading"><SpinnerGap className="spin" /><div><h2>Checking Google Drive</h2><p>One moment…</p></div></div></article>;
  if (!connection?.connected) return <article className="panel google-panel"><div className="google-heading"><GoogleDriveLogo weight="duotone" /><div><p className="eyebrow">Optional export</p><h2>Connect Google Drive</h2><p>Drive access is requested only when you export. Your planner login remains separate.</p></div></div><a className="button google-button button-link" href={`/api/google/connect?returnTo=${encodeURIComponent(`/events/${eventId}/report`)}`}><GoogleDriveLogo weight="bold" />Connect Google Drive<ArrowSquareOut /></a>{message && <p className="inline-message error">{message}</p>}</article>;

  const doc = connection.exports.find((item) => item.kind === "doc");
  const sheet = connection.exports.find((item) => item.kind === "sheet");
  return <article className="panel google-panel"><div className="google-heading"><CheckCircle className="success-icon" weight="fill" /><div><p className="eyebrow">Google Drive connected</p><h2>Export a snapshot</h2><p>Create a fresh file or update the last file made by this planner.</p></div></div><div className="export-options"><ExportOption icon={<FileDoc weight="duotone" />} title="Google Doc" detail="Polished production packet" previous={doc} disabled={state === "exporting"} onCreate={() => exportFile("doc", false)} onUpdate={() => exportFile("doc", true)} /><ExportOption icon={<Table weight="duotone" />} title="Google Sheet" detail="Structured planning tabs" previous={sheet} disabled={state === "exporting"} onCreate={() => exportFile("sheet", false)} onUpdate={() => exportFile("sheet", true)} /></div>{state === "exporting" && <p className="inline-message"><SpinnerGap className="spin" />Creating your Google file…</p>}{state === "error" && <p className="inline-message error">{message}</p>}{file && <div className="export-success"><CheckCircle weight="fill" /><span><strong>{file.kind === "doc" ? "Google Doc" : "Google Sheet"} created</strong><small>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(file.exportedAt))}</small></span><a href={file.url} target="_blank" rel="noreferrer">Open file <ArrowSquareOut /></a></div>}</article>;
}

function ExportOption({ icon, title, detail, previous, disabled, onCreate, onUpdate }: { icon: React.ReactNode; title: string; detail: string; previous?: ExportRecord; disabled: boolean; onCreate: () => void; onUpdate: () => void }) {
  return <div className="export-option"><span className="export-icon">{icon}</span><span><strong>{title}</strong><small>{detail}</small>{previous && <em>Last exported {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(previous.exported_at))}</em>}</span><div><button className="button secondary compact-button" onClick={onCreate} disabled={disabled}>New copy</button>{previous && <button className="button ghost compact-button icon-button" onClick={onUpdate} disabled={disabled}><ArrowClockwise />Update</button>}</div></div>;
}
