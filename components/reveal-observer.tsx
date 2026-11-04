"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Progressive enhancement: server-rendered content is visible without JavaScript.
// Only sections below the viewport are prepared for a single, quiet reveal.
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>("main [data-reveal]"));
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.revealState = "visible";
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -16px 0px" });

    function prepare() {
      observer.disconnect();
      const viewportHeight = window.innerHeight;
      // Read geometry before changing attributes to avoid repeated layout work.
      const positions = elements.map(element => element.getBoundingClientRect().top);
      elements.forEach((element, index) => {
        if (!preference.matches && positions[index] >= viewportHeight && element.dataset.revealState !== "visible") {
          element.dataset.revealState = "pending";
          observer.observe(element);
        } else element.dataset.revealState = "visible";
      });
    }
    prepare();
    preference.addEventListener("change", prepare);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", prepare);
      elements.forEach(element => { element.dataset.revealState = "visible"; });
    };
  }, [pathname]);

  return null;
}
