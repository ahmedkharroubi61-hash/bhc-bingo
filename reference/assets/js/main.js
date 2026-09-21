/* =========================================================================
   BINGO Parapharmacie — front-end behaviour
   - No third-party trackers are loaded anywhere on this site by default.
   - Any analytics/marketing script MUST be gated behind cookie consent.
   - Consent is stored locally in the visitor's browser only.
   ========================================================================= */
(function () {
  "use strict";

  var CONSENT_KEY = "bingo_cookie_consent_v1";

  /* ---------- Sticky header shadow on scroll ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile category toggle ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var catbar = document.querySelector(".catbar");
  if (navToggle && catbar) {
    navToggle.addEventListener("click", function () {
      var open = catbar.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- Wishlist toggle (client-side demo, no data sent) ---------- */
  document.querySelectorAll(".wishlist-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var pressed = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!pressed));
      var label = btn.querySelector(".visually-hidden");
      if (label) label.textContent = pressed ? "Add to wishlist" : "Remove from wishlist";
    });
  });

  /* ---------- Tabbed product sections (accessible) ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    var select = function (tab) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var idx = null;
        if (e.key === "ArrowRight") idx = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") idx = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") idx = 0;
        else if (e.key === "End") idx = tabs.length - 1;
        if (idx !== null) { e.preventDefault(); tabs[idx].focus(); select(tabs[idx]); }
      });
    });
  });

  /* ---------- Newsletter form (requires explicit consent checkbox) ---------- */
  var news = document.querySelector("[data-newsletter]");
  if (news) {
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = news.querySelector(".form-status");
      var email = news.querySelector('input[type="email"]');
      var consent = news.querySelector('input[name="consent"]');
      var setStatus = function (msg, ok) {
        if (!status) return;
        status.textContent = msg;
        status.className = "form-status " + (ok ? "ok" : "err");
      };
      if (!email.value || !email.checkValidity()) { setStatus("Please enter a valid email address.", false); email.focus(); return; }
      if (consent && !consent.checked) { setStatus("Please tick the consent box so we can email you.", false); consent.focus(); return; }
      /* Demo only: no data is transmitted. Wire this to your provider server-side. */
      setStatus("Thank you — you're on the list. (Demo: no data was sent.)", true);
      news.reset();
    });
  }

  /* ---------- Generic demo forms (contact etc.) ---------- */
  document.querySelectorAll("[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (status) { status.textContent = "Thank you — this is a demo form and did not transmit any data."; status.className = "form-status ok"; }
      form.reset();
    });
  });

  /* =======================================================================
     Cookie consent
     ======================================================================= */
  var banner = document.getElementById("cookie-banner");

  function readConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || "null"); }
    catch (e) { return null; }
  }
  function saveConsent(obj) {
    obj.ts = new Date().toISOString();
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(obj)); } catch (e) {}
    applyConsent(obj);
    if (banner) banner.hidden = true;
  }

  /* Only place where analytics would ever be initialised. */
  function applyConsent(consent) {
    document.documentElement.dataset.consentAnalytics = consent.analytics ? "granted" : "denied";
    document.documentElement.dataset.consentMarketing = consent.marketing ? "granted" : "denied";
    if (consent.analytics && typeof window.loadAnalytics === "function" && !window.__analyticsLoaded) {
      window.__analyticsLoaded = true;
      window.loadAnalytics();
    }
    // Marketing scripts (if ever added) would be gated the same way here.
  }

  if (banner) {
    var prefs = document.getElementById("cookie-prefs");
    var optAnalytics = document.getElementById("opt-analytics");
    var optMarketing = document.getElementById("opt-marketing");

    var existing = readConsent();
    if (existing) {
      applyConsent(existing);
    } else {
      banner.hidden = false;
    }

    var byId = function (id) { return document.getElementById(id); };
    var bind = function (id, fn) { var el = byId(id); if (el) el.addEventListener("click", fn); };

    bind("cookie-accept-all", function () {
      saveConsent({ necessary: true, analytics: true, marketing: true });
    });
    bind("cookie-reject", function () {
      saveConsent({ necessary: true, analytics: false, marketing: false });
    });
    bind("cookie-customize", function () {
      if (prefs) { prefs.hidden = false; }
      this.setAttribute("aria-expanded", "true");
    });
    bind("cookie-save", function () {
      saveConsent({
        necessary: true,
        analytics: !!(optAnalytics && optAnalytics.checked),
        marketing: !!(optMarketing && optMarketing.checked)
      });
    });
  }

  /* Allow the footer link "Cookie settings" to reopen the banner. */
  document.querySelectorAll("[data-open-cookie-settings]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      if (banner) {
        var prefs = document.getElementById("cookie-prefs");
        if (prefs) prefs.hidden = false;
        banner.hidden = false;
        banner.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });

  /* Reflect current year in footers */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
