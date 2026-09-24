import { SectionHead } from "../components/SectionHead";
import { StoreMap } from "../components/StoreMap";
import { IconInstagram, IconWhatsapp, IconPhone } from "../components/icons";
import { useT } from "../lib/i18n";
import { WHATSAPP_NUMBER, CONTACT_PHONE, INSTAGRAM_URL, INSTAGRAM_HANDLE, STORE } from "../lib/config";

export function ContactPage() {
  const t = useT();
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}`;
  const telHref = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;

  return (
    <section className="section">
      <div className="container">
        <SectionHead idx="—" title={t("Contact Us")} meta={t("We're here to help")} />
        <div className="contact-layout">
          <div className="contact-cards">
            <a className="contact-card" href={waHref} target="_blank" rel="noreferrer">
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

            <a className="contact-card" href={telHref}>
              <span className="contact-ico"><IconPhone /></span>
              <span className="contact-card-body">
                <span className="contact-card-t">{t("Phone")}</span>
                <span className="contact-card-s">{CONTACT_PHONE}</span>
                <span className="contact-card-cta">{t("Call us")} →</span>
              </span>
            </a>
          </div>

          <div className="contact-map">
            <h3 className="summary-h">{t("Visit the shop")}</h3>
            <p className="note-sm" style={{ marginTop: -4, marginBottom: 12 }}>{STORE.name} · {STORE.area}</p>
            <StoreMap height={300} />
          </div>
        </div>
      </div>
    </section>
  );
}
