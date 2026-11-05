import Link from "next/link";
import { ArrowUpRight, Globe, Mail, MapPin, Phone } from "lucide-react";
import { Brand } from "@/components/brand";
import { contact } from "@/lib/data";

export function Footer() {
  return (
    <footer className="footer">
      <div className="site-container footer-grid">
        <div className="footer-brand">
          <Link href="/" aria-label="Sinkron Water Meters home"><Brand inverse /></Link>
          <p>Measuring Water for a Sustainable Tomorrow.</p>
        </div>
        <div>
          <h3>Quick Links</h3>
          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/products">Products</Link>
            <Link href="/applications">Applications</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <h3>Contact</h3>
          <div className="footer-contact">
            <span><MapPin size={15} aria-hidden="true" /> Ahmedabad, Gujarat, India</span>
            <a href={`mailto:${contact.email}`}><Mail size={15} aria-hidden="true" /> {contact.email}</a>
            <a href={`tel:${contact.phones[0].replace(/\s/g, "")}`}><Phone size={15} aria-hidden="true" /> {contact.phones[0]}</a>
            <a href={`https://${contact.website}`} target="_blank" rel="noreferrer"><Globe size={15} aria-hidden="true" /> {contact.website}</a>
          </div>
        </div>
      </div>
      <div className="site-container footer-bottom">
        <span>&copy; {new Date().getFullYear()} Sinkron Water Meters. All Rights Reserved.</span>
        <div className="footer-legal"><Link href="/contact?subject=privacy-policy">Privacy Policy</Link><span aria-hidden="true">|</span><Link href="/contact?subject=terms">Terms &amp; Conditions</Link></div>
        <div className="footer-socials" aria-label="Contact shortcuts">
          <a href={`tel:${contact.phones[0].replace(/\s/g, "")}`} aria-label="Call Sinkron"><Phone size={17} aria-hidden="true" /></a>
          <a href={`mailto:${contact.email}`} aria-label="Email Sinkron"><Mail size={17} aria-hidden="true" /></a>
          <Link href="/contact#enquiry-title" aria-label="Send an enquiry"><ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </div>
    </footer>
  );
}
