import { useI18n, type Lang } from "../lib/i18n";

const LANGS: { code: Lang; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
];

/**
 * Compact FR / EN toggle. `variant="light"` for dark backgrounds (split landing).
 */
export function LanguageSwitcher({ variant = "default" }: { variant?: "default" | "light" }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`lang-switch${variant === "light" ? " light" : ""}`} role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`lang-opt${lang === l.code ? " active" : ""}`}
          aria-pressed={lang === l.code}
          onClick={() => setLang(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
