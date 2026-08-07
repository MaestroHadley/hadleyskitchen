"use client";

import { DownloadSimple, Printer } from "@phosphor-icons/react";

export function ReportActions({ csv, filename }: { csv: string; filename: string }) {
  function download() {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return <div className="button-row print-hide"><button className="button secondary icon-button" onClick={download}><DownloadSimple />Download CSV</button><button className="button primary icon-button" onClick={() => window.print()}><Printer />Print / Save PDF</button></div>;
}
