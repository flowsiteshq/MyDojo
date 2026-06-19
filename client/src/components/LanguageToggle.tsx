import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LanguageToggleProps {
  variant?: "desktop" | "mobile";
}

export function LanguageToggle({ variant = "desktop" }: LanguageToggleProps) {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === "es";

  const toggle = () => {
    i18n.changeLanguage(isSpanish ? "en" : "es");
  };

  if (variant === "mobile") {
    return (
      <button
        onClick={toggle}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Toggle language"
      >
        <Globe className="h-4 w-4 text-primary" />
        <span>{isSpanish ? "🇺🇸 English" : "🇲🇽 Español"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-colors"
      aria-label="Toggle language"
      title={isSpanish ? "Switch to English" : "Cambiar a Español"}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{isSpanish ? "EN" : "ES"}</span>
    </button>
  );
}
