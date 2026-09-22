/** Default network timeout for user-facing requests (ms). */
export const DEFAULT_TIMEOUT_MS = 15_000;

class TimeoutError extends Error {
  constructor() {
    super("The request timed out. Please check your connection and try again.");
    this.name = "TimeoutError";
  }
}

/**
 * Race a promise against a timeout so a hung request never leaves the UI stuck
 * in a loading state. Rejects with a user-safe TimeoutError on expiry.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(
      (value) => { clearTimeout(id); resolve(value); },
      (err) => { clearTimeout(id); reject(err); }
    );
  });
}
