import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Delete } from "lucide-react";

interface PinConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the entered PIN when the user clicks Confirm */
  onConfirm: (pin: string) => void;
  /** Whether the parent mutation is pending */
  isPending?: boolean;
  /** Optional error message to display (e.g., "Incorrect PIN") */
  error?: string | null;
  /** Label for the action being confirmed */
  actionLabel?: string;
  /** Description shown below the title */
  description?: string;
}

/**
 * A reusable 6-digit PIN entry dialog.
 * Renders 6 individual digit boxes. Auto-submits when the 6th digit is entered.
 */
export function PinConfirmDialog({
  open,
  onClose,
  onConfirm,
  isPending = false,
  error = null,
  actionLabel = "Delete",
  description,
}: PinConfirmDialogProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset digits whenever dialog opens
  useEffect(() => {
    if (open) {
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const next = [...digits];
        if (next[index]) {
          next[index] = "";
          setDigits(next);
        } else if (index > 0) {
          next[index - 1] = "";
          setDigits(next);
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else if (e.key === "Enter") {
        const pin = digits.join("");
        if (pin.length === 6) onConfirm(pin);
      }
    },
    [digits, onConfirm]
  );

  const handleChange = useCallback(
    (index: number, value: string) => {
      // Accept only single digits
      const digit = value.replace(/\D/g, "").slice(-1);
      const next = [...digits];
      next[index] = digit;
      setDigits(next);

      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all 6 digits are filled
      if (digit && index === 5) {
        const pin = next.join("");
        if (pin.length === 6) {
          setTimeout(() => onConfirm(pin), 80);
        }
      }
    },
    [digits, onConfirm]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;
      const next = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setDigits(next);
      const focusIdx = Math.min(pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
      if (pasted.length === 6) {
        setTimeout(() => onConfirm(pasted), 80);
      }
    },
    [digits, onConfirm]
  );

  const handleClear = () => {
    setDigits(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const pin = digits.join("");

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isPending) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-lg">Enter Delete PIN</DialogTitle>
          </div>
          <DialogDescription>
            {description ?? `Enter your 6-digit security PIN to confirm this ${actionLabel.toLowerCase()} action. This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>

        {/* PIN Input Boxes */}
        <div className="flex justify-center gap-2 py-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              disabled={isPending}
              className={`w-11 h-14 text-center text-2xl font-bold border-2 rounded-lg outline-none transition-colors
                ${d ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}
                ${error ? "border-red-400 bg-red-50" : ""}
                focus:border-red-500 focus:ring-2 focus:ring-red-200
                disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-center text-sm text-red-600 font-medium -mt-2 mb-1">
            {error}
          </p>
        )}

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isPending || digits.every((d) => !d)}
            className="text-gray-500 gap-1"
          >
            <Delete className="w-3.5 h-3.5" />
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(pin)}
              disabled={pin.length !== 6 || isPending}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[90px]"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : (
                `Confirm ${actionLabel}`
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
