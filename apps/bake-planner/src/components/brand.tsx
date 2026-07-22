import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link className={compact ? "brand-button compact" : "brand-button"} href="/dashboard" aria-label="Hadley’s Kitchen Bake Planner home">
    <span className="brand-logo"><Image src="/images/hk-logo.png" width={56} height={56} alt="" priority /></span>
    <span><strong>Hadley’s Kitchen</strong><small>Bake Planner</small></span>
  </Link>;
}
