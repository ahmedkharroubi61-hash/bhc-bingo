import type { Product } from "../lib/types";

/** Editorial product-detail content. Representative copy for the demo —
 *  replace ingredient lists with the supplier's official INCI before launch. */
export interface ProductContent {
  description: string;
  bestFor: string;
  ingredients: string;
  howToUse: string;
}

const specific: Record<string, ProductContent> = {
  "argan-shampoo-750": {
    description:
      "A gentle, nourishing cleanser enriched with Moroccan argan oil. It softly removes build-up while restoring softness, slip and shine to dry, over-worked hair.",
    bestFor: "Dry, frizzy or colour-treated hair that needs moisture and manageability.",
    ingredients:
      "Aqua, Argania Spinosa (Argan) Kernel Oil, Cocamidopropyl Betaine, Glycerin, Panthenol (Pro-Vitamin B5), Hydrolyzed Keratin, Tocopherol (Vitamin E), Parfum.",
    howToUse: "Massage into wet hair and scalp, lather, then rinse. Follow with the matching conditioner.",
  },
  "argan-conditioner-350": {
    description:
      "A rich argan-oil conditioner that detangles and deeply hydrates, sealing the cuticle for smoother, glossier lengths without weighing hair down.",
    bestFor: "Dry, coarse or unruly hair in need of slip and shine.",
    ingredients:
      "Aqua, Cetearyl Alcohol, Argania Spinosa (Argan) Kernel Oil, Behentrimonium Chloride, Glycerin, Panthenol, Hydrolyzed Keratin, Tocopherol, Parfum.",
    howToUse: "After shampooing, work through mid-lengths to ends, leave 2–3 minutes, then rinse.",
  },
  "argan-masque-200": {
    description:
      "An intensive weekly masque that floods hair with argan oil and proteins to repair damage, restore elasticity and leave hair feeling deeply conditioned.",
    bestFor: "Damaged, brittle or chemically-treated hair needing deep repair.",
    ingredients:
      "Aqua, Cetearyl Alcohol, Argania Spinosa (Argan) Kernel Oil, Hydrolyzed Keratin, Butyrospermum Parkii (Shea) Butter, Panthenol, Tocopherol, Parfum.",
    howToUse: "Apply to clean, towel-dried hair, leave 5–10 minutes, then rinse. Use 1–2× weekly.",
  },
  "marula-mask-300": {
    description:
      "A lightweight yet powerful repair mask powered by marula oil. Sulfate-, paraben- and phthalate-free, it smooths, strengthens and adds a diamond-bright finish.",
    bestFor: "Fine to medium hair that wants repair without heaviness.",
    ingredients:
      "Aqua, Sclerocarya Birrea (Marula) Seed Oil, Cetearyl Alcohol, Behentrimonium Methosulfate, Hydrolyzed Keratin, Panthenol, Tocopherol, Parfum. Sulfate, paraben & phthalate free.",
    howToUse: "Apply to washed, towel-dried hair from mid-length to ends, leave 3–5 minutes, rinse.",
  },
  "isdin-ureadin-podos-75": {
    description:
      "A fast-absorbing gel-oil for feet with 10% urea. It softens hardened skin on heels and soles while intensely hydrating, for visibly smoother, repaired feet.",
    bestFor: "Rough, cracked heels and dry, thickened skin on the feet.",
    ingredients:
      "Aqua, Urea (10%), Lactic Acid, Panthenol, Allantoin, Butyrospermum Parkii (Shea) Butter, Bacillus Ferment, Tocopheryl Acetate.",
    howToUse: "Apply to clean, dry feet twice daily; once improved, use once daily to maintain.",
  },
  "isdin-magic-glow-50": {
    description:
      "A weightless Fusion Water facial sunscreen with SPF 50 and illuminating micro-pearls for a healthy, radiant glow. Melts in instantly with no white cast.",
    bestFor: "Daily facial sun protection with a luminous, dewy finish.",
    ingredients:
      "Aqua, UVA/UVB Filters, Hyaluronic Acid, Mediterranean Algae Extract, Vitamin E, Illuminating Micro-Pearls, Glycerin.",
    howToUse: "Apply generously to the face 15 minutes before sun exposure; reapply every 2 hours.",
  },
};

function generic(p: Product): ProductContent {
  const byCategory: Record<string, Pick<ProductContent, "bestFor" | "howToUse">> = {
    sun: { bestFor: "Daily protection against UVA/UVB and light-induced ageing.", howToUse: "Apply generously 15 minutes before sun exposure and reapply every 2 hours." },
    hair: { bestFor: "Everyday care for softer, healthier-looking hair.", howToUse: "Use as part of your regular hair-care routine as directed on the pack." },
    body: { bestFor: "Daily hydration and care for the body.", howToUse: "Apply to clean skin and massage in until absorbed." },
    face: { bestFor: "Daily facial care for a healthy, balanced complexion.", howToUse: "Apply to clean skin morning and/or evening." },
    skincare: { bestFor: "A considered addition to your daily skincare routine.", howToUse: "Apply to clean skin and follow with your usual routine." },
    makeup: { bestFor: "An easy-to-wear finish for everyday looks.", howToUse: "Apply as desired and build to your preferred coverage." },
    baby: { bestFor: "Gentle, everyday care for delicate skin.", howToUse: "Apply as needed to clean skin." },
    wellness: { bestFor: "Everyday wellness and self-care.", howToUse: "Use as directed on the packaging." },
  };
  const c = byCategory[p.category] ?? byCategory.skincare;
  return {
    description: `${p.title} by ${p.brand} — an authentic ${p.category} product, chosen for our edit for its quality and everyday results.`,
    bestFor: c.bestFor,
    ingredients: "Full ingredient list available on the product packaging. Contact us for the complete INCI list.",
    howToUse: c.howToUse,
  };
}

export function contentFor(p: Product): ProductContent {
  return specific[p.id] ?? generic(p);
}
