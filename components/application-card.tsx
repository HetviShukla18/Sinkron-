import { ResponsiveImage as Image } from "@/components/responsive-image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ApplicationCard({ item, referenceImage = false }: { item: { name: string; image: string }; referenceImage?: boolean }) {
  return (
    <Link href={`/applications#${item.name.toLowerCase()}`} className="application-card" aria-label={`Explore ${item.name.toLowerCase()} applications`} data-reveal>
      <div className="application-image"><Image src={referenceImage ? `/assets/optimized/home-${item.name.toLowerCase()}.webp` : item.image} alt={`${item.name} water application`} fill sizes="(max-width: 700px) 45vw, 22vw" /></div>
      <div className="application-label"><span>{item.name}</span><span className="circle-link small"><ArrowRight size={15} aria-hidden="true" /></span></div>
    </Link>
  );
}
