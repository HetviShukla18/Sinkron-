# Sinkron Water Meters Website

A 5-page Next.js website built from the approved Sinkron Home design system and the supplied catalogue content.

## Pages

- `/` Home
- `/about` About
- `/products` Products
- `/applications` Applications
- `/contact` Contact / Enquiry

Only Home uses the large premium hero. Internal pages use compact introductions and the same shared visual system.

Home and the inner pages share measured typography and spacing tokens in `app/design-tokens.css`, applied by `app/site-system.css`. At 1440px, the display type is 82px, section headings 40px, body copy 18px, section gaps 145px, and section-heading gaps 56px. Phone sizes and spacing follow the Home layout; tablet copy has readable minimum sizes.

The About, Products, Applications and Contact layouts use `app/interior.css` for their page-specific structure. Native section links and expandable product specifications keep navigation lightweight. Product and application enquiries preserve their context in the Contact form; only recognized query values are accepted. Contact is rendered per request to read those selections. Keyboard users have a skip link and dismissible navigation, and enquiry outcomes receive focus with recovery contact links on failure. The layouts reuse prepared responsive image assets.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS + project CSS
- Lucide icons
- Supabase-ready lead storage
- Resend-ready email notification
- Telegram Bot API notification
- Meta WhatsApp Cloud API template notifications and separate public Click-to-Chat
- Vercel-ready

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
npm run start
```

## Environment variables

Copy `.env.example` to `.env.local` and add your real values.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
ENQUIRY_EMAIL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_RECIPIENT_NUMBER=
WHATSAPP_API_VERSION=
WHATSAPP_TEMPLATE_NAME=
WHATSAPP_TEMPLATE_LANGUAGE=en_US
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

Never commit `.env.local`.

Next.js does not load `.env.example`. Keep actual credentials in `.env.local` for local development and in the hosting environment for deployments. Restart the development server after changing credentials. A valid enquiry returns `503` when Supabase storage is not configured; the server log identifies this configuration error. Notifications only run after the enquiry has been saved.

The Supabase SDK and SSR helper are pinned to compatible releases for Node 20. The enquiry route supplies the `ws` transport because Supabase initializes its Realtime client even when the route only uses database storage.

## Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase.sql`.
4. Copy the project URL and keys into `.env.local`.
5. The enquiry API saves the lead before sending notifications.

The `SUPABASE_SERVICE_ROLE_KEY` is used only inside the server API route and must never be exposed to the browser.

## Resend email

The API route is prepared for Resend. It uses the Resend HTTP API with a three-second timeout.

Set `RESEND_FROM_EMAIL` in `.env.local` to the existing authorized sender. Before production, verify the client's domain in Resend and configure a sender from that domain. Sender and recipient addresses are read server-side from the environment.

Set:

```env
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
ENQUIRY_EMAIL=client@example.com
```

## Telegram notifications

1. Manually create your bot with [BotFather](https://t.me/BotFather); login and BotFather are never automated.
2. From the project terminal, run `node scripts/setup-telegram.mjs`.
3. Paste the bot token into the hidden prompt. The script stores it only in ignored `.env.local` and preserves your other settings.
4. Open your bot, press **Start**, send **Hello**, and press Enter in the terminal.

The script calls the [official Telegram Bot API](https://core.telegram.org/bots/api#getupdates), finds the newest private chat in the returned updates, saves `TELEGRAM_CHAT_ID` in `.env.local`, and sends a connection test. It prints the chat ID and confirms completion only after Telegram accepts that message. Rerunning it reuses the existing token. If no private message is available yet, it prompts you to try again. It never prints the token, API URLs, raw provider errors, or incoming messages, and it does not remove an existing bot webhook.

`lib/telegram.ts` sends plain-text enquiry notifications server-side to the configured chat, with empty fields omitted. Failed Telegram requests produce a fixed safe server log and set `telegram_status` to `failed`; the saved enquiry and successful form response are retained. No browser API exposes either Telegram setting. Live verification requires your bot token and a private message to the bot; automated tests use fake credentials and mocked delivery.

## WhatsApp: two independent functions

The public WhatsApp buttons and the **Continue on WhatsApp** success link keep using `NEXT_PUBLIC_WHATSAPP_NUMBER` for Click-to-Chat. These links only prefill a conversation; the visitor must press Send. They cannot deliver automatic notifications. Their UI and behavior are unchanged.

Automatic notifications run exclusively on the server in `lib/whatsapp.ts`, imported by `app/api/enquiry/route.ts`. The module is marked `server-only`. It sends an authenticated JSON POST to `https://graph.facebook.com/{WHATSAPP_API_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages`, addressed only to `WHATSAPP_RECIPIENT_NUMBER`. It never falls back to the public Click-to-Chat number or to the customer's phone number.

### Why an approved template is required

A website submission does not open a WhatsApp customer service window with the notification recipient. These business-initiated alerts therefore always use an approved message template, even if a conversation happens to be open. There is no free-form text fallback. See [WhatsApp's official messaging policy](https://business.whatsapp.com/policy) and [Meta's official Cloud API collection](https://www.postman.com/meta/whatsapp-business-platform/collection/wlk6lh4/whatsapp-cloud-api).

### Beginner setup: test first, then production

1. Open [Meta for Developers](https://developers.facebook.com/apps/), sign in, and register as a developer if prompted. Create an app with the WhatsApp Business messaging use case (or add WhatsApp to an existing suitable Business app). Select or create your business portfolio. This is a **Meta developer app**, not the WhatsApp Business mobile app. Follow the current dashboard prompts; their labels can change.
2. Open the app's **WhatsApp > API Setup** (sometimes called **Getting Started**). Meta's supported test setup provides a test WhatsApp Business Account and a test sending phone number. Copy its **Phone Number ID** and the temporary **access token**. The ID is not the visible phone number, App ID, or WhatsApp Business Account ID. Keep the token private.
3. Add your own WhatsApp-enabled phone as a **test recipient** in API Setup and complete the verification code flow. This is the phone that should receive Sinkron alerts; include the country code. Use Meta's dashboard **Send message** action to send its pre-approved `hello_world` test template. This tests Meta connectivity only; it does not contain an enquiry and is not the template used by this application. See [Meta's official test-message request](https://www.postman.com/meta/whatsapp-business-platform/request/9php9mt/send-test-message).
4. In **WhatsApp Manager > Message templates**, create the enquiry template below on the same WhatsApp Business Account as the sending number. Use the name `sinkron_website_enquiry`, select **English (US)** (`en_US`), and use numbered/positional variables. Submit it under the category that accurately describes the account/enquiry alert; Meta decides approval and category. Wait until it is **approved** and active. A pre-approved `hello_world` test message does not replace this approval. If the test account does not allow a custom template, keep testing connectivity there and complete the custom-template test on your registered business account.
5. Fill the six server-only values in ignored `.env.local` using the table below. Copy the **supported Graph API version from the API Setup request example**, including the leading `v` (format `vXX.0`); the code deliberately has no hardcoded version default. Do not prefix these settings with `NEXT_PUBLIC_`. Existing Supabase, email, Telegram, and public WhatsApp settings must remain in place.
6. In your existing Supabase project's **SQL Editor**, run the updated `supabase.sql`. It safely adds `whatsapp_status` to an existing table without deleting enquiries. Historical rows start as `skipped`. This migration has been supplied in the repository, not automatically applied to your hosted database.
7. Restart the local server. Submit one test enquiry through the existing website form. Confirm the saved row in Supabase, email, Telegram, and the WhatsApp alert. Inspect `email_status`, `telegram_status`, and `whatsapp_status`. Use server logs for setup failures; no diagnostic API returns credentials. An incomplete WhatsApp setup produces `skipped` while the saved enquiry and other channels continue working.
8. For production, register and verify your real business sending number in WhatsApp Manager. Confirm the approved template belongs to that account. Create a system-user access token in your business settings, assign the app and WhatsApp business assets, and grant `whatsapp_business_messaging` for sending (`whatsapp_business_management` is needed when managing templates/accounts). Replace the temporary test token and test Phone Number ID with the production values. Complete any business verification, billing, or account checks Meta requires. The receiving phone must have agreed to receive the alerts and be different from the sending phone. Follow [Meta's Cloud API setup documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started).
9. Put the same server-only settings in your hosting environment and redeploy. Keep development/test credentials separate from production. Do not paste access tokens into chats, public configuration, URLs, or committed files.

| `.env.local` variable | Value to obtain |
| --- | --- |
| `WHATSAPP_ACCESS_TOKEN` | Meta API Setup temporary token for testing; an appropriately permissioned system-user token for production |
| `WHATSAPP_PHONE_NUMBER_ID` | API Setup's sending **Phone Number ID**, a numeric ID |
| `WHATSAPP_RECIPIENT_NUMBER` | Your opted-in receiving WhatsApp phone, country code included; for testing it must be added and verified in Meta's recipient list |
| `WHATSAPP_API_VERSION` | Supported `vXX.0` version shown in Meta's generated API request |
| `WHATSAPP_TEMPLATE_NAME` | Exact approved template name, e.g. `sinkron_website_enquiry` |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Exact approved language code, e.g. `en_US` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Existing public Click-to-Chat destination only; keep it unchanged |

### Exact enquiry template contract

Create a **body-only** template with this text, four numbered text variables, and no separate header, footer, media, or buttons:

```text
🔔 New Sinkron Website Enquiry

Name: {{1}}
Phone: {{2}}
Email: {{3}}

Details: {{4}}

Please follow up with this website enquiry.
```

Supply safe sample values to Meta when submitting: `Example Customer`, `919999900000`, `customer@example.com`, and `Company: Example Ltd | Application: Industrial | Meter Type: Multi-Jet | Size: DN25 | Quantity: 2 | Message: Please send a quotation.`

The code passes name, phone, email, and a labeled summary of **only populated optional fields** (company, application, meter type, size, quantity, message), in that order. For example, an enquiry with only a size and a message produces `Size: DN25 | Message: Please call.` in the fourth variable. Empty optional labels are omitted. With no optional information the fourth parameter is `No additional details provided.`; Meta template parameters cannot be empty. Because template layout is fixed, optional fields are grouped rather than represented by blank fixed lines. Newlines/tabs/repeated whitespace in parameter values are flattened; the full original message stays in Supabase, email and Telegram. Body-only templates avoid the smaller populated-body limit associated with additional components, so do not add a separate header/footer to this contract. The template is a draft until Meta approves it; approval is not guaranteed by the code.

All six private settings are required for sending. Missing settings skip the channel; invalid configuration, rejected templates, token problems, API errors, malformed responses and timeouts fail it safely. Requests use Bearer authorization, a bounded timeout, disabled redirects and no automatic retry. Safe logs identify common setup issues without logging tokens, raw provider errors, request headers, recipient numbers or enquiry content. A timeout can mean acceptance is unknown, so blind retries could duplicate an alert.

`whatsapp_status` is `sent`, `failed`, or `skipped`. **`sent` means Meta accepted the API request and returned a message ID; it does not prove handset delivery.** WhatsApp Manager or a future verified status-webhook integration is needed to investigate subsequent delivery failures. If the database migration has not yet run, the route still saves the enquiry, sends the notifications, and falls back to updating the existing email/Telegram status columns; it logs that WhatsApp status tracking needs the migration. No notification failure deletes an enquiry or changes a successful saved-enquiry response.

## Performance and verification

Inter and Manrope are self-hosted variable WOFF2 fonts in `app/fonts`, with their SIL Open Font License files alongside them. No Google Fonts requests are needed at runtime or build time.

Pages use pre-generated responsive AVIF and WebP files in `public/assets/optimized`, rendered by the server component `components/responsive-image.tsx`. Browsers choose the appropriate format and width without a runtime image-conversion request. Important images are preloaded and below-the-fold images remain lazy-loaded. Inter is preloaded; Manrope loads only on pages that use it.

After changing a source image in `public/assets`, run `npm run optimize-images` to regenerate the variants and `lib/image-manifest.json`. The script uses Sharp, which is included with the installed Next.js image tooling. Commit the generated files along with the source change; builds do not need to encode images or download fonts.

Enquiry requests time out after 15 seconds in the browser. The API validates and saves to Supabase first, attempts email, then Telegram, then WhatsApp, records notification statuses, and returns success. Storage has a five-second timeout and email a three-second timeout. Telegram and WhatsApp share the remaining notification budget up to an 11-second deadline from request start, with each network request capped at five seconds. When WhatsApp is configured, Telegram reserves half the remaining time for it. Status updates share a two-second budget up to the 13-second deadline, leaving headroom within the existing browser timeout. Safe server logs distinguish setup, rate-limit, timeout and connectivity failures without printing credentials or provider descriptions. Notification or status-update failures never delete or reject a successfully saved enquiry.

Run `npm run typecheck`, `npm test`, and `npm run build` before release. API tests mock storage and delivery services and do not send real notifications.

Run `npm run lint` for Next.js/React/TypeScript linting. With a local production preview on port 3100, `npm run qa:browser` checks page rendering, accessibility, internal links and anchors, responsive layouts, navigation, image fallback, form validation and feedback, and API error contracts. It uses an isolated Chromium profile, mocks successful enquiries, and saves its results under `.preview`. `QA_URL` can select another local port and `QA_CHROME_PATH` can select the browser executable. See `QA_REPORT.md` for the latest verified results and the remaining live-delivery boundary.

## Home hero slider

The Home hero loops through three images in this order: Home Hero, Brass Water Meter Installation, then Blue Flanged Water Meter Installation. Only the image layer changes. The heading, copy, feature cards, spacing, hero height, and other Home sections remain fixed.

`components/hero-image-slider.tsx` uses the installed Swiper package with a 3-second interval and a 900ms crossfade. All three responsive images are eagerly preloaded, and automatic rotation waits until all have loaded and decoded. Mobile swipes and keyboard arrow keys can change the image manually. Hovering or clicking the image does not stop the automatic loop. Keyboard focus and hidden tabs pause playback; reduced motion disables automatic playback and transitions. No visible arrows or dots are added.

The original supplied PNGs remain in `public/assets`; `home-hero-blue.webp` and `home-hero-brass.webp` preserve their full proportions for the responsive image pipeline. To regenerate only their variants without re-encoding other site assets, run `npm run optimize-images -- home-hero-blue.webp home-hero-brass.webp`.

## Content integrity

The product features and size ranges are based on the supplied Sinkron catalogue. Do not add certifications, ISO claims, clients, awards, years of experience, countries served, manufacturing capacity, or performance claims unless the client supplies verified information.

Home uses catalogue facts, selection guidance and the existing company contact details in place of placeholder testimonials. Add customer endorsements only after the client supplies verified feedback. See `UX_REVIEW.md` for the desk-research findings and design decisions.

## Existing domain / Vercel

Recommended deployment flow:

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Add environment variables in Vercel Project Settings.
4. Test on the Vercel preview URL.
5. Once approved, connect the client's existing domain.
6. Preserve existing MX/email DNS records when changing website DNS records.

## Manual UI refinement

The Home page is already structured around the approved reference, but final pixel-level refinement should be done after opening it in the browser because font rendering, browser dimensions, and image crops can differ from a static design screenshot.

Key files:

- `app/page.tsx` - Home
- `app/globals.css` - visual system / spacing
- `components/header.tsx`
- `components/footer.tsx`
- `components/product-carousel.tsx`
- `components/enquiry-form.tsx`
- `app/api/enquiry/route.ts`
- `lib/data.ts` - product and application content
