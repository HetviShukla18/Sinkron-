import { ResponsiveImage as Image } from "@/components/responsive-image";
import Link from "next/link";
import { ArrowRight, Building2, ChartNoAxesColumnIncreasing, Expand, Package, Settings, ShieldCheck, Sun, Target } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ApplicationCard } from "@/components/application-card";
import { SectionHeading } from "@/components/section-heading";
import { CTASection } from "@/components/cta-section";
import { BuyerConfidence } from "@/components/buyer-confidence";
import { HeroImageSlider } from "@/components/hero-image-slider";
import { applications, products } from "@/lib/data";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero-copy">
        <h1>Precision You Can<br /><span>Measure.</span></h1>
        <div className="hero-aside">
          <h2>Reliable by Design</h2>
          <p>Metrologically certified water metering solutions for a more efficient and sustainable tomorrow.</p>
        </div>
        <div className="hero-context-line">
          <span>Water meters for municipal networks</span><i>/</i>
          <span>Commercial &amp; industrial applications</span><i>/</i>
          <span>Agriculture &amp; irrigation</span><i>/</i>
          <span>Smart metering solutions</span>
        </div>
      </section>

      <section className="home-hero-media" aria-label="Sinkron water metering solutions">
        <HeroImageSlider>
          <Image src="/assets/optimized/home-hero.webp" alt="Blue water meter and pipework at a water treatment plant" fill priority sizes="(max-width: 700px) 900px, 100vw" className="hero-slide-image" />
          <Image src="/assets/optimized/home-hero-brass.webp" alt="Brass water meter installed on pipework outside a building" fill priority sizes="(max-width: 700px) 900px, 100vw" className="hero-slide-image" />
          <Image src="/assets/optimized/home-hero-blue.webp" alt="Blue Sinkron flanged water meter installed on industrial pipework" fill priority sizes="(max-width: 700px) 900px, 100vw" className="hero-slide-image" />
        </HeroImageSlider>
        <div className="hero-benefits">
          <div><ShieldCheck aria-hidden="true" /><span>Metrologically<br />Certified Accuracy</span></div>
          <div><Settings aria-hidden="true" /><span>Solutions for<br />Municipal, Industrial<br />and Agricultural Use</span></div>
          <div><ChartNoAxesColumnIncreasing aria-hidden="true" /><span>Enabling a More<br />Sustainable<br />Water Future</span></div>
        </div>
      </section>

      <section className="home-trust" aria-label="Our meter range">
        <div className="trust-strip">
          <div><Package aria-hidden="true" /><strong>3</strong><span>Product Categories</span></div>
          <div><Expand aria-hidden="true" /><strong>15 – 200 mm</strong><span>Available Size Range</span></div>
          <div><Building2 aria-hidden="true" /><strong>Domestic to Industrial</strong><span>Applications</span></div>
          <div><Sun aria-hidden="true" /><strong>Reliable</strong><span>Flow Measurement</span></div>
        </div>
      
      </section>

      <section className="home-about-grid">
        <div className="about-copy" data-reveal>
          <div className="eyebrow">ABOUT SINKRON</div>
          <h2 className="section-title">Engineering accuracy for<br />better water management.</h2>
          <p>We manufacture reliable and high-quality water meters designed for accurate measurement across domestic, commercial, agricultural and industrial applications.</p>
          <div className="mini-values">
            <div><Target aria-hidden="true" /><span>Precision in<br />Every Drop</span></div>
            <div><ShieldCheck aria-hidden="true" /><span>Reliable<br />Performance</span></div>
            <div><Sun aria-hidden="true" /><span>Responsible Water<br />Management</span></div>
          </div>
          <Link href="/about" className="btn btn-outline">Know More About Us <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <div className="image-card large" data-reveal><Image src="/assets/optimized/home-about.webp" alt="Industrial flow meter installed on blue pipework inside a water management facility" fill sizes="(max-width: 700px) 90vw, 45vw" /></div>
      </section>

      <section className="site-container home-products">
        <SectionHeading reveal eyebrow="OUR PRODUCTS" title={<>The right meter.<br /><span className="quiet-accent">A clear starting point.</span></>} body="Compare Single-Jet, Multi-Jet and Woltman meters by their connection sizes and technical specifications." action={<Link href="/products" className="text-link">Explore the full range <ArrowRight size={16} aria-hidden="true" /></Link>} />
       
        <div className="product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} referenceImage />)}</div>
      </section>

      <section className="site-container split-feature home-why">
        <div className="image-card why" data-reveal><Image src="/assets/optimized/home-infrastructure.webp" alt="Storage tanks and pipework across a modern industrial water facility" fill sizes="(max-width: 700px) 90vw, 44vw" /></div>
        <div className="why-list" data-reveal>
          <div className="eyebrow">WHY CHOOSE SINKRON</div>
          <h2 className="section-title">Built for Reliable Measurement.</h2>
          <div className="why-rows">
            {["Accurate Measurement", "Durable Construction", "Corrosion Resistant Build", "Application Flexibility"].map((item, i) => (
              <Link href="/about" className="why-row" key={item}><span>{String(i + 1).padStart(2, "0")}</span><strong>{item}</strong><ArrowRight size={13} aria-hidden="true" /></Link>
            ))}
          </div>
        </div>
      </section>

      <section className="site-container home-applications">
        <SectionHeading reveal eyebrow="OUR APPLICATIONS" title="Designed Across Applications." action={<Link href="/applications" className="text-link">Explore Industries <ArrowRight size={16} aria-hidden="true" /></Link>} />
        <div className="applications-grid">{applications.map((item) => <ApplicationCard key={item.name} item={item} referenceImage />)}</div>
      </section>

      <BuyerConfidence />
      <div className="home-cta"><CTASection /></div>
    </div>
  );
}
