import { ResponsiveImage as Image } from "@/components/responsive-image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ProductCard({ product, referenceImage = false }: { product: { slug: string; name: string; image: string; sizes: string; short?: string }; referenceImage?: boolean }) {
  return (
    <article className="product-card" data-reveal>
      <Link href={`/products#${product.slug}`} className="product-image-wrap" aria-label={`View ${product.name}`}>
        <Image src={product.image} alt={product.name} width={520} height={420} sizes="(max-width: 700px) 68vw, 22vw" className="product-image" />
      </Link>
      <div className="product-card-body">
        <div>
          <h3><Link href={`/products#${product.slug}`}>{product.name}</Link></h3>
          {product.short && <p className="product-short">{product.short}</p>}
          <div className="product-size-info"><span>CONNECTION SIZES</span><strong>{referenceImage && product.slug === "woltman" ? "DN50 – DN200" : product.sizes}</strong></div>
          <div className="product-card-actions">
            <Link href={`/products#${product.slug}`} className="text-link">Technical details <ArrowRight size={15} aria-hidden="true" /></Link>
            <Link href={`/contact?meter=${product.slug}#enquiry-title`} className="product-enquire">Enquire <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </article>
  );
}
