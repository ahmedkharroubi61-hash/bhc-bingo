import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";
import { useProducts } from "../lib/useProducts";
import { useCategoryNav } from "../lib/useCategoryNav";
import { StoreMap } from "../components/StoreMap";
import { IconArrow, IconInstagram, IconWhatsapp } from "../components/icons";
import { WHATSAPP_NUMBER, CONTACT_PHONE, INSTAGRAM_URL, INSTAGRAM_HANDLE, STORE } from "../lib/config";

const ABOUT =
  "BHC Bingo is a parapharmacie based in Sousse, Tunisia, bringing you authentic skincare, hair care, wellness products and food supplements from brands we trust. Every product comes from authorised suppliers, and our team is happy to give you professional advice in store or online. Order from home and pay in cash on delivery anywhere in Tunisia (delivery is 7 DT, free from 100 DT), or pick up your order at our shop.";

const svg = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

const VALUES = [
  { title: "Authentic products", text: "Every product comes from authorised suppliers, never grey imports.",
    icon: <svg {...svg}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg> },
  { title: "Expert advice", text: "Not sure what suits your skin? Ask us in store or on WhatsApp.",
    icon: <svg {...svg}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" /></svg> },
  { title: "Pay on delivery", text: "No card needed. You pay in cash when your order arrives.",
    icon: <svg {...svg}><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v5M18 9.5v5" /></svg> },
  { title: "Delivery across Tunisia", text: "7 DT delivery, free from 100 DT, or pick up at our shop.",
    icon: <svg {...svg}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></svg> },
];

/** Counts up from 0 to `to` the first time it scrolls into view. */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || to <= 0) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(to); return; }
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const DURATION = 1400;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / DURATION);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); // ease-out
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{n}{suffix}</span>;
}

export function AboutPage() {
  const t = useT();
  const products = useProducts();
  const categories = useCategoryNav();
  const productCount = products?.length ?? 0;
  const brandCount = new Set((products ?? []).map((p) => p.brand)).size;

  return (
    <div className="nu-page ab">
      {/* HERO */}
      <section className="ab-hero" aria-labelledby="ab-title">
        <div className="container ab-hero-grid">
          <div className="ab-hero-copy">
            <p className="nu-eyebrow">{t("Our story")}</p>
            <h1 className="ab-title" id="ab-title">{t("Your parapharmacie in Sousse, now at your door.")}</h1>
            <p className="ab-lead">{t(ABOUT)}</p>
            <div className="ab-ctas">
              <Link className="nu-pill nu-pill-dark" to="/category/all">{t("Browse the shop")} <IconArrow /></Link>
              <Link className="nu-pill" to="/contact">{t("Contact Us")}</Link>
            </div>
          </div>
          <div className="ab-collage" aria-hidden="true">
            <img className="ab-img-main" src="/img/hero-lifestyle.jpg" alt="" />
            <img className="ab-img-small" src="/img/lifestyle-2.jpg" alt="" loading="lazy" />
            <div className="ab-badge">
              <strong>100%</strong>
              <span>{t("Authentic")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="section ab-values" aria-labelledby="ab-values-title">
        <div className="container">
          <p className="nu-eyebrow">{t("Why BHC Bingo")}</p>
          <h2 className="nu-h2" id="ab-values-title">{t("Care you can trust")}</h2>
          <div className="ab-cards">
            {VALUES.map((v, i) => (
              <article className="ab-card" key={v.title} style={{ ["--i" as string]: i }}>
                <span className="ab-card-ico">{v.icon}</span>
                <h3>{t(v.title)}</h3>
                <p>{t(v.text)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <section className="section nu-band ab-band" aria-label={t("BHC Bingo in numbers")}>
        <div className="container nu-band-grid">
          <h2 className="nu-band-h">{t("Hand-picked skincare, hair care, baby care and supplements, all in one place.")}</h2>
          <div className="nu-stats">
            <div className="nu-stat"><span className="nu-stat-n"><CountUp to={productCount} suffix="+" /></span><span className="nu-stat-l">{t("Products")}</span></div>
            <div className="nu-stat"><span className="nu-stat-n"><CountUp to={brandCount} /></span><span className="nu-stat-l">{t("Brands")}</span></div>
            <div className="nu-stat"><span className="nu-stat-n"><CountUp to={categories.length} /></span><span className="nu-stat-l">{t("Categories")}</span></div>
            <div className="nu-stat"><span className="nu-stat-n"><CountUp to={100} suffix="%" /></span><span className="nu-stat-l">{t("Authentic")}</span></div>
          </div>
        </div>
      </section>

      {/* VISIT */}
      <section className="section ab-visit" aria-labelledby="ab-visit-title">
        <div className="container ab-visit-grid">
          <div>
            <p className="nu-eyebrow">{t("Visit us")}</p>
            <h2 className="nu-h2" id="ab-visit-title">{STORE.name}</h2>
            <p className="ab-visit-area">{STORE.area}</p>
            <p className="nu-dim">{t("Come and see us in store, or reach us any time:")}</p>
            <div className="contact-cards ab-contacts">
              <a className="contact-card" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                <span className="contact-ico contact-ico-wa"><IconWhatsapp /></span>
                <span className="contact-card-body">
                  <span className="contact-card-t">WhatsApp</span>
                  <span className="contact-card-s">{CONTACT_PHONE}</span>
                  <span className="contact-card-cta">{t("Chat on WhatsApp")} →</span>
                </span>
              </a>
              <a className="contact-card" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                <span className="contact-ico contact-ico-ig"><IconInstagram /></span>
                <span className="contact-card-body">
                  <span className="contact-card-t">Instagram</span>
                  <span className="contact-card-s">{INSTAGRAM_HANDLE}</span>
                  <span className="contact-card-cta">{t("Follow us")} →</span>
                </span>
              </a>
            </div>
          </div>
          <div className="ab-map"><StoreMap height={360} /></div>
        </div>
      </section>

      {/* CTA */}
      <section className="section ab-cta">
        <div className="container">
          <div className="ab-cta-inner">
            <h2 className="ab-cta-h">{t("Ready to find your next favourite?")}</h2>
            <Link className="nu-pill nu-pill-dark" to="/category/all">{t("Browse the shop")} <IconArrow /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
