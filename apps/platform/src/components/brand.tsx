import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false, workspaceName }: { compact?: boolean; workspaceName?: string }) {
  return <Link className={compact ? "brand-button compact" : "brand-button"} href="/dashboard" aria-label={`Hearthworks home${workspaceName ? ` for ${workspaceName}` : ""}`}>
    <span className="brand-logo"><Image src="/hearthworks-logo.svg" width={56} height={56} alt="" priority /></span>
    <span><strong>Hearthworks</strong><small>The operating system for independent bakers</small></span>
  </Link>;
}
