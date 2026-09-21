import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CookieBanner } from "./CookieBanner";
import { CartDrawer } from "./CartDrawer";

export function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Scroll-reveal — skipped entirely for reduced-motion users (CSS also guards it).
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    // Observe every not-yet-revealed section. Re-runnable so sections that mount
    // AFTER this effect (async data, e.g. the product page) still get revealed.
    const observeAll = () => {
      document
        .querySelectorAll<HTMLElement>(".section:not(.is-in), .promo:not(.is-in)")
        .forEach((el) => io.observe(el));
    };
    observeAll();

    const main = document.getElementById("main");
    const mo = new MutationObserver(observeAll);
    if (main) mo.observe(main, { childList: true, subtree: true });

    // Failsafe: reveal anything already in or above the viewport so content can
    // never stay hidden — while sections below the fold still reveal on scroll.
    const failsafe = window.setTimeout(() => {
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>(".section, .promo").forEach((el) => {
        if (el.getBoundingClientRect().top < vh * 0.9) el.classList.add("is-in");
      });
    }, 1200);

    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(failsafe);
    };
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <Header />
      <main id="main"><Outlet /></main>
      <Footer />
      <CartDrawer />
      <CookieBanner />
    </>
  );
}
