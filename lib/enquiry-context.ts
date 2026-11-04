import { applications, products } from "@/lib/data";

export type EnquiryInitialValues = { meterType: string; application: string; message: string };

export function getEnquiryContext(query: Record<string, string | string[] | undefined>) {
  const meter = typeof query.meter === "string" ? products.find(product => product.slug === query.meter) : undefined;
  const application = typeof query.application === "string"
    ? applications.find(item => item.name.toLowerCase() === query.application)
    : undefined;
  const subjects = new Map([
    ["privacy-policy", "I would like information about your privacy policy."],
    ["terms", "I would like information about your terms and conditions."],
  ]);
  const initial: EnquiryInitialValues = {
    meterType: meter ? ({ "single-jet": "Single-Jet", "multi-jet": "Multi-Jet", woltman: "Woltman" } as const)[meter.slug] : "",
    application: application?.name === "Residential" ? "Domestic" : application?.name ?? "",
    message: typeof query.subject === "string" ? subjects.get(query.subject) ?? "" : "",
  };
  return { initial, selection: [meter?.name, application ? `${application.name} application` : undefined].filter(Boolean).join(" · ") };
}
