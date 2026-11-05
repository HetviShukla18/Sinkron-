import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, CircleDot, Factory, Gauge, House, Ruler, Sprout, ThermometerSun } from "lucide-react";
import { ResponsiveImage as Image } from "@/components/responsive-image";
import { PageIntro } from "@/components/page-intro";
import { PageCTA } from "@/components/page-cta";
import { applications } from "@/lib/data";

export const metadata: Metadata = { title: "Applications", alternates: { canonical: "/applications" }, description: "Explore residential, commercial, agricultural and industrial water metering applications for Sinkron water meters." };
const sectorIcons = [House, Building2, Sprout, Factory];
const meterLinks = [
  { label: "Single-Jet", slug: "single-jet" },
  { label: "Multi-Jet", slug: "multi-jet" },
  { label: "Woltman", slug: "woltman" },
];

function RecommendedMeters({ names, application }: { names: string; application: string }) {
  const recommended = meterLinks.filter(meter => names.includes(meter.label));
  return <div className="sector-product-links">{recommended.length
    ? recommended.map(meter => <Link key={meter.slug} href={`/products#${meter.slug}`}>{meter.label}</Link>)
    : <Link href={`/contact?application=${application}#enquiry-title`}>Discuss building demand</Link>}</div>;
}
const guide = [
  { icon: CircleDot, title: "01 / Application", body: "Where will the meter be used?" },
  { icon: Ruler, title: "02 / Connection size", body: "What pipe size does the installation need?" },
  { icon: Gauge, title: "03 / Flow requirement", body: "What flow range needs to be measured?" },
  { icon: ThermometerSun, title: "04 / Site conditions", body: "What pressure and temperature conditions apply?" },
];

export default function ApplicationsPage() {
  return (
    <div className="inner-page sectors-page">
      <PageIntro links={[{"label":"Residential","href":"#residential"},{"label":"Commercial","href":"#commercial"},{"label":"Agricultural","href":"#agricultural"},{"label":"Industrial","href":"#industrial"}]} eyebrow="OUR APPLICATIONS" title={<>Different settings.<br /><span className="accent">The same precision.</span></>} body="From everyday supply lines to larger facilities, the setting shapes the requirement. Find the metering conversation that fits your world." aside={<span className="intro-footnote">Water measurement, in context.</span>} />

      <section className="site-container application-overview" aria-label="Water metering across applications">
        <div className="interior-image application-overview-image"><Image src="/assets/optimized/home-infrastructure.webp" alt="Storage tanks and blue pipework across an industrial water facility" fill priority sizes="(max-width: 820px) 100vw, 60vw" /><div><span>WHERE WATER WORKS</span><h2>Connected to everyday life.</h2></div></div>
        <nav className="application-index" aria-label="Explore an application"><div className="eyebrow">EXPLORE YOUR SECTOR</div>{applications.map((item, index) => { const Icon = sectorIcons[index]; return <Link href={`#${item.name.toLowerCase()}`} key={item.name}><Icon aria-hidden="true" /><span>{item.name}</span><ArrowUpRight aria-hidden="true" /></Link>; })}</nav>
      </section>

      <section className="site-container interior-section" aria-labelledby="sectors-title">
        <div className="interior-section-heading"><div><div className="eyebrow">FOUR SETTINGS. ONE CONSIDERED APPROACH.</div><h2 id="sectors-title">Made for the way<br />your world uses water.</h2></div><p>Explore the setting, then discuss the size and specification that suit the installation.</p></div>
        <div className="sector-grid">{applications.map((item, index) => { const Icon = sectorIcons[index]; return (
          <article id={item.name.toLowerCase()} className="sector-card" key={item.name}>
            <div className="sector-image"><Image src={item.image} alt={`${item.name} water application`} fill sizes="(max-width: 600px) 90vw, 44vw" /><span>0{index + 1} / APPLICATION</span></div>
            <div className="sector-body"><div className="sector-title"><h3>{item.name}</h3><Icon aria-hidden="true" /></div><p>{item.description}</p><div className="sector-recommendation"><div><span>Start the conversation with</span><RecommendedMeters names={item.products} application={item.name.toLowerCase()} /></div><Link href={`/contact?application=${item.name.toLowerCase()}#enquiry-title`} aria-label={`Discuss ${item.name.toLowerCase()} metering`}><ArrowUpRight size={19} aria-hidden="true" /></Link></div></div>
          </article>
        ); })}</div>
      </section>

      <section className="site-container interior-section installation-guide" aria-labelledby="guide-title">
        <div><div className="eyebrow">A CLEARER START</div><h2 id="guide-title" className="interior-title">A few details.<br />A better discussion.</h2><p>Bring these essentials to your next conversation with our team. We’ll help you explore the catalogue options.</p><Link href="/contact" className="text-link">Discuss your installation <ArrowRight size={16} aria-hidden="true" /></Link></div>
        <div className="guide-grid">{guide.map(item => <div className="guide-item" key={item.title}><item.icon aria-hidden="true" /><h3>{item.title}</h3><p>{item.body}</p></div>)}</div>
      </section>
      <PageCTA />
    </div>
  );
}
