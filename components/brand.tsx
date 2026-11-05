import Image from "next/image";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="brand">
      <Image
        src={inverse ? "/assets/sinkron-logo-white.png" : "/assets/sinkron-logo.png"}
        alt="Sinkron Water Meters"
        width={inverse ? 1558 : 340}
        height={inverse ? 401 : 91}
        className="brand-image"
        unoptimized
        priority={!inverse}
      />
    </span>
  );
}
