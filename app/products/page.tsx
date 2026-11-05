import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Plus } from "lucide-react";
import { ResponsiveImage as Image } from "@/components/responsive-image";
import { PageIntro } from "@/components/page-intro";
import { PageCTA } from "@/components/page-cta";
import { products } from "@/lib/data";

export const metadata: Metadata = { title: "Products", alternates: { canonical: "/products" }, description: "Explore Sinkron Single-Jet, Multi-Jet and Woltman water meter solutions and supported technical specifications." };
const labels = ["COMPACT & PRECISE", "VERSATILE BY DESIGN", "BUILT FOR HIGHER FLOW"];

export default function ProductsPage() {
  return (
    <div className="inner-page collection-page">
      <PageIntro eyebrow="OUR PRODUCTS" title={<>Precision for<br /><span className="accent">every flow.</span></>} body="Three meter families. A considered range of sizes. Explore the details and find the right starting point for your installation."  />

      <section id="specifications" className="site-container product-specifications" aria-label="Product specifications">
        <nav className="spec-navigation" aria-label="Jump to a meter"><span>FIND YOUR FIT</span><div>{products.map(product => <Link href={`#${product.slug}`} key={product.slug}>{product.slug === "woltman" ? "Woltman" : product.slug === "single-jet" ? "Single-Jet" : "Multi-Jet"}</Link>)}</div></nav>
        {products.map((product, index) => (
          <article className="meter-detail" id={product.slug} key={product.slug}>
            <div className="meter-detail-main">
              <div className="meter-detail-visual" data-reveal><Image src={product.image} alt={product.name} width={760} height={620} sizes="(max-width: 600px) 65vw, 34vw" /><span>SINKRON / {product.slug.toUpperCase()}</span></div>
              <div className="meter-detail-copy" data-reveal><div className="eyebrow">0{index + 1} / {labels[index]}</div><h2>{product.name}</h2><p>{product.short}</p><ul className="meter-features">{product.features.map(feature => <li key={feature}><Check aria-hidden="true" /><span>{feature}</span></li>)}</ul><div className="meter-size"><span>Available connection sizes</span><strong>{product.sizes}</strong></div><Link href={`/contact?meter=${product.slug}#enquiry-title`} className="btn btn-primary meter-enquiry">Enquire about this meter <ArrowRight size={16} aria-hidden="true" /></Link></div>
            </div>
            <details className="technical-disclosure"><summary>Technical specifications<span><small>View details</small><Plus size={18} aria-hidden="true" /></span></summary><div className="table-scroll" tabIndex={0} role="region" aria-label={`${product.name} technical data`}><table><caption className="sr-only">{product.name} catalogue specifications</caption><thead><tr>{product.technical[0].map((cell, index) => <th key={index} scope="col">{cell}</th>)}</tr></thead><tbody>{product.technical.slice(1).map(row => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th key={index} scope="row">{cell}</th> : <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div></details>
          </article>
        ))}
      </section>
      <PageCTA />
    </div>
  );
}
