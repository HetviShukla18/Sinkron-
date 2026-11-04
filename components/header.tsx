"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const links = [
  ["Home", "/"],
  ["About", "/about"],
  ["Products", "/products"],
  ["Applications", "/applications"],
  ["Contact", "/contact"]
] as const;

export function Header() {
  const pathname = usePathname();
  return <HeaderNavigation key={pathname} pathname={pathname} />;
}

function HeaderNavigation({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function dismissOutside(event: PointerEvent | FocusEvent) {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setOpen(false);
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      menuButton.current?.focus();
    }
    const desktop = window.matchMedia("(min-width: 1025px)");
    function dismissOnDesktop() {
      if (!desktop.matches) return;
      const focusInMenu = header.current?.querySelector("#mobile-navigation")?.contains(document.activeElement);
      setOpen(false);
      if (focusInMenu) header.current?.querySelector<HTMLElement>('.desktop-nav [aria-current="page"]')?.focus();
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    desktop.addEventListener("change", dismissOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
      desktop.removeEventListener("change", dismissOnDesktop);
    };
  }, [open]);

  return (
    <header className="site-header" ref={header}>
      <div className="site-container header-inner">
        <Link href="/" aria-label="Sinkron Water Meters home" className="logo-wrap" onClick={() => setOpen(false)}>
          <Brand />
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className={pathname === href ? "active" : ""} aria-current={pathname === href ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link href="/contact" className="btn btn-primary header-quote">Request Quote <ArrowRight size={14} aria-hidden="true" /></Link>
          <button ref={menuButton} type="button" className="menu-button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls={open ? "mobile-navigation" : undefined}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className={pathname === href ? "active" : ""} aria-current={pathname === href ? "page" : undefined}>
              {label}
            </Link>
          ))}
          <Link href="/contact" className="btn btn-primary" onClick={() => setOpen(false)}>Request Quote →</Link>
        </nav>
      )}
    </header>
  );
}
