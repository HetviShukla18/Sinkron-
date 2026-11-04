"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { src: "/assets/hero-water-plant.png", alt: "Sinkron water meter installed in water infrastructure" },
  { src: "/assets/meter-installed.png", alt: "Sinkron water meter installed on blue pipework" },
  { src: "/assets/water-plant-wide.png", alt: "Water treatment infrastructure with metering equipment" }
];

export function ProductCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setIndex((v) => (v + 1) % slides.length), 5500);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div className="hero-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="hero-flip-stage" aria-live="polite">
        {slides.map((slide, i) => (
          <div key={slide.src} className={`hero-slide ${i === index ? "active" : ""}`} aria-hidden={i !== index}>
            <Image src={slide.src} alt={slide.alt} fill priority={i === 0} sizes="100vw" className="hero-slide-image" />
          </div>
        ))}
      </div>
      <div className="hero-dots" role="group" aria-label="Hero product slides">
        {slides.map((_, i) => (
          <button key={i} type="button" onClick={() => setIndex(i)} className={i === index ? "active" : ""} aria-label={`Show slide ${i + 1}`} aria-pressed={i === index} />
        ))}
      </div>
    </div>
  );
}
