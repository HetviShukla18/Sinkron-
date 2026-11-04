"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { EnquiryInitialValues } from "@/lib/enquiry-context";
import { buildWhatsAppEnquiryUrl } from "@/lib/enquiry-message";

const emptyInitial: EnquiryInitialValues = { meterType: "", application: "", message: "" };

export function EnquiryForm({ initial = emptyInitial, whatsappUrl, whatsappNumber, phone }: { initial?: EnquiryInitialValues; whatsappUrl: string; whatsappNumber: string; phone: string }) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [successWhatsAppUrl, setSuccessWhatsAppUrl] = useState<string | null>(null);
  const pendingRequest = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    pendingRequest.current?.abort();
    pendingRequest.current = null;
  }, []);

  useEffect(() => {
    if (state === "error" || state === "success") feedbackRef.current?.focus();
  }, [state]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pendingRequest.current) return;

    const form = e.currentTarget;
    const phoneInput = form.elements.namedItem("phone") as HTMLInputElement;
    if ((phoneInput.value.match(/\d/g)?.length ?? 0) < 7) {
      phoneInput.setCustomValidity("Enter a phone number with at least 7 digits.");
      phoneInput.reportValidity();
      return;
    }
    phoneInput.setCustomValidity("");
    const controller = new AbortController();
    pendingRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    const payload = Object.fromEntries(Array.from(new FormData(form), ([key, value]) => [key, typeof value === "string" ? value : ""]));
    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok !== true) {
        throw new Error(data?.error || "Unable to send your enquiry. Please try again or contact us by phone or WhatsApp.");
      }
      if (pendingRequest.current !== controller) return;
      setSuccessWhatsAppUrl(buildWhatsAppEnquiryUrl(whatsappNumber, payload));
      form.reset();
      setState("success");
    } catch (err) {
      if (pendingRequest.current !== controller) return;
      setState("error");
      setError(controller.signal.aborted
        ? "The request took too long. Please contact us by phone or WhatsApp to confirm your enquiry."
        : err instanceof Error ? err.message : "Unable to send your enquiry. Please try again.");
    } finally {
      window.clearTimeout(timeout);
      if (pendingRequest.current === controller) pendingRequest.current = null;
    }
  }

  function startAnother() {
    setState("idle");
    setError("");
    setSuccessWhatsAppUrl(null);
    window.requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('[name="name"]')?.focus());
  }

  if (state === "success") {
    return (
      <div className="enquiry-success-panel form-feedback" ref={feedbackRef} tabIndex={-1} aria-labelledby="enquiry-success-title">
        <CheckCircle2 size={32} aria-hidden="true" />
        <h3 id="enquiry-success-title">Thank you for getting in touch.</h3>
        <p className="form-success" role="status">Your enquiry has been received. Our team will use the contact details you shared to get in touch.</p>
        <div className="enquiry-success-actions">
          {successWhatsAppUrl && <a href={successWhatsAppUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Continue on WhatsApp</a>}
          <Link href="/products" className="text-link">Explore our meters</Link>
          <button type="button" className="btn btn-outline" onClick={startAnother}>Send another enquiry</button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} className="enquiry-form" onSubmit={submit} aria-busy={state === "loading"} onInput={(event) => {
      if (event.target instanceof HTMLInputElement && event.target.name === "phone") event.target.setCustomValidity("");
      if (state === "error") setState("idle");
    }}>
      <div className="honeypot" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <fieldset className="enquiry-fieldset" disabled={state === "loading"}>
        <legend>01 / YOUR DETAILS</legend>
        <div className="form-grid">
          <label><span>Name *</span><input name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="Your name" /></label>
          <label><span>Company</span><input name="company" autoComplete="organization" maxLength={120} placeholder="Company name" /></label>
          <label><span>Phone *</span><input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} placeholder="Phone number" /></label>
          <label><span>Email *</span><input name="email" autoComplete="email" required type="email" maxLength={120} placeholder="Email address" /></label>
        </div>
      </fieldset>
      <fieldset className="enquiry-fieldset" disabled={state === "loading"}>
        <legend>02 / YOUR REQUIREMENT</legend>
        <div className="form-grid">
          <label><span>Application</span><select name="application" defaultValue={initial.application}><option value="">Select application</option><option>Domestic</option><option>Commercial</option><option>Agricultural</option><option>Industrial</option><option>Other</option></select></label>
          <label><span>Meter Type</span><select name="meterType" defaultValue={initial.meterType}><option value="">Select meter</option><option>Single-Jet</option><option>Multi-Jet</option><option>Woltman</option><option>Not Sure</option></select></label>
          <label><span>Required Size</span><input name="size" maxLength={30} placeholder="e.g. DN25" /></label>
          <label><span>Quantity</span><input name="quantity" inputMode="numeric" maxLength={20} placeholder="Required quantity" /></label>
        </div>
        <label className="message-field"><span>Anything else we should know?</span><textarea name="message" defaultValue={initial.message} rows={4} maxLength={1500} placeholder="Tell us a little about your project" /></label>
      </fieldset>
      <div className="form-submit-row">
        <button type="submit" className="btn btn-primary" disabled={state === "loading"}>{state === "loading" ? "Sending..." : "Send Enquiry →"}</button>
        <div ref={feedbackRef} className="form-feedback" tabIndex={-1} role={state === "error" ? "alert" : "status"}>
          {state === "error" && <><p className="form-error">{error}</p><div className="form-recovery-links"><a href={`tel:${phone.replace(/\s/g, "")}`}>Call our team</a><a href={whatsappUrl} target="_blank" rel="noreferrer">Continue on WhatsApp</a></div></>}
        </div>
      </div>
    </form>
  );
}
