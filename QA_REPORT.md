# Website QA report

Date: 2026-10-31

Test target: the local Next.js production build at http://localhost:3100, using Chromium on Windows.

## Corrections verified

- Corrected the homepage product photos: Single-Jet and Woltman cards previously displayed other meter models. Cards now use the catalogue image for their named product.
- Fixed insufficient contrast in navigation, buttons, hero benefit panels, body text, captions, form legends and footer text, including the active link in the open mobile menu.
- Fixed mobile navigation retaining its open state when resizing to desktop. Focus moves to visible desktop navigation when needed. Route changes reset the menu without an extra state-setting effect.
- Fixed the broken `next lint` command by configuring the ESLint CLI for the installed Next.js version. Removed an obsolete TypeScript suppression and corrected lint and ARIA errors.
- Malformed enquiry JSON now returns 400 instead of a server error. Unsupported content types return 415. Oversized bodies return 413, with a 16 KiB limit enforced while reading the request stream.
- Invalid phone numbers without enough digits are blocked before submission and rejected by the API. Correcting the input clears its browser validation error.
- Fixed the unreachable spam-field handling: filled honeypot requests are discarded before customer-field validation and never saved or delivered.
- Bounded the in-memory rate-limit table, added expired-entry cleanup, and returned a `Retry-After` header with useful recovery guidance.

## Final validation

| Check | Result |
| --- | --- |
| ESLint | Passed, zero warnings |
| TypeScript | Passed |
| Automated API and enquiry-context tests | 18 passed |
| Production build | Passed |
| Browser QA suite | 218 checks passed |
| Existing typography, spacing and interaction regression suite | 95 checks passed |
| Automated axe accessibility scans | 14 scans, zero reported violations |
| Browser JavaScript errors | None reported |
| Broken page/asset responses and internal anchor targets | None found |
| Responsive page overflow | None found at tested widths |
| Prepared image files | All 158 referenced variants present |

Pages tested: Home, About, Products, Applications and Contact.

Responsive widths: 320, 390, 600, 768, 820, 1024, 1440, 1920 and 2560 pixels, including a short landscape viewport. Regression checks also exercised a 2× device pixel ratio and reduced-motion behavior.

Accessibility scans covered the ten desktop/phone page combinations plus expanded product tables, open mobile navigation, an enquiry error and an enquiry confirmation. Automated scanning was supplemented by keyboard, focus, resize, image fallback, link, native validation, selection handoff, duplicate submission, timeout and recovery checks. Automated results do not constitute a full manual accessibility certification.

## Remaining live verification

The design checks do not submit live enquiries to Supabase or notification providers. Success-path service tests use mocks; QA does not send real email, Telegram or WhatsApp messages. The existing enquiry backend and the form's recovery options are preserved. Provider credentials and live delivery must be assessed separately from this design review.

Testing used Chromium; native Safari and Firefox were not exercised.

## Repeat the checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

With the production preview running locally on port 3100, run `npm run qa:browser`. Start that preview with `npm run start -- -p 3100` if it is not already running. The browser suite writes details and screenshots to `.preview/qa-report.json` and `.preview/qa-*.png`. Set `QA_CHROME_PATH` if Chrome or Edge is installed elsewhere; `QA_URL` may specify another local test port. The suite intentionally rejects non-local targets and mocks successful notification submissions.

## Buyer experience refinements — 3 November 2026

- Production build, TypeScript compilation and ESLint passed.
- Home, expanded Products tables and Contact fit at 320, 390, 768 and 1440 pixels. About and Applications were also checked at 1440 pixels: 14 layout checks without horizontal overflow.
- Five full-page axe audits (Home and Products on desktop/phone, plus phone Contact) reported no violations. These automated checks are not an accessibility certification.
- The approved hero text, feature cards, geometry and three-second image-slider configuration were preserved at all four tested widths.
- Product enquiry links retain the selected meter. The comparison link opens the specification section, including after client navigation.
- Below-fold content reveals once. Keyboard focus exposes pending content immediately, and reduced motion or disabled JavaScript leaves all content readable.
- No browser runtime errors or failed page/asset responses were reported.
- Desk research, design reasoning and validation limits are documented in `UX_REVIEW.md`; this was not a customer interview study.

The focused browser report is `.preview/refinements-report.json`, with visual previews under `.preview/hero-refined-*.png`.
