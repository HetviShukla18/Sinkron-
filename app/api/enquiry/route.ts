import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { z } from "zod";
import { EnquiryPayloadError, readEnquiryPayload } from "@/lib/enquiry-payload";
import { sendTelegramEnquiry } from "@/lib/telegram";
import { formatEnquiryDetails } from "@/lib/enquiry-message";
import { getWhatsAppConfig, isWhatsAppConfigured, sendWhatsAppEnquiry } from "@/lib/whatsapp";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  company: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().min(7).max(30).refine(value => (value.match(/\d/g)?.length ?? 0) >= 7),
  email: z.string().trim().email().max(120),
  application: z.string().trim().max(60).optional().default(""),
  meterType: z.string().trim().max(60).optional().default(""),
  size: z.string().trim().max(30).optional().default(""),
  quantity: z.string().trim().max(20).optional().default(""),
  message: z.string().trim().max(1500).optional().default(""),
  website: z.string().max(0).optional().default("")
});

const rate = new Map<string, { count: number; start: number }>();
const rateWindow = 60_000;
const maxRateEntries = 1_000;

function allowed(ip: string) {
  const now = Date.now();
  const current = rate.get(ip);
  if (!current || now - current.start >= rateWindow) {
    if (!current && rate.size >= maxRateEntries) {
      for (const [key, entry] of rate) {
        if (now - entry.start >= rateWindow) rate.delete(key);
      }
      if (rate.size >= maxRateEntries) return false;
    }
    rate.set(ip, { count: 1, start: now });
    return true;
  }
  if (current.count >= 5) return false;
  current.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowed(ip)) return NextResponse.json({ error: "Too many requests. Please try again in a minute or contact us by phone or WhatsApp." }, { status: 429, headers: { "Retry-After": "60" } });

  try {
    const json = await readEnquiryPayload(req);
    // Quietly discard honeypot submissions before validating the customer fields.
    if (json && typeof json === "object" && "website" in json && typeof json.website === "string" && json.website.trim()) {
      return NextResponse.json({ ok: true });
    }
    const data = schema.parse(json);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const enquiryEmail = process.env.ENQUIRY_EMAIL;
    const emailSender = process.env.RESEND_FROM_EMAIL;
    const bot = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;
    const emailConfigured = Boolean(resendKey && enquiryEmail && emailSender);
    const telegramConfigured = Boolean(bot && chat);
    const whatsappConfig = getWhatsAppConfig();
    const whatsappConfigured = isWhatsAppConfigured(whatsappConfig);
    const unavailable = "Unable to send your enquiry right now. Please contact us by phone or WhatsApp.";

    if (!(supabaseUrl && serviceRole)) {
      console.error("Enquiry storage is not configured. Set Supabase credentials in .env.local or the deployment environment.");
      return NextResponse.json({ error: unavailable }, { status: 503 });
    }

    // Bound storage requests and reuse the client for the status update.
    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Supabase initializes Realtime even for database-only requests on Node 20.
      realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(5_000) }) },
    });

    const { data: row, error } = await supabase
      .from("enquiries")
      .insert({
        name: data.name,
        company: data.company,
        phone: data.phone,
        email: data.email,
        application: data.application,
        meter_type: data.meterType,
        size: data.size,
        quantity: data.quantity,
        message: data.message,
        email_status: emailConfigured ? "pending" : "not_configured",
        telegram_status: telegramConfigured ? "pending" : "not_configured"
      })
      .select("id")
      .single();
    if (error || row?.id == null) throw new Error("Unable to save enquiry.");
    const enquiryId = row.id;

    const summary = `New Sinkron Website Enquiry\n\n${formatEnquiryDetails(data)}`;

    async function notifyEmail() {
      if (!emailConfigured) return "not_configured";
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: emailSender,
            to: [enquiryEmail],
            subject: `New Sinkron enquiry - ${data.name}`,
            text: summary,
          }),
          signal: AbortSignal.timeout(3_000),
        });
        const result = await res.json();
        if (res.ok && result.id) return "sent";
      } catch {
        // Provider errors may contain credentials or customer data.
      }
      console.error("Email notification failed. The enquiry remains saved in Supabase.");
      return "failed";
    }

    // A failed notification must never undo an already saved enquiry.
    const emailStatus = await notifyEmail();
    // Share the remaining notification budget between Telegram and WhatsApp.
    // Reserve two seconds for status persistence plus headroom inside the existing
    // 15-second browser timeout. No notification starts before the durable save.
    const remaining = Math.max(1, 11_000 - (Date.now() - started));
    const telegramTimeout = Math.min(5_000, whatsappConfigured ? Math.max(1, Math.floor(remaining / 2)) : remaining);
    const telegramStatus = await sendTelegramEnquiry(data, bot, chat, telegramTimeout);
    const whatsappStatus = await sendWhatsAppEnquiry(data, whatsappConfig, 11_000 - (Date.now() - started));

    const statusTimeout = () => AbortSignal.timeout(Math.max(1, Math.min(2_000, 13_000 - (Date.now() - started))));
    try {
      const { error } = await supabase.from("enquiries")
        .update({ email_status: emailStatus, telegram_status: telegramStatus, whatsapp_status: whatsappStatus })
        .eq("id", enquiryId)
        .abortSignal(statusTimeout());
      if (error && ["PGRST204", "42703"].includes(error.code) && error.message?.includes("whatsapp_status")) {
        // A pending migration must never break saving leads or the existing
        // notification status tracking. Never retry the insert or the messages.
        console.error("WhatsApp status tracking is unavailable. Run supabase.sql to add whatsapp_status. The enquiry remains saved.");
        const { error: legacyError } = await supabase.from("enquiries")
          .update({ email_status: emailStatus, telegram_status: telegramStatus })
          .eq("id", enquiryId)
          .abortSignal(statusTimeout());
        if (legacyError) console.error("Unable to update enquiry notification status.");
      } else if (error) console.error("Unable to update enquiry notification status.");
    } catch {
      console.error("Unable to update enquiry notification status.");
    }
    return NextResponse.json({ ok: true, enquiryId });
  } catch (err) {
    if (err instanceof EnquiryPayloadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Please check the form fields and try again." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to send your enquiry right now. Please contact us by phone or WhatsApp." }, { status: 500 });
  }
}
