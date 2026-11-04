export type EnquiryDetails = Partial<Record<
  "name" | "company" | "phone" | "email" | "application" | "meterType" | "size" | "quantity" | "message",
  string
>>;

export function formatEnquiryDetails(enquiry: EnquiryDetails): string {
  const groups: [string, keyof EnquiryDetails][][] = [
    [["Name", "name"], ["Company", "company"], ["Phone", "phone"], ["Email", "email"]],
    [["Application", "application"], ["Meter Type", "meterType"], ["Size", "size"], ["Quantity", "quantity"]],
  ];
  const blocks = groups.map(fields => fields.flatMap(([label, key]) => {
    const value = enquiry[key]?.trim();
    return value ? [`${label}: ${value}`] : [];
  }).join("\n")).filter(Boolean);
  const message = enquiry.message?.trim();
  if (message) blocks.push(`Message:\n${message}`);
  return blocks.join("\n\n");
}

export function buildWhatsAppUrl(number: string, message: string): string | null {
  const digits = number.trim().replace(/[\s()+-]/g, "");
  if (!/^[1-9]\d{6,14}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppEnquiryUrl(number: string, enquiry: EnquiryDetails): string | null {
  return buildWhatsAppUrl(number, [
    "Hello Sinkron,", "", "I have submitted an enquiry through your website.", "",
    formatEnquiryDetails(enquiry),
  ].join("\n"));
}
