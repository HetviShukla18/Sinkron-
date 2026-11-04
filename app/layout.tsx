import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./home.css";
import "./interior.css";
import "./design-tokens.css";
import "./site-system.css";
import "./refinements.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { RevealObserver } from "@/components/reveal-observer";
import { contact } from "@/lib/data";

const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  variable: "--font-inter",
  weight: "400 800",
  display: "swap",
});

const manrope = localFont({
  src: "./fonts/manrope-latin-variable.woff2",
  variable: "--font-manrope",
  weight: "500 800",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${contact.website}`),
  title: { default: "Sinkron Water Meters", template: "%s | Sinkron Water Meters" },
  description: "Reliable water metering solutions for domestic, industrial and agricultural applications.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Sinkron Water Meters",
    description: "Reliable water metering solutions for accurate measurement and responsible water management.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Header />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <RevealObserver />
        <Footer />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
