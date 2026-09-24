import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SectionHead } from "../components/SectionHead";
import { StoreMap } from "../components/StoreMap";
import { useAuth } from "../context/AuthContext";
import { useT } from "../lib/i18n";
import { getActiveServices, type Service } from "../lib/services";
import { createReservation, type ReservationReceipt } from "../lib/reservations";
import { RESERVATION_SLOTS, RESERVATION_CLOSED_DOW } from "../lib/config";
import type { ReservationInput, ReservationSlot } from "../lib/types";

const SLOT_LABEL: Record<ReservationSlot, string> = { "10:00": "10:00 AM", "15:00": "3:00 PM" };

/** Today as YYYY-MM-DD in local time (for the date input's min). */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isClosedDay(iso: string): boolean {
  if (!iso) return false;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === RESERVATION_CLOSED_DOW;
}

export function ReservationsPage() {
  const t = useT();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[] | null>(null);
  const [form, setForm] = useState<ReservationInput>({
    name: "", phone: "", service: "", date: "", slot: "10:00", notes: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<ReservationReceipt | null>(null);

  useEffect(() => {
    let alive = true;
    getActiveServices().then((s) => { if (alive) setServices(s); }).catch(() => { if (alive) setServices([]); });
    return () => { alive = false; };
  }, []);

  // Prefill the name from the signed-in customer.
  useEffect(() => {
    if (!user) return;
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (name) setForm((f) => ({ ...f, name: f.name || name }));
  }, [user]);

  const minDate = useMemo(todayISO, []);
  const set = (k: keyof ReservationInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.name.trim() || !form.phone.trim()) { setError("Please enter your name and phone."); return; }
    if (!form.service) { setError("Please choose a service."); return; }
    if (!form.date) { setError("Please pick a date."); return; }
    if (isClosedDay(form.date)) { setError("We're closed on Sundays — please pick another day."); return; }
    setError("");
    setSubmitting(true);
    try {
      const receipt = await createReservation({ ...form, name: form.name.trim(), phone: form.phone.trim() });
      setDone(receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="section">
        <div className="container legal" style={{ maxWidth: 640 }}>
          <p className="kicker">Reservation received</p>
          <h1>Thank you{form.name ? `, ${form.name.split(" ")[0]}` : ""}.</h1>
          <p className="muted">
            Your reservation <strong>{done.id}</strong> for <strong>{done.service}</strong> on{" "}
            <strong>{done.date}</strong> at <strong>{SLOT_LABEL[done.slot]}</strong> has been received.
            We'll call <strong>{form.phone}</strong> to confirm.
          </p>
          <div style={{ marginTop: 24 }}><StoreMap height={220} /></div>
          <p style={{ marginTop: 24 }}><Link className="btn btn-gold" to="/shop">Browse the shop</Link></p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <SectionHead idx="—" title={t("Reservations")} meta={t("By appointment")} />
        <div className="cart-layout">
          <form className="checkout-form" onSubmit={submit} noValidate>
            <h3 className="summary-h">{t("Book a service")}</h3>
            <p className="note-sm" style={{ marginTop: -6, marginBottom: 12 }}>
              {t("Appointments run at 10:00 AM and 3:00 PM. We're closed on Sundays.")}
            </p>

            {services === null ? (
              <p className="muted">{t("Loading services…")}</p>
            ) : services.length === 0 ? (
              <p className="muted">{t("Reservations aren't available yet — please check back soon.")}</p>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="rv-service">{t("Service")} <span className="req" aria-hidden="true">*</span></label>
                  <select id="rv-service" value={form.service} onChange={set("service")} required>
                    <option value="" disabled>{t("Choose a service…")}</option>
                    {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="rv-date">{t("Date")} <span className="req" aria-hidden="true">*</span></label>
                  <input id="rv-date" type="date" min={minDate} value={form.date} onChange={set("date")} required />
                  {isClosedDay(form.date) ? <span className="field-hint err">{t("We're closed on Sundays.")}</span> : null}
                </div>

                <div className="field">
                  <label>{t("Time")} <span className="req" aria-hidden="true">*</span></label>
                  <div className="rv-slots" role="radiogroup" aria-label="Time slot">
                    {RESERVATION_SLOTS.map((slot) => (
                      <button
                        key={slot} type="button" role="radio" aria-checked={form.slot === slot}
                        className={`rv-slot${form.slot === slot ? " active" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, slot }))}
                      >
                        {SLOT_LABEL[slot]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field"><label htmlFor="rv-name">{t("Full name")} <span className="req" aria-hidden="true">*</span></label>
                  <input id="rv-name" value={form.name} onChange={set("name")} autoComplete="name" required /></div>
                <div className="field"><label htmlFor="rv-phone">{t("Phone")} <span className="req" aria-hidden="true">*</span></label>
                  <input id="rv-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" required /></div>
                <div className="field"><label htmlFor="rv-notes">{t("Notes (optional)")}</label>
                  <textarea id="rv-notes" rows={3} value={form.notes} onChange={set("notes")} /></div>

                {error ? <p className="form-status err" role="alert">{error}</p> : null}
                <button className="btn btn-gold btn-block" type="submit" style={{ marginTop: 16 }} disabled={submitting}>
                  {submitting ? t("Sending…") : t("Request reservation")}
                </button>
                <p className="note-sm" style={{ textAlign: "center", marginTop: 12 }}>
                  {t("We'll call to confirm your appointment. No payment needed to book.")}
                </p>
              </>
            )}
          </form>

          <aside className="cart-summary">
            <h3 className="summary-h">{t("Where to find us")}</h3>
            <StoreMap height={200} />
          </aside>
        </div>
      </div>
    </section>
  );
}
