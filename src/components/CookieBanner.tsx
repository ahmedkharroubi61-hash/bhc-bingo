import { useEffect, useState } from "react";

const KEY = "bingo_cookie_consent_v1";
type Consent = { necessary: true; analytics: boolean; marketing: boolean; ts?: string };

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setOpen(true); } catch { setOpen(true); }
    const openHandler = () => { setShowPrefs(true); setOpen(true); };
    window.addEventListener("open-cookie-settings", openHandler);
    return () => window.removeEventListener("open-cookie-settings", openHandler);
  }, []);

  const save = (c: Consent) => {
    c.ts = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* ignore */ }
    document.documentElement.dataset.consentAnalytics = c.analytics ? "granted" : "denied";
    setOpen(false);
  };

  if (!open) return null;
  return (
    <section className="cookie-banner" role="dialog" aria-modal="false" aria-labelledby="cookie-title">
      <h3 id="cookie-title">We value your privacy</h3>
      <p>We use cookies that are strictly necessary to run this site. With your consent, we may also use analytics cookies. No analytics or marketing cookies are set unless you allow them. Read our <a href="/cookie-policy">Cookie Policy</a>.</p>
      <div className="cookie-actions">
        <button className="btn btn-gold" type="button" onClick={() => save({ necessary: true, analytics: true, marketing: true })}>Accept all</button>
        <button className="btn btn-outline" type="button" onClick={() => save({ necessary: true, analytics: false, marketing: false })}>Reject non-essential</button>
        <button className="btn btn-ghost" type="button" aria-expanded={showPrefs} onClick={() => setShowPrefs((v) => !v)}>Customise</button>
      </div>
      {showPrefs ? (
        <div className="cookie-prefs">
          <div className="cookie-opt">
            <input type="checkbox" id="opt-necessary" checked disabled />
            <label htmlFor="opt-necessary"><strong>Strictly necessary</strong><span>Required for the site to work. Always on.</span></label>
          </div>
          <div className="cookie-opt">
            <input type="checkbox" id="opt-analytics" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            <label htmlFor="opt-analytics"><strong>Analytics</strong><span>Loaded only if you allow it.</span></label>
          </div>
          <div className="cookie-opt">
            <input type="checkbox" id="opt-marketing" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            <label htmlFor="opt-marketing"><strong>Marketing</strong><span>Currently none are used — reserved for future use.</span></label>
          </div>
          <button className="btn btn-gold btn-block" type="button" onClick={() => save({ necessary: true, analytics, marketing })}>Save my choices</button>
        </div>
      ) : null}
    </section>
  );
}
