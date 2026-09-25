import { useState } from "react";
import { IconStar } from "./icons";
import { useT } from "../lib/i18n";
import { getMyStars, rateProduct } from "../lib/ratings";

interface Props {
  productId: string;
  rating: number;
  ratingCount: number;
}

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * Product rating: a read-only average summary plus an interactive "tap to rate"
 * star row (stars only — no written reviews). Voting is anonymous and one vote
 * per browser; the server blends it into the average.
 */
export function ProductRating({ productId, rating, ratingCount }: Props) {
  const t = useT();
  const [avg, setAvg] = useState(rating);
  const [count, setCount] = useState(ratingCount);
  const [mine, setMine] = useState<number | null>(() => getMyStars(productId));
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filledTo = hover || mine || Math.round(avg);

  async function submit(stars: number) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNote(null);
    const prev = mine;
    setMine(stars); // optimistic
    const res = await rateProduct(productId, stars);
    setBusy(false);
    if (res.ok) {
      setAvg(res.result.rating);
      setCount(res.result.ratingCount);
      setNote(t("Thanks for rating!"));
    } else {
      setMine(prev);
      setError(res.error);
    }
  }

  return (
    <div className="pdp-rate">
      <span className="rating" aria-label={`${t("Rated")} ${avg.toFixed(1)} / 5`}>
        <IconStar /> {avg.toFixed(1)} <span className="count">({count})</span>
      </span>

      <div className="pdp-rate-set">
        <span className="pdp-rate-label">{mine ? t("Your rating") : t("Rate this product")}</span>
        <div
          className="pdp-stars"
          role="radiogroup"
          aria-label={t("Rate this product")}
          onMouseLeave={() => setHover(0)}
        >
          {STARS.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={mine === s}
              aria-label={`${s} ${s === 1 ? t("star") : t("stars")}`}
              className={`pdp-star${s <= filledTo ? " is-on" : ""}`}
              disabled={busy}
              onMouseEnter={() => setHover(s)}
              onFocus={() => setHover(s)}
              onBlur={() => setHover(0)}
              onClick={() => submit(s)}
            >
              <IconStar size={26} />
            </button>
          ))}
        </div>
        {note ? <span className="pdp-rate-note is-ok">{note}</span> : null}
        {error ? <span className="pdp-rate-note is-err">{error}</span> : null}
      </div>
    </div>
  );
}
