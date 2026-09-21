# BINGO Parapharmacie — Design System ("Editorial Noir")

A luxury parapharmacie system. The redesign replaced a generic, AI-templated look
with an editorial one: antique gold used as **hairlines and accents** (not glow),
rectangular architecture, a serif display voice, and disciplined spacing.

Applies to every page (all link `assets/css/styles.css`). Class names were preserved,
so the legal pages inherited the new look automatically.

---

## AI-slop removed

| Slop pattern (before) | Replaced with |
|---|---|
| Radial gold **glow gradients** behind hero & promo | Flat ground; a thin gold hairline frame inside the hero image |
| **Gradient-filled pill buttons** + gold glow shadows | Solid rectangular buttons (3px radius); one clean fill/border hover, no shadow |
| **Glassmorphism blur** nav | Solid black nav with a hairline underline that condenses on scroll |
| **Eyebrow label on every section** | One editorial `.sec-head` per section: index number + title + rule + right-aligned meta |
| Italic gold "accent word" cliché | Kept a single restrained italic accent in the H1 only |
| Everything **pill-rounded** (999px / 14–22px) | Architectural radii: 3–4px; pills gone |
| **Gold-circle** feature icons | Numbered editorial row (01–05), hairline-divided, serif labels |
| Centered-everything | Left-aligned editorial headers; asymmetric hero; hairline grids |

## Design tokens

**Color** (WCAG 2.1 AA verified — see ratios below)
- Ground: `--bg #0A0A0B` · band `--bg-2 #0E0E10` · cards `--panel #131316` / `--panel-2 #17171B`
- Hairlines: `--line rgba(244,241,234,.10)` · `--line-strong …/.18`
- Ink: `--ink #F4F1EA` · `--ink-dim #A9A69D` · `--ink-mute #7C7A73`
- Antique gold: `--gold #C6A15B` · `--gold-bright #DABE7E` · `--gold-deep #9C7C3C` · on-gold `#0A0A0B`

**Type** — Display: Cormorant Garamond → Georgia serif. UI/body: Inter → system sans.
Serif carries headings, product titles, section titles; sans carries UI, labels, body.
(Google Fonts are **not** hotlinked — privacy/GDPR; see README-COMPLIANCE §6 to self-host.)

**Shape & space** — radii 3–4px, no pills. 8px rhythm. Luxury leans on **rules and space**, not shadows (only the cookie banner keeps a shadow, for layering).

**Motion** — 140–220ms ease; one interaction per element (border/fill/underline reveal, gentle image zoom). Full `prefers-reduced-motion` support.

## Contrast (measured on the live page)

| Pair | Ratio | AA (4.5) |
|---|---|---|
| ink / bg | 17.5 | ✅ AAA |
| ink-dim / bg | 8.1 | ✅ AAA |
| gold / bg | 8.2 | ✅ AAA |
| gold-bright / bg | 11.0 | ✅ AAA |
| near-black text / gold button | 8.2 | ✅ AAA |
| ink-mute / bg (labels only) | 4.6 | ✅ AA |

## Accessibility (verified live)
0 images without alt · 0 buttons without names · 0 inputs without labels · single `<h1>` ·
skip link · visible focus rings · keyboard-operable tabs · reduced-motion honored.

## Component inventory
Header + sticky nav · underline category bar · editorial hero · category tiles · product cards
(`.product`) · promo band · tall image showcase (`.showcase`) · underline tabs · numbered features ·
inline newsletter · footer · cookie consent · legal/content styles (`.legal`, `.note`, `.toc`, `.info-card`, `.field`).

*Static, dependency-free, no trackers.*
