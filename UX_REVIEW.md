# Sinkron website: buyer experience review

Reviewed 3 November 2026. Audience priority: contractors, engineers and procurement buyers equally, as requested.

## Research method and limits

This is desk research and a review of the existing website, catalogue data and enquiry journey. It is not a claim that Sinkron customers were interviewed or that conversion improvements have been measured. The audience needs below are working hypotheses informed by published B2B research; validate them with representative customers after release.

## Evidence and design decisions

| Finding | Source | Change |
| --- | --- | --- |
| B2B buyers need useful product information before contacting sales and a straightforward route to ask questions. | [NN/g: B2B trust](https://www.nngroup.com/articles/b2b-trust-from-b2c/) | Add direct technical-data and quotation links below the hero. Make both product details and meter-specific enquiries visible on product cards. |
| Different people participate in researching, specifying and approving a B2B purchase. Concise summaries and deeper information serve different stages. | [NN/g: B2B usability](https://www.nngroup.com/articles/b2b-usability/) | Keep the three product families scannable, highlight connection sizes, and link to the existing detailed specification tables. |
| Water-meter selection depends on the expected flow range and operating conditions, not simply a matching nominal size. | [PNNL: Water Metering Best Practices](https://www.pnnl.gov/projects/femp-metering-best-practices/water-metering) | Prompt visitors to review size, expected flow and working pressure. Provide product guidance rather than an unsupported automatic sizing recommendation. |

## Priorities by visitor

- Contractors: find an applicable meter family, confirm connection sizes and contact the supplier directly.
- Engineers: inspect published flow, pressure and temperature data before specifying a meter.
- Procurement: identify the product clearly, preserve its context in an enquiry and locate real business contact information.

These are design hypotheses, not findings from interviews with these roles.

## Trust and content integrity

- Remove the stray `st` text visible above the Home product cards.
- Replace the Home placeholder testimonials with practical product-selection guidance and the existing company phone, email and location. Do not present placeholder names or quotations as customer endorsements.
- Keep product sizes and descriptions tied to `lib/data.ts`. Do not invent prices, certifications, customer counts, delivery guarantees or response-time promises.
- Existing certification wording in the approved hero was preserved, not independently verified. Obtain supporting documents before adding certification badges or stronger accreditation claims.
- Keep the approved hero wording, composition, feature cards and Home Hero → Brass → Blue slider unchanged. Its three-second timing remains intact.
- Keep the existing enquiry backend and success flow unchanged.

## Motion specification

- A small, one-time fade and 16px rise for below-fold content, lasting 550ms.
- Short card stagger: 70ms between adjacent cards, with no long waiting sequence.
- Small product-card and image hover movements to signal interactivity. No flashing, pulsing quotations, rolling counters or moving hero text.
- No content hidden by default: without JavaScript or IntersectionObserver, it remains readable.
- Respect `prefers-reduced-motion`. Keyboard focus immediately reveals any pending content.

## Suggested follow-up with real users

Ask representatives from each role to find a meter, locate its operating limits, and start a quotation enquiry. Observe completion, points of confusion and whether they can explain what information they still need. Request genuine, attributable customer feedback before publishing testimonials. Treat changes to engagement or enquiry completion as unproven until measured.
