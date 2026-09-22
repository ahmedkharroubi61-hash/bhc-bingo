/** Minimum length for a customer password. */
export const PASSWORD_MIN = 8;

export interface PasswordRule {
  key: string;
  label: string;
  met: boolean;
}

/**
 * Evaluate a password against the strong-password rules. Returns one entry per
 * rule with whether it's satisfied, so the UI can show a live checklist.
 */
export function checkPassword(password: string): PasswordRule[] {
  return [
    { key: "len", label: `At least ${PASSWORD_MIN} characters`, met: password.length >= PASSWORD_MIN },
    { key: "lower", label: "A lowercase letter", met: /[a-z]/.test(password) },
    { key: "upper", label: "An uppercase letter", met: /[A-Z]/.test(password) },
    { key: "number", label: "A number", met: /\d/.test(password) },
    { key: "symbol", label: "A symbol (!?@#…)", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

/** True when every strong-password rule is satisfied. */
export function isStrongPassword(password: string): boolean {
  return checkPassword(password).every((r) => r.met);
}
