"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

// Copy supplied in the approved homepage reference.
const testimonials = [
  { quote: "The meters are reliable in daily use and the overall product quality has been consistent.", name: "R. Mehta", role: "Contractor, Ahmedabad" },
  { quote: "Good accuracy and durable build quality. Suitable for our commercial projects.", name: "K. Sharma", role: "Project Manager, Infrastructure Firm" },
  { quote: "Support team is responsive and helpful. We are satisfied with the performance.", name: "J. Patel", role: "Procurement Head, Industrial Unit" },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const move = (step: number) => setIndex((current) => (current + step + testimonials.length) % testimonials.length);

  return (
    <section className="site-container testimonials-section" aria-label="Client experience">
      <SectionHeading eyebrow="CLIENT EXPERIENCE" title="Trusted by Professionals." action={
        <div className="testimonial-controls">
          <div className="testimonial-dots" aria-label="Choose a testimonial">
            {testimonials.map((item, i) => <button key={item.name} type="button" onClick={() => setIndex(i)} aria-label={`Show testimonial from ${item.name}`} aria-pressed={index === i}><span className={index === i ? "active" : ""} /></button>)}
          </div>
          <button type="button" className="testimonial-arrow" aria-label="Previous testimonial" onClick={() => move(-1)}><ChevronLeft size={16} /></button>
          <button type="button" className="testimonial-arrow" aria-label="Next testimonial" onClick={() => move(1)}><ChevronRight size={16} /></button>
        </div>
      } />
      <div className="testimonial-grid" aria-live="polite" aria-atomic="true">
        {testimonials.map((_, offset) => {
          const item = testimonials[(index + offset) % testimonials.length];
          return <article className="testimonial-card" key={item.name}><div className="quote-mark" aria-hidden="true">&ldquo;</div><p>{item.quote}</p><hr /><strong>{item.name}</strong><span>{item.role}</span></article>;
        })}
      </div>
    </section>
  );
}
