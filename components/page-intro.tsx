import { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";

export function PageIntro({ eyebrow, title, body, aside, links }: { eyebrow: string; title: ReactNode; body?: string; aside?: ReactNode; links?: readonly { label: string; href: string }[] }) {
  return (
    <section className="site-container interior-intro">
      <div className="interior-heading">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
      <div className="interior-intro-aside">
        {body && <p>{body}</p>}
        {aside}
      </div>
      {links && <nav className="page-section-links" aria-label="On this page">{links.map(link => <Link href={link.href} key={link.href}>{link.label}<ArrowDown aria-hidden="true" /></Link>)}</nav>}
    </section>
  );
}
