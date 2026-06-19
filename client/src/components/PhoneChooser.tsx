/**
 * PhoneChooser — shows a "Call or Text?" bottom sheet (mobile) / dialog (desktop)
 * when the user taps/clicks the (877) 4-MYDOJO phone number anywhere on the site.
 */
import { useState } from "react";
import { Phone, MessageSquare, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PHONE_NUMBER = "8774693656";
const PHONE_DISPLAY = "(877) 4-MYDOJO";

interface PhoneChooserProps {
  /** Custom trigger element. Defaults to a styled phone button. */
  children?: React.ReactNode;
  /** Extra class names for the default trigger button */
  className?: string;
}

export function PhoneChooser({ children, className }: PhoneChooserProps) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const handleCall = () => {
    window.location.href = `tel:${PHONE_NUMBER}`;
    setOpen(false);
  };

  const handleText = () => {
    window.location.href = `sms:${PHONE_NUMBER}`;
    setOpen(false);
  };

  return (
    <>
      {/* Trigger */}
      <span
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
        className={className}
        style={{ cursor: "pointer" }}
      >
        {children}
      </span>

      {/* Overlay + Sheet */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="relative z-10 w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{t("contact.title")}</p>
                <p className="text-lg font-bold text-black">{PHONE_DISPLAY}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                  aria-label={t("general.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 mx-6" />

            {/* Options */}
            <div className="flex flex-col gap-3 p-6">
              <button
                onClick={handleCall}
                className="flex items-center gap-4 w-full bg-black text-white rounded-xl px-5 py-4 font-heading font-bold uppercase tracking-wider text-base hover:bg-gray-900 transition-colors"
              >
                <div className="bg-primary rounded-lg p-2 flex-shrink-0">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-base font-black">{t("general.call_us")}</p>
                  <p className="text-xs font-normal text-gray-400 normal-case tracking-normal">{t("phone.call_desc") || "Speak with a staff member now"}</p>
                </div>
              </button>

              <button
                onClick={handleText}
                className="flex items-center gap-4 w-full bg-primary text-white rounded-xl px-5 py-4 font-heading font-bold uppercase tracking-wider text-base hover:bg-primary/90 transition-colors"
              >
                <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-base font-black">{t("general.text_us")}</p>
                  <p className="text-xs font-normal text-white/80 normal-case tracking-normal">{t("phone.text_desc") || "Chat with our AI assistant instantly"}</p>
                </div>
              </button>
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-gray-400 pb-6 px-6">
              {t("phone.ai_note") || "Texting uses our AI assistant — available 24/7"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
