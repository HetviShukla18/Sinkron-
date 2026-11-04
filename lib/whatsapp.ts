import "server-only";
import { formatEnquiryDetails, type EnquiryDetails } from "@/lib/enquiry-message";

export type WhatsAppStatus = "sent" | "failed" | "skipped";

export function getWhatsAppConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN?.trim() ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "",
    recipientNumber: process.env.WHATSAPP_RECIPIENT_NUMBER?.trim() ?? "",
    apiVersion: process.env.WHATSAPP_API_VERSION?.trim() ?? "",
    templateName: process.env.WHATSAPP_TEMPLATE_NAME?.trim() ?? "",
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() ?? "",
  };
}

type WhatsAppConfig = ReturnType<typeof getWhatsAppConfig>;

export function isWhatsAppConfigured(config: WhatsAppConfig): boolean {
  return Object.values(config).every(Boolean);
}

// Approved templates have fixed text. Keep required contact fields in slots 1-3;
// slot 4 carries only populated optional fields, including the customer's message.
// Template text parameters must be single-line; the original remains in Supabase.
export function buildWhatsAppTemplateParameters(enquiry: EnquiryDetails) {
  const singleLine = (value: string) => value.replace(/\s+/gu, " ").trim();
  const optionalDetails = formatEnquiryDetails({
    company: enquiry.company,
    application: enquiry.application,
    meterType: enquiry.meterType,
    size: enquiry.size,
    quantity: enquiry.quantity,
    message: enquiry.message,
  }).replace(/Message:\n/u, "Message: ").split(/\n+/u).map(singleLine).filter(Boolean).join(" | ");
  return [enquiry.name ?? "", enquiry.phone ?? "", enquiry.email ?? "", optionalDetails || "No additional details provided."]
    .map(text => ({ type: "text" as const, text: singleLine(text) }));
}

export async function sendWhatsAppEnquiry(enquiry: EnquiryDetails, config = getWhatsAppConfig(), timeoutMs = 5_000): Promise<WhatsAppStatus> {
  if (!isWhatsAppConfigured(config)) {
    if (Object.values(config).some(Boolean)) {
      console.error("WhatsApp notification skipped. Configure all server-only WhatsApp credentials and approved template settings.");
    }
    return "skipped";
  }
  if (timeoutMs <= 0) {
    console.error("WhatsApp notification skipped. The request time budget was exhausted. The enquiry remains saved in Supabase.");
    return "skipped";
  }

  const recipient = config.recipientNumber.replace(/[\s()+-]/g, "");
  if (!/^[1-9]\d{6,14}$/.test(recipient) || !/^[1-9]\d{0,31}$/.test(config.phoneNumberId) ||
      !/^v[1-9]\d*\.0$/.test(config.apiVersion) || !/^[a-z0-9_]{1,512}$/.test(config.templateName) ||
      !/^[a-z]{2,3}(?:_[A-Za-z]{2,8})?$/.test(config.templateLanguage)) {
    console.error("WhatsApp notification failed. Check the server-only number, phone number ID, API version and template settings. The enquiry remains saved in Supabase.");
    return "failed";
  }

  let failure = "Meta returned no message acceptance confirmation.";
  try {
    const response = await fetch(`https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "template",
        template: {
          name: config.templateName,
          language: { code: config.templateLanguage },
          components: [{ type: "body", parameters: buildWhatsAppTemplateParameters(enquiry) }],
        },
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(Math.max(1, Math.min(5_000, Math.floor(timeoutMs)))),
    });
    const result = await response.json();
    // "sent" means Meta accepted the API request, not confirmed handset delivery.
    if (response.ok && result.messaging_product === "whatsapp" &&
        typeof result.messages?.[0]?.id === "string" && result.messages[0].id.startsWith("wamid.")) return "sent";

    const code = Number(result.error?.code);
    if (code === 190 || response.status === 401 || response.status === 403) failure = "Check the access token, WhatsApp permissions and assigned business assets.";
    else if (code === 131030) failure = "Add and verify the recipient in Meta's test-number setup.";
    else if (code === 132001) failure = "The approved template name or language was not found on this WhatsApp account.";
    else if (code === 132000 || code === 132012) failure = "The approved template must use the documented four body text parameters.";
    else if (code === 132015 || code === 132016) failure = "The template is paused or disabled; check WhatsApp Manager.";
    else if (response.status === 429 || code === 130429 || code === 131048) failure = "Meta is rate limiting messages; check WhatsApp Manager.";
    else if (response.status >= 500) failure = "Meta is temporarily unavailable.";
  } catch (error) {
    // Never log provider response bodies, URLs, headers, tokens or customer data.
    const name = error && typeof error === "object" && "name" in error ? error.name : "";
    failure = name === "TimeoutError" || name === "AbortError"
      ? "The Meta request timed out; acceptance could not be confirmed."
      : "The server could not reach Meta or read its response.";
  }
  console.error(`WhatsApp notification failed. ${failure} The enquiry remains saved in Supabase.`);
  return "failed";
}
