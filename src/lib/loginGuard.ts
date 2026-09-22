// Client-side brute-force / spam guard for login forms.
//
// Supabase Auth already rate-limits sign-in attempts server-side. This adds a
// visible client-side gate so a person hammering a form is locked out with a
// growing cooldown instead of firing unlimited attempts. State is persisted in
// localStorage (per scope) so a page reload cannot reset the counter.

/** Failures allowed before the first lockout kicks in. */
const FREE_ATTEMPTS = 4;
/** Base cooldown once locked; doubles with each further failure. */
const BASE_LOCK_MS = 30_000;
/** Cooldown never grows past this. */
const MAX_LOCK_MS = 15 * 60_000;
/** A run of failures older than this is treated as stale and forgotten. */
const ATTEMPT_WINDOW_MS = 30 * 60_000;

interface GuardState {
  /** Consecutive failed attempts. */
  attempts: number;
  /** Epoch ms of the most recent failure. */
  lastFailureAt: number;
  /** Epoch ms until which the form is locked (0 = not locked). */
  lockedUntil: number;
}

export interface LockStatus {
  locked: boolean;
  /** Milliseconds remaining on the lock (0 when not locked). */
  remainingMs: number;
  /** Consecutive failed attempts recorded. */
  attempts: number;
  /** Attempts left before the next lockout (0 once locking). */
  attemptsLeft: number;
}

export interface LoginGuard {
  getLockStatus: () => LockStatus;
  recordFailure: () => LockStatus;
  resetGuard: () => void;
}

const EMPTY: GuardState = { attempts: 0, lastFailureAt: 0, lockedUntil: 0 };

function read(storageKey: string): GuardState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<GuardState>;
    const state: GuardState = {
      attempts: Number(parsed.attempts) || 0,
      lastFailureAt: Number(parsed.lastFailureAt) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0,
    };
    // Forget a stale streak once it's outside the window and no lock is active.
    if (
      state.lockedUntil <= Date.now() &&
      Date.now() - state.lastFailureAt > ATTEMPT_WINDOW_MS
    ) {
      return EMPTY;
    }
    return state;
  } catch {
    return EMPTY;
  }
}

function write(storageKey: string, state: GuardState): void {
  try {
    if (state.attempts === 0 && state.lockedUntil === 0) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  } catch {
    // Private mode or blocked storage — the guard degrades to in-memory only.
  }
}

function toStatus(state: GuardState): LockStatus {
  const remainingMs = Math.max(0, state.lockedUntil - Date.now());
  return {
    locked: remainingMs > 0,
    remainingMs,
    attempts: state.attempts,
    attemptsLeft: Math.max(0, FREE_ATTEMPTS - state.attempts),
  };
}

/**
 * Build a login guard bound to a storage scope (e.g. "admin", "client").
 * Once the free attempts are used up, each further failure locks the form for
 * an exponentially longer cooldown (30s, 1m, 2m, … capped at 15m).
 */
export function makeLoginGuard(scope: string): LoginGuard {
  const storageKey = `bhc.${scope}.loginGuard`;
  return {
    getLockStatus: () => toStatus(read(storageKey)),
    recordFailure: () => {
      const prev = read(storageKey);
      const attempts = prev.attempts + 1;
      const over = attempts - FREE_ATTEMPTS;
      const lockedUntil =
        over > 0
          ? Date.now() + Math.min(BASE_LOCK_MS * 2 ** (over - 1), MAX_LOCK_MS)
          : 0;
      const next: GuardState = { attempts, lastFailureAt: Date.now(), lockedUntil };
      write(storageKey, next);
      return toStatus(next);
    },
    resetGuard: () => write(storageKey, EMPTY),
  };
}

// Admin login guard + backward-compatible named exports.
const adminGuard = makeLoginGuard("admin");
export const getLockStatus = adminGuard.getLockStatus;
export const recordFailure = adminGuard.recordFailure;
export const resetGuard = adminGuard.resetGuard;

/** Human-friendly countdown label, e.g. "1:05" or "0:09". */
export function formatCountdown(remainingMs: number): string {
  const total = Math.ceil(remainingMs / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
