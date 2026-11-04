import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { contact } from "@/lib/data";

export function CTASection({ title = "Need Help Choosing the Right Meter?", body = "Share your application, required size and flow requirement and our team will help you identify the right solution." }: { title?: string; body?: string }) {
  return (
    <section className="site-container cta-panel" data-reveal>
      <div>
        <div className="eyebrow light">LET&apos;S FIND THE RIGHT SOLUTION</div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      <div className="cta-actions">
        <Link href="/contact#enquiry-title" className="btn btn-white">Request a quote <ArrowRight size={19} aria-hidden="true" /></Link>
        <a href={`tel:${contact.phones[0].replace(/\s/g, "")}`} className="cta-text-link">Or call {contact.phones[0]}</a>
      </div>
    </section>
  );
}
