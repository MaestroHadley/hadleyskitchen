import Image from "next/image";
import Link from "next/link";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="Hearthworks home">
      <span className={`brand__mark${inverse ? " brand__mark--inverse" : ""}`}>
        <Image src="/hearthworks-logo.svg" width={46} height={46} alt="" priority />
      </span>
      <span className="brand__copy">
        <strong>Hearthworks</strong>
        <small>The operating system for independent bakers</small>
      </span>
    </Link>
  );
}
