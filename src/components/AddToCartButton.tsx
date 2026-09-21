import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type AtcState = "idle" | "loading" | "added";

const LOADING_MS = 500; // brief "adding" beat before the drawer reveals
const ADDED_MS = 1200; // how long the confirmation check lingers

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface AddToCartButtonProps {
  /** Performs the actual cart mutation (which also opens the cart drawer). */
  onAdd: () => void;
  label: ReactNode;
  className?: string;
  addedLabel?: string;
}

/**
 * Add-to-cart button. The cart is updated immediately on click (which opens the
 * drawer), while the button plays a short spinner → check confirmation.
 * The animation is cosmetic (the cart is local); reduced-motion skips the spinner.
 */
export function AddToCartButton({ onAdd, label, className = "", addedLabel = "Added" }: AddToCartButtonProps) {
  const [state, setState] = useState<AtcState>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const run = () => {
    if (state !== "idle") return;

    // Mutate the cart immediately so the add can never be lost if this view
    // unmounts (e.g. the user navigates) before the animation finishes.
    onAdd();

    if (prefersReducedMotion()) {
      setState("added");
      timers.current.push(window.setTimeout(() => setState("idle"), ADDED_MS));
      return;
    }

    // The spinner → check sequence is purely cosmetic feedback.
    setState("loading");
    timers.current.push(window.setTimeout(() => setState("added"), LOADING_MS));
    timers.current.push(window.setTimeout(() => setState("idle"), LOADING_MS + ADDED_MS));
  };

  return (
    <button
      type="button"
      className={`atc ${className}`}
      data-atc={state}
      onClick={run}
      disabled={state === "loading"}
    >
      <span className="atc-label">{label}</span>
      <span className="atc-spinner" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
          <path d="M12 3a9 9 0 1 0 9 9" />
        </svg>
      </span>
      <span className="atc-added" aria-hidden={state !== "added"}>
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path className="atc-check" d="M20 6L9 17l-5-5" />
        </svg>
        {addedLabel}
      </span>
      <span className="visually-hidden" role="status" aria-live="polite">
        {state === "added" ? "Added to cart" : ""}
      </span>
    </button>
  );
}
