# BINGO Parapharmacie — Website & Compliance Guide

A premium static e-commerce front-end (black / dark-grey / gold) for **BINGO Parapharmacie**,
built with accessibility, privacy and legal safety as first-class concerns.

> ⚠️ **Not legal advice.** The legal pages are solid templates, but they contain
> placeholders and assumptions. Have a qualified lawyer in Tunisia (and, if you sell to the
> EU, an EU-aware adviser) review them before you go live.

---

## 1. What's in this project

| File | Purpose |
|------|---------|
| `index.html` | Homepage (hero, categories, products, promo, tabs, why-us, newsletter) |
| `privacy-policy.html` | Privacy Policy (Tunisia Loi 2004-63 + GDPR-aware) |
| `cookie-policy.html` | Cookie Policy + cookie inventory |
| `terms-and-conditions.html` | Terms & Conditions of sale and use |
| `legal-notice.html` | Legal Notice / company identification ("mentions légales") |
| `contact.html` | Contact form + business details + FAQ |
| `shipping-returns.html` | Delivery & returns policy |
| `about.html` | About page |
| `category.html`, `cart.html`, `account.html`, `wishlist.html` | Branded placeholders (to be wired to a backend) |
| `assets/css/styles.css` | All styling, WCAG-checked palette |
| `assets/js/main.js` | Nav, tabs, wishlist, forms, **cookie consent gate** |
| `assets/img/logo.jpeg` | Your logo |

**Run it locally:**
```bash
python -m http.server 8123
```
Then open `http://localhost:8123`. (Opening the raw file over `file://` won't load the CSS/JS — use a server.)

---

## 2. ✅ What was done for you (your checklist)

- **Privacy Policy, Terms & Conditions, Cookie Policy** — all created.
- **Legal Notice** page with company identification (a legal requirement for online sellers).
- **Cookie consent** — a real, working banner. Strictly-necessary only by default; analytics
  and marketing are **off until the user opts in**. Reopens via the "Cookie Settings" footer link.
- **Consent gate in code** — `assets/js/main.js` will only run analytics through the
  `loadAnalytics()` hook *after* consent. Nothing tracks the user before that.
- **Form consent** — the newsletter and contact forms both require an explicit, unticked-by-default
  consent checkbox that links to the Privacy Policy.
- **Only necessary data** — forms collect the minimum; no hidden trackers; no data is transmitted
  in this demo build (see §4).
- **Analytics tracking** — **none is installed.** No Google Analytics, Meta Pixel, etc. (see §4).
- **Third-party embeds** — **none.** Google Fonts are deliberately *not* hotlinked (that would send
  every visitor's IP to Google without consent — ruled a GDPR breach by a German court in 2022).
  The site uses elegant system-font fallbacks. To use the exact premium fonts, **self-host** them (see §6).
- **Accessibility** — semantic HTML5 landmarks, skip-link, `lang`, visible focus rings, ARIA on
  tabs/dialog/icon-buttons, `prefers-reduced-motion` support, keyboard-operable tabs (arrow keys).
- **Alt text** — every meaningful image has alt text; the decorative footer logo uses `alt=""` correctly.
- **Colour contrast** — audited: all text ≥ 4.5:1 (most ≥ 9:1). Passes WCAG 2.1 AA.
- **Keyboard-friendly forms** — native labels, `required`, visible focus, `autocomplete`, live status regions.
- **Clear button labels** — "Add to Cart", "Subscribe", "Accept all", etc.; icon-only buttons carry `aria-label`.
- **Unsupported claims removed** — copy makes **no medical/therapeutic claims**. It states plainly that
  products are *not medicines* and do *not diagnose/treat/cure* — essential for a parapharmacie.
- **"Favorite views" note** — you asked to remove "favorite views." Your detailed brief separately asked
  for a **Wishlist**, which is standard e-commerce, so it was kept. If you meant remove it, say so and it's a 2-minute change.
- **Business details** — placeholders are in place and clearly flagged (see §3).
- **Image copyright** — see §5. The WhatsApp product photos were **not** embedded (copyright risk).

---

## 3. 🔴 What YOU must fill in before launch

Search the project for `[` — every placeholder is wrapped in `[SQUARE BRACKETS]` and shown with a
red dashed highlight on the legal pages. At minimum:

- Registered business name, legal form, address, **Matricule Fiscal**, Commercial Register number
- Contact email(s), phone, opening hours
- Hosting provider name & address (in `legal-notice.html`)
- "Last updated" dates on the three legal pages
- Delivery zones, costs, timings; return window and refund timing
- Your payment provider name(s)
- INPDP declaration reference, if you have one

---

## 4. 🔴 Before this handles real customer data

This is a **front-end demo**: forms validate but **do not send anything** anywhere. Before launch:

1. **Serve over HTTPS** (never collect data over plain HTTP).
2. **Wire forms to a backend** you control. Validate and sanitise all input **server-side** too.
3. **Never store passwords in plain text** — hash them (bcrypt/argon2) server-side.
4. **Payments:** use a proper gateway (e.g. Flouci / your bank's e-commerce service). Never build
   your own card handling; never store full card numbers. (Prohibited to enter card data yourself.)
5. **If you add analytics later:** implement `window.loadAnalytics` and it will *only* run after
   consent. Then list the cookie in `cookie-policy.html` and update the Privacy Policy.

---

## 5. 🔴 Image copyright & the photos you added (read this)

At your request, the 19 WhatsApp product photos are now live on the homepage
(`assets/img/product-01.jpeg` … `product-19.jpeg`):

- **12 clean product shots** → the product-card grids (Argan Oil hair line, Marula mask,
  ISDIN foot gel & Fusion Water sunscreens, Florative Blue Tox / W One / W Two Plex).
- **7 Sensilis SPF graphics** → the "Sensilis Sun Care Edit" showcase (they keep their baked-in prices).

**Two real risks you are accepting by publishing these:**

1. **Copyright.** These are brand/supplier marketing images (ISDIN, Sensilis, Argan Oil, Florative,
   Marula). Reselling the products does **not** automatically grant the right to publish the brand's
   photos. Get **written authorisation** from each supplier/distributor to use their imagery, or
   replace them with **your own photography**. Keep proof.
2. **Third-party personal data.** `product-01.jpeg` (Sensilis Water Fluid) has **real customers'
   names and comments** overlaid (Imen Jlidi, Salma Aloui, Sana Ghozlani, etc.). Publishing
   identifiable people's names/testimonials without their consent is a privacy problem, and showing
   testimonials that can't be substantiated can breach consumer law. **Recommended:** swap it for a
   clean crop of the bottle, or get those customers' written consent. (Say the word and I'll replace it.)

**Prices & product titles** on the clean-shot cards are **placeholders** — set your real prices.
The Sensilis showcase prices come from inside the images. The **logo** is treated as yours — confirm
you own/are licensed to use it.

To swap any image later: replace the file in `assets/img/` (keep the same name), or edit the
`<img src="assets/img/product-XX.jpeg" …>` tag in `index.html`.

---

## 6. Optional: self-host the premium fonts (privacy-safe)

To get Cormorant Garamond (headings) + Inter (body) without leaking visitor data to Google:
download the WOFF2 files (e.g. from google-webfonts-helper), put them in `assets/fonts/`, and add
`@font-face` rules at the top of `styles.css`. The CSS variables already reference these font names
with safe fallbacks, so they'll "just work" once the files are present.

---

## 7. Applicable law — quick map (verify with counsel)

- **Personal data:** Loi organique n° 2004-63 (2004), regulator **INPDP** — you may need to file a
  declaration/authorisation for processing customer data. GDPR (EU 2016/679) if you target/serve EU customers.
- **E-commerce:** Loi n° 2000-83 (2000) on electronic exchanges and commerce.
- **Consumer protection:** Loi n° 92-117 (1992).
- **Cookies:** consent for non-essential cookies (ePrivacy-style best practice; required for EU visitors).
- **Sector:** ensure you hold any authorisations required to operate a parapharmacie and to sell your
  product categories; keep medical/therapeutic claims out of your copy.

---

## 8. Other risks flagged

- **No SSL/HTTPS yet** — mandatory before collecting any data.
- **Forms are demo-only** — connect + protect (rate-limit, CAPTCHA alternative, spam protection) before launch.
- **Ratings/reviews shown are placeholders** — don't display fake reviews as real; that can breach consumer law.
- **"Up to 30% off" / discount badges** — only show genuine, honoured discounts (misleading price claims are unlawful).
- **Newsletter** — only email people who ticked the consent box; keep proof of consent; always include unsubscribe.
- **Accessibility** — automated checks pass, but do a manual screen-reader + full keyboard pass before launch.

---

*Built as a static site — no build step, no dependencies, no trackers.*
