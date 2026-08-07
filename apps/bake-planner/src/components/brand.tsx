import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false, workspaceName }: { compact?: boolean; workspaceName?: string }) {
  return <Link className={compact ? "brand-button compact" : "brand-button"} href="/dashboard" aria-label={`${workspaceName ?? "Hadley’s Kitchen"} Bake Planner home`}>
    <span className="brand-logo"><Image src="/images/hk-logo.png" width={56} height={56} alt="" priority /></span>
    {workspaceName ? <span><strong>{workspaceName}</strong><small>Bake Planner <em>by Hadley’s Kitchen</em></small></span> : <span><strong>Hadley’s Kitchen</strong><small>Bake Planner</small></span>}
  </Link>;
}
