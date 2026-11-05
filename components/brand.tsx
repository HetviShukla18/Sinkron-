import Image from "next/image";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`brand${inverse ? " brand-inverse" : ""}`} role="img" aria-label="Sinkron Water Meters">
      <Image
        src="/assets/sinkron-symbol.png"
        alt=""
        aria-hidden="true"
        width={401}
        height={401}
        className="brand-symbol"
        unoptimized
        priority={!inverse}
      />
      <span className="brand-wordmark" aria-hidden="true"><strong>SINKRON</strong><span>Water Meters</span></span>
    </span>
  );
}
