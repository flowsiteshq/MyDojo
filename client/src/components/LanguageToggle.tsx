import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

interface LanguageToggleProps {
  variant?: "desktop" | "mobile";
}

export function LanguageToggle({ variant = "desktop" }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  const toggle = () => setLanguage(language === "en" ? "es" : "en");

  if (variant === "mobile") {
    return (
      <button
        onClick={toggle}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Toggle language"
      >
        <Globe className="h-4 w-4 text-primary" />
        <span>{language === "en" ? "Español" : "English"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-colors"
      aria-label="Toggle language"
      title={language === "en" ? "Switch to Spanish" : "Cambiar a Inglés"}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{language === "en" ? "ES" : "EN"}</span>
    </button>
  );
}
