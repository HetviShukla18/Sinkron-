import type { Metadata } from "next";
import { ArrowUpRight, CheckCircle2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { ResponsiveImage as Image } from "@/components/responsive-image";
import { PageIntro } from "@/components/page-intro";
import { EnquiryForm } from "@/components/enquiry-form";
import { contact } from "@/lib/data";
import { getEnquiryContext } from "@/lib/enquiry-context";
import { buildWhatsAppUrl } from "@/lib/enquiry-message";

export const metadata: Metadata = { title: "Contact", alternates: { canonical: "/contact" }, description: "Contact Sinkron Water Meters for product guidance, technical information or quotation enquiries." };

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { initial, selection } = getEnquiryContext(await searchParams);
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "";
  const whatsapp = buildWhatsAppUrl(wa, "Hello Sinkron, I have a water metering requirement.") ?? "";
  return (
    <div className="inner-page enquiry-page">
      <PageIntro links={[{"label":"Send an enquiry","href":"#enquiry-title"},{"label":"Contact options","href":"#contact-options"},{"label":"Find us","href":"#location"}]} eyebrow="CONTACT SINKRON" title={<>Let’s talk<br /><span className="accent">about your project.</span></>} body="A new installation, a technical question or a quotation. Wherever you’re starting, our team is here to help you take the next step." aside={<span className="intro-footnote">Good projects begin with a conversation.</span>} />

      <section id="contact-options" className="site-container contact-channel-grid" aria-label="Ways to contact Sinkron">
        <a href={`tel:${contact.phones[0].replace(/\s/g, "")}`} className="contact-channel"><span className="channel-icon"><Phone aria-hidden="true" /></span><div><h2>Speak with our team</h2><p>{contact.phones[0]}</p></div><ArrowUpRight aria-hidden="true" /></a>
        <a href={`mailto:${contact.email}`} className="contact-channel"><span className="channel-icon"><Mail aria-hidden="true" /></span><div><h2>Write to us</h2><p>{contact.email}</p></div><ArrowUpRight aria-hidden="true" /></a>
        <a href={whatsapp} target="_blank" rel="noreferrer" className="contact-channel"><span className="channel-icon"><MessageCircle aria-hidden="true" /></span><div><h2>Chat on WhatsApp</h2><p>Share your requirement directly.</p></div><ArrowUpRight aria-hidden="true" /></a>
      </section>

      <section className="site-container project-contact-grid" aria-labelledby="enquiry-title">
        <div className="project-form-panel"><div className="eyebrow">YOUR NEXT PROJECT</div><h2 id="enquiry-title" tabIndex={-1}>Tell us what you have in mind.</h2><p>A few details help us understand your requirement. Fields marked * are required.</p>{selection && <div className="selected-enquiry"><CheckCircle2 size={19} aria-hidden="true" /><div>Enquiring about<strong>{selection}</strong><Link href="/contact#enquiry-title">Clear selection</Link></div></div>}<EnquiryForm key={`${initial.meterType}:${initial.application}:${initial.message}`} initial={initial} whatsappUrl={whatsapp} whatsappNumber={wa} phone={wa ? `+${wa.replace(/\D/g, "")}` : ""} /></div>
        <aside className="project-contact-aside">
          <div className="contact-help"><div className="eyebrow">LET’S GET STARTED</div><h2>You bring the project.<br />We’ll help with the details.</h2><p>Not sure which meter to choose? Start with what you know. These three details are a useful place to begin.</p><ol className="contact-requirements"><li><span>01</span>Your application or installation</li><li><span>02</span>The required connection size</li><li><span>03</span>Your quantity or project scope</li></ol></div>
          <div id="location" className="contact-location"><div className="location-image"><Image src="/assets/optimized/home-about.webp" alt="Water meter installed in a water management facility" fill sizes="(max-width: 600px) 90vw, 38vw" /></div><div className="location-body"><span>BASED IN AHMEDABAD</span><h3>Here to connect.</h3><address>{contact.address}</address><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`} target="_blank" rel="noreferrer" className="text-link"><MapPin size={15} aria-hidden="true" /> Find us on the map <ArrowUpRight size={14} aria-hidden="true" /></a></div></div>
          <p className="contact-secondary-phone">You can also reach us at <a href={`tel:${contact.phones[1].replace(/\s/g, "")}`}>{contact.phones[1]}</a>.</p>
        </aside>
      </section>
    </div>
  );
}
