import { formatEnquiryDetails, type EnquiryDetails } from "@/lib/enquiry-message";

export function formatTelegramEnquiry(enquiry: EnquiryDetails): string {
  return `🔔 New Sinkron Website Enquiry\n\n${formatEnquiryDetails(enquiry)}`;
}

export async function sendTelegramEnquiry(enquiry: EnquiryDetails, token?: string, chatId?: string, timeoutMs = 5_000): Promise<"sent" | "failed" | "not_configured"> {
  if (!token?.trim() || !chatId?.trim()) return "not_configured";
  let failure = "Telegram returned no delivery confirmation.";
  try {
    const response = await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId.trim(), text: formatTelegramEnquiry(enquiry),
        link_preview_options: { is_disabled: true },
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(Math.max(1, Math.min(5_000, timeoutMs))),
    });
    const result = await response.json();
    if (response.ok && result.ok === true && Number.isInteger(result.result?.message_id)) return "sent";
    const code = Number(result.error_code) || response.status;
    if (code === 401 || code === 404) failure = "The bot token was rejected; run the Telegram setup script again.";
    else if (code === 403) failure = "Open the Telegram bot, unblock it if needed, and press Start.";
    else if (code === 400) failure = "Check the configured private chat by running the Telegram setup script again.";
    else if (code === 429) failure = "Telegram is rate limiting requests; try again later.";
    else if (code >= 500) failure = "Telegram is temporarily unavailable.";
  } catch (error) {
    // Fetch errors can contain the secret-bearing URL. Never log the error object.
    const name = error && typeof error === "object" && "name" in error ? error.name : "";
    failure = name === "TimeoutError" || name === "AbortError"
      ? "The Telegram request timed out."
      : "The server could not reach Telegram or read its response.";
  }
  console.error(`Telegram notification failed. ${failure} The enquiry remains saved in Supabase.`);
  return "failed";
}
