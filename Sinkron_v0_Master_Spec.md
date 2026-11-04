# SINKRON Water Meters Website — Master v0 Build Specification

## 1. Project Goal
Build a complete, responsive, production-ready 5-page website for **SINKRON Water Meters**.

This is a small professional industrial/manufacturing website, not a large enterprise portal. The website should feel premium, modern, technically credible, spacious, and easy to use without becoming overdesigned.

The supplied **approved Home page screenshot** is the STRICT MASTER VISUAL REFERENCE for the entire website.
The supplied **Sinkron catalogue PDF** is the STRICT CONTENT / PRODUCT DATA SOURCE.
The supplied **Sinkron logo and product images** are the STRICT BRAND / PRODUCT ASSETS.

Do not invent claims, certifications, clients, years of experience, awards, manufacturing statistics, or technical product data.

## 2. Primary UX Strategy
Design each page around one clear purpose:
- **Home:** impress the visitor and explain the brand quickly.
- **About:** build confidence and communicate company purpose.
- **Products:** help users understand the available water meter range.
- **Applications:** help users understand where the products are used.
- **Contact:** make enquiry effortless.

Keep pages concise.
Do not make every page long.
Do not add large hero sections to internal pages.
Only the **Home page** should have the full premium hero section.

## 3. Required Pages
Create exactly these 5 primary pages:
1. `/` — Home
2. `/about` — About
3. `/products` — Products
4. `/applications` — Applications
5. `/contact` — Contact / Enquiry

Do not create separate Single-Jet, Multi-Jet, or Woltman pages at this stage.

## 4. Master Visual Direction
Use the approved Home page screenshot as the master design system.

Preserve:
- generous white space
- clean industrial aesthetic
- Sinkron teal + navy palette
- strong modern typography
- realistic product / industrial imagery
- subtle borders
- controlled rounded corners
- minimal shadows
- clear section hierarchy
- small uppercase eyebrow labels
- premium but restrained CTA styling
- wide desktop spacing
- clean responsive layouts

### Design Theme
**Modern Industrial Precision**

The website must feel:
- professional
- trustworthy
- technical
- premium
- minimal
- modern
- product-focused
- easy to understand

Avoid:
- generic SaaS styling
- glassmorphism
- neon
- excessive gradients
- huge decorative blobs
- floating UI cards
- heavy animation
- fake futuristic imagery
- AI-looking industrial scenes
- excessive water splash graphics

## 5. Colour System
Use the same palette as the approved Home design:
- Primary Teal: `#70C8BC`
- Deep Teal: `#176D69`
- Deep Ink / Navy: `#111719`
- Off White: `#F7F8F6`
- Mist Teal: `#EAF4F2`
- Technical Grey: `#707A7C`
- Border Grey: `#D9E0DE`

Colour balance:
- 70–75% white / off-white
- 15% dark typography
- 8–10% teal
- minimal secondary colour

Do not add unrelated accent colours.

## 6. Typography
Use:
- **Manrope** for headings
- **Inter** for body copy, labels, technical content, form fields, and tables

Typography should feel modern, confident, highly readable, technical, and premium.

## 7. Global Layout Rules
Desktop first.

Use:
- max content width around `1280px`
- 12-column grid
- generous horizontal margins
- strong vertical rhythm
- major section spacing around `96–120px`
- section heading to content spacing around `32–40px`
- card gaps around `24–28px`
- major container radius around `20–24px`
- card radius around `12–16px`

White space is part of the design.
Do not compress sections.

## 8. Reusable Components
Create reusable components:
- Header
- Footer
- SectionEyebrow
- SectionHeading
- PrimaryButton
- SecondaryButton
- ProductCard
- ApplicationCard
- FeatureRow
- CTASection
- EnquiryForm
- ProductCarousel
- Container
- PageIntro

Keep spacing, radius, type sizes, and button styles consistent.

## 9. Header
Use one consistent header across all pages.

Navigation:
- Home
- About
- Products
- Applications
- Contact

Right side CTA:
**Request Quote**

Use the header styling from the approved Home screenshot.

Mobile:
- logo
- hamburger menu
- clear Request Quote action

# 10. HOME PAGE
The Home page is the most visually important page.
Follow the supplied approved Home screenshot as closely as practical.
Do not reinterpret the overall composition.

## 10.1 Home Hero
This is the ONLY large main hero on the website.

Keep:
- strong left-side content hierarchy
- large product / industrial visual area
- premium whitespace
- Sinkron palette
- refined CTA treatment
- no unnecessary floating UI

### Hero Product Carousel Requirement
Create a smooth **product image flip carousel** featuring:
1. Single-Jet Water Meter
2. Multi-Jet Water Meter
3. Woltman Type Water Meter

Important:
- flip / transition only the product visual or product visual area
- do not rotate or flip the entire hero section
- keep the hero layout stable
- autoplay around every 5–6 seconds
- subtle transition
- small pagination dots
- no large side arrows
- swipe support on mobile
- pause on user interaction
- accessible controls
- respect reduced-motion preferences

Use **Swiper** if required.
Use the actual Sinkron product images supplied.
Do not redesign product geometry.

## 10.2 Home Content Sections
Preserve the approved Home visual rhythm:
1. Hero
2. Key trust / product information strip
3. About preview
4. Product range
5. Why Choose Sinkron
6. Applications
7. Testimonials
8. Final enquiry CTA
9. Footer

Do not add unnecessary extra sections.

# 11. ABOUT PAGE
The About page must NOT look like a duplicate Home page.
Do NOT create another huge hero.

## Compact Intro
Eyebrow:
`ABOUT SINKRON`

Headline:
**Precision. Reliability. Responsible Water Management.**

Short supporting copy based strictly on the supplied catalogue.

## Main Sections
### Who We Are
Use a spacious 2-column editorial layout focused on:
- accurate measurement
- dependable performance
- efficient / responsible water management

### Mission & Vision
Create one strong split layout.
Do not use two generic cards.
Use the mission / vision content from the supplied catalogue.

### Product Capability
Show:
- Single-Jet
- Multi-Jet
- Woltman

Use actual product images.
Keep this compact.

### CTA
Use a concise quote / contact CTA.

Keep About to approximately 4–5 main sections including the intro.

# 12. PRODUCTS PAGE
Do NOT create a large hero.

## Compact Intro
Eyebrow:
`OUR PRODUCTS`

Headline:
**Water Meter Solutions for Different Flow Requirements.**

Then move directly into products.

## Single-Jet Water Meter
Use supported catalogue content only:
- Magnetic dry dial
- Metrological Class B
- Corrosion-resistant body
- Maximum working temperature 30°C
- Domestic, industrial and agricultural applications
- Sizes: DN15 / DN20 / DN25

## Multi-Jet Water Meter
Supported catalogue content:
- Metrological R-100
- Magnetic dry dial
- Internal filter
- Corrosion-resistant body
- Maximum working temperature up to 50°C
- Sizes: DN15 / DN20 / DN25 / DN40

## Woltman Type Water Meter
Supported catalogue content:
- Magnetic dry dial
- Metrological Class B
- Interchangeable measuring mechanism
- Corrosion-resistant body
- Larger flow / size requirements
- Sizes: DN50 / DN65 / DN80 / DN100 / DN150 / DN200

Use alternating product layouts for visual rhythm.

## Technical Information
The catalogue includes:
- technical specifications
- dimensions
- size charts
- flow-error curves

Create clean UI for this data:
- thin separators
- aligned numeric values
- technical diagrams where supplied
- mobile-friendly horizontal scrolling when required

## Product Support CTA
**Not Sure Which Meter Fits Your Requirement?**
CTA: **Request Product Assistance**

# 13. APPLICATIONS PAGE
Do NOT create a large hero.

## Compact Intro
Eyebrow:
`APPLICATIONS`

Headline:
**Designed Around Real Water-Measurement Needs.**

## Main Applications
Use catalogue-supported language:
- Domestic
- Agricultural
- Industrial

If the approved Home design includes Commercial, it may remain visually, but do not invent unsupported technical claims about it.

For each application:
- one relevant image
- short description
- recommended product family where supportable
- concise CTA if needed

## Selection Guidance
Heading:
**Choosing the Right Meter Starts With the Requirement.**

Use four simple rows:
1. Application
2. Pipe Size
3. Flow Requirement
4. Operating Conditions

## Final CTA
**Have a Specific Application in Mind?**
CTA: **Talk to Our Team**

# 14. CONTACT PAGE
This should be the shortest page.
Do NOT create a large hero.

## Compact Intro
Eyebrow:
`CONTACT SINKRON`

Headline:
**Let’s Talk About Your Water Metering Requirement.**

## Contact Layout
Two columns.

### Left
Use real contact information from the supplied catalogue:
- Address
- Email
- Phone
- Website

Also show:
**Not sure which meter you need? Share your application, required size and quantity.**

### Right
Create the enquiry form.

Fields:
- Name
- Company
- Phone
- Email
- Application
- Meter Type
- Required Size
- Quantity
- Message

Primary CTA:
**Send Enquiry**

# 15. Enquiry Form Backend Architecture
Implement the form for this flow:

Website Form
→ Server-side API route
→ Validate input
→ Save to Supabase
→ Send Email Notification
→ Send Telegram Bot Notification
→ Return Success State

Use a server-side route such as:
`POST /api/enquiry`

Do not expose secrets in client-side code.

## Supabase
Prepare an `enquiries` table with fields such as:
- id
- name
- company
- phone
- email
- application
- meter_type
- size
- quantity
- message
- created_at
- email_status
- telegram_status

Save the enquiry before notifications.

## Email
Use a Resend-ready server function.

Environment variables:
- `RESEND_API_KEY`
- `ENQUIRY_EMAIL`

## Telegram
Use Telegram Bot API for automatic owner notification.

Environment variables:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Send:
- Name
- Company
- Phone
- Email
- Application
- Meter Type
- Size
- Quantity
- Message

Do not expose Telegram credentials in the frontend.

## WhatsApp
Do NOT use WhatsApp Cloud API.

Use a normal **WhatsApp click-to-chat** action for customers who want to contact Sinkron directly.

Keep the number configurable.

# 16. Validation & Security
Use:
- Zod schema validation
- honeypot field
- basic rate limiting
- safe input length limits
- clear error handling

Do not trust frontend validation alone.

If notification delivery fails, the saved enquiry must remain available in Supabase.

# 17. Tech Stack
Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Swiper for the Home product flip carousel
- Lucide icons where needed
- Supabase-ready backend integration
- Resend-ready email notification
- Telegram Bot API-ready notification
- Vercel-ready deployment

Prefer server components where possible.
Avoid unnecessary dependencies.

# 18. SEO & Metadata
Add basic metadata for all pages:
- Home — Sinkron Water Meters
- About — Sinkron Water Meters
- Products — Sinkron Water Meters
- Applications — Sinkron Water Meters
- Contact — Sinkron Water Meters

Add page descriptions, Open Graph basics, semantic headings, and descriptive alt text.

# 19. Performance
Prioritize:
- optimized images
- `next/image`
- proper image sizing
- lazy loading below the fold
- minimal JavaScript
- stable layout
- good mobile performance

# 20. Accessibility
Ensure:
- keyboard navigation
- visible focus states
- sufficient contrast
- semantic HTML
- accessible carousel controls
- proper form labels
- clear error messages
- reduced-motion support
- comfortable mobile touch targets

# 21. Responsive Behaviour
Do not mechanically shrink desktop.

Mobile:
- compact navigation
- stacked content
- readable type
- proper section spacing
- usable product carousel
- vertically stacked cards
- horizontally scrollable technical tables if needed
- single-column enquiry form
- clear full-width CTAs

# 22. Content Integrity
The Sinkron catalogue is the source of truth.

Do not invent:
- certifications
- ISO approvals
- years of experience
- client names
- awards
- countries served
- production capacity
- government approvals
- testing claims
- performance numbers

Testimonials must remain placeholders unless real testimonials are supplied.

# 23. Build Strategy
Do not stop at describing the design.
Generate the working project.

First:
1. Build the complete 5-page responsive site.
2. Create reusable components.
3. Reproduce the approved Home visual direction as closely as practical.
4. Implement internal pages with compact page intros.
5. Implement the product flip carousel.
6. Implement the enquiry form UI and backend-ready structure.
7. Ensure all navigation works.
8. Ensure mobile responsiveness.

Pixel-perfect Home refinements will be done manually after the first complete build, so prioritize a clean, maintainable implementation.

# 24. Final Quality Standard
The finished first build should already feel like one cohesive website.

It must not feel like five separately generated pages.

Use the approved Home page as the visual source of truth.

The final experience should feel:

**clean enough to be premium  
technical enough to be credible  
simple enough to use quickly  
consistent enough to feel professionally designed**

Do not overbuild the project.
