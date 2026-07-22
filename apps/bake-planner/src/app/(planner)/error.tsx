"use client";

import { WarningCircle } from "@phosphor-icons/react";

export default function PlannerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="empty-state panel"><span className="empty-icon"><WarningCircle weight="duotone" /></span><h1>That page needs another try.</h1><p>Your recipes and events have not been changed. Retry the page, or return to the overview.</p><div className="button-row"><button className="button primary" onClick={reset}>Try again</button><a className="button secondary" href="/dashboard">Return to overview</a></div></section>;
}
