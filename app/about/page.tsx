import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gauge, Layers3, Leaf, Ruler, Target } from "lucide-react";
import { ResponsiveImage as Image } from "@/components/responsive-image";
import { PageIntro } from "@/components/page-intro";
import { PageCTA } from "@/components/page-cta";


export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: "/about" },
  description: "Learn about Sinkron Water Meters, our mission, vision and focus on accurate and responsible water measurement.",
};

const approach = [
  { title: "Understand the application.", body: "We begin with where the meter will be used and the demands of the installation." },
  { title: "Look closely at the details.", body: "Connection size, flow, pressure and temperature guide the conversation." },
  { title: "Make a considered choice.", body: "We help you explore catalogue specifications and available options for your project." },
];

export default function AboutPage() {
  return (
    <div className="inner-page company-page">
      <PageIntro links={[{"label":"Our approach","href":"#approach-title"},{"label":"Our purpose","href":"#purpose-title"},{"label":"Explore our meters","href":"/products"}]} eyebrow="ABOUT SINKRON" title={<>Built around water.<br /><span className="accent">Driven by precision.</span></>} body="Based in Ahmedabad, we manufacture water meters for the people who plan, install and manage water supply systems." aside={<span className="intro-footnote">Thoughtful engineering. Everyday purpose.</span>} />

      <section className="site-container company-visual" aria-label="Our approach to water measurement">
        <div className="interior-image company-main-image">
          <Image src="/assets/optimized/meter-installed.webp" alt="Water meter installed on blue supply pipework beside a treatment basin" fill priority sizes="(max-width: 600px) 110vw, 60vw" />
          <span className="company-image-note">Precision, connected to the real world.</span>
        </div>
        <div className="company-statement">
          <div className="statement-top"><span className="eyebrow">THE SINKRON APPROACH</span><Gauge aria-hidden="true" /></div>
          <div><h2>Small details.<br />Lasting difference.</h2><p>Better water management starts with understanding every installation. We bring a practical focus to the way water use is measured.</p></div>
          <Link href="/products" className="text-link">Discover our meters <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>

      <div className="site-container company-facts" aria-label="Our range at a glance">
        <div><Layers3 aria-hidden="true" /><div><strong>03</strong><span>Meter families</span></div></div>
        <div><Ruler aria-hidden="true" /><div><strong>DN15–DN200</strong><span>Available size range</span></div></div>
        <div><Gauge aria-hidden="true" /><div><strong>04</strong><span>Application sectors</span></div></div>
      </div>

      <section className="site-container interior-section company-approach" aria-labelledby="approach-title">
        <div><div className="eyebrow">HOW WE WORK</div><h2 id="approach-title" tabIndex={-1} className="interior-title">The right questions.<br />A clearer way forward.</h2><p className="company-approach-copy">Every project has its own demands. Our conversations stay grounded in what matters on site, from individual supply lines to larger water networks.</p></div>
        <ol className="approach-steps">{approach.map((step, index) => <li key={step.title}><span>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol>
      </section>

      <section className="site-container interior-section" aria-labelledby="purpose-title">
        <div className="interior-section-heading"><div><div className="eyebrow">OUR PURPOSE</div><h2 id="purpose-title" tabIndex={-1}>A little more clarity.<br />A more thoughtful future.</h2></div><p>Our work connects accurate measurement with the responsible use of water.</p></div>
        <div className="purpose-grid">
          <article className="purpose-card"><div className="purpose-card-top"><span>01 / OUR MISSION</span><Target aria-hidden="true" /></div><h3>Make water use<br />easier to understand.</h3><p>Give individuals, communities and businesses the measurement tools to see how water is used and make informed decisions about it.</p></article>
          <article className="purpose-card"><div className="purpose-card-top"><span>02 / OUR VISION</span><Leaf aria-hidden="true" /></div><h3>Conservation as<br />an everyday practice.</h3><p>A future where managing water thoughtfully is part of everyday life, supported by better infrastructure, shared knowledge and long-term care.</p></article>
        </div>
      </section>
      <PageCTA />
    </div>
  );
}
