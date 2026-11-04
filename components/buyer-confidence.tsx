import Link from "next/link";
import { ArrowUpRight, FileText, MessageSquare, Ruler } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const steps = [
  { number: "01", icon: Ruler, title: "Find the right fit.", body: "Explore three meter families and connection sizes from DN15 to DN200 across the range.", label: "Compare the range", href: "/products" },
  { number: "02", icon: FileText, title: "Check the technical data.", body: "Review the flow rates, working pressure and temperature limits before you specify a meter.", label: "View specifications", href: "/products#specifications" },
  { number: "03", icon: MessageSquare, title: "Discuss your requirements.", body: "Share your application, connection size and quantity to start a product or quotation enquiry.", label: "Request a quote", href: "/contact#enquiry-title" },
];

export function BuyerConfidence() {
  return (
    <section className="site-container buyer-confidence" aria-label="Product selection and direct contact">
      <SectionHeading reveal eyebrow="BEFORE YOU ORDER" title={<>Know the details.<br /><span className="quiet-accent">Choose with confidence.</span></>} body="For contractors, engineers and procurement teams. The information you need, and a direct way to ask the next question." />
      <div className="confidence-grid">
        {steps.map(({ number, icon: Icon, title, body, label, href }) => (
          <article className="confidence-card" key={number} data-reveal>
            <div className="confidence-card-top"><span>{number} / YOUR NEXT STEP</span><Icon size={24} aria-hidden="true" /></div>
            <h3>{title}</h3><p>{body}</p>
            <Link href={href}>{label}<ArrowUpRight size={16} aria-hidden="true" /></Link>
          </article>
        ))}
      </div>
    </section>
  );
}
