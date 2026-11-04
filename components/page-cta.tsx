import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function PageCTA({ title = "The right meter starts with the right conversation.", body = "Tell us about your application. We’ll help you explore the options.", label = "Talk to our team", href = "/contact" }: { title?: string; body?: string; label?: string; href?: string }) {
  return (
    <section className="site-container interior-cta">
      <div>
        <div className="eyebrow">LET’S MOVE YOUR PROJECT FORWARD</div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      <Link href={href} className="interior-cta-link"><span>{label}</span><ArrowUpRight size={28} aria-hidden="true" /></Link>
    </section>
  );
}
