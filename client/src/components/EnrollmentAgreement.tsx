import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, FileText, CheckCircle2, PenLine } from "lucide-react";

export interface AgreementSignature {
  signedName: string;
  signedAt: Date;
}

interface EnrollmentAgreementProps {
  customerName: string;
  studentName?: string;
  packageName: string;
  monthlyPrice: number;
  totalDueToday: number;
  enrollmentFeeWaived?: boolean;
  onAccepted: (sig: AgreementSignature) => void;
}

// Individual collapsible section component
function ContractSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 text-left gap-3 active:bg-gray-100"
        style={{ minHeight: 56 }}
      >
        <span className="font-semibold text-gray-900 text-base leading-snug">{title}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 py-4 bg-white text-gray-700 text-base leading-relaxed space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

export function EnrollmentAgreement({
  customerName,
  studentName,
  packageName,
  monthlyPrice,
  totalDueToday,
  enrollmentFeeWaived = false,
  onAccepted,
}: EnrollmentAgreementProps) {
  const [allSectionsRead, setAllSectionsRead] = useState(false);
  const [typedName, setTypedName] = useState(customerName.trim());
  const [accepted, setAccepted] = useState(false);
  const [showSignature, setShowSignature] = useState(false);

  const participantName =
    studentName && studentName !== customerName ? studentName : customerName;
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Normalize: collapse multiple spaces, trim, lowercase for comparison
  const normalizeName = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  const nameMatches = normalizeName(typedName) === normalizeName(customerName);
  // Name confirmed + having clicked through the agreement is sufficient — no separate checkbox needed
  const canProceed = allSectionsRead && nameMatches;

  const handleProceed = () => {
    if (!canProceed) return;
    onAccepted({ signedName: typedName.trim(), signedAt: new Date() });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-3">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Enrollment Agreement</h2>
        <p className="text-gray-500 text-base mt-1">
          MyDojo Martial Arts &amp; Fitness · {today}
        </p>
      </div>

      {/* ── Summary banner ── */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 space-y-1">
        <p className="font-semibold text-gray-900 text-base">{packageName}</p>
        <p className="text-gray-600 text-sm">
          Member: <strong>{customerName}</strong>
          {participantName !== customerName && (
            <> · Student: <strong>{participantName}</strong></>
          )}
        </p>
        <div className="flex justify-between text-sm text-gray-600 pt-1">
          <span>Monthly rate</span>
          <span className="font-medium">${monthlyPrice.toFixed(2)}/mo</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-primary/20 pt-1">
          <span>Due today</span>
          <span>${totalDueToday.toFixed(2)}</span>
        </div>
        {enrollmentFeeWaived && (
          <p className="text-xs text-green-700 font-medium">✓ Enrollment fee waived</p>
        )}
      </div>

      {/* ── Instructions ── */}
      <p className="text-gray-600 text-base text-center">
        Please read each section below, then scroll down to sign.
      </p>

      {/* ── Collapsible contract sections ── */}
      <div className="space-y-3">
        <ContractSection title="1. Membership Terms" defaultOpen>
          <p>
            Member enrolls in the <strong>{packageName}</strong> program at a rate of{" "}
            <strong>${monthlyPrice.toFixed(2)} per month</strong>. The total amount due today is{" "}
            <strong>${totalDueToday.toFixed(2)}</strong>
            {enrollmentFeeWaived
              ? " (enrollment fee waived as a promotional discount)"
              : " (includes first month's tuition and a one-time enrollment fee)"}
            . Monthly billing continues on a recurring basis until cancelled in accordance with the
            cancellation policy below.
          </p>
          <p>Membership fees are non-refundable once the billing period has begun.</p>
        </ContractSection>

        <ContractSection title="2. Cancellation Policy — 30-Day Written Notice">
          <p>
            You may cancel at any time by submitting a written cancellation request at least{" "}
            <strong>30 days before the next billing date</strong>. Requests may be submitted:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>In person at the front desk (written form required)</li>
            <li>
              Via email to <strong>info@mydojoma.com</strong> with subject "Cancellation Request"
            </li>
            <li>
              Through the Member Portal at <strong>mydojoma.com/account</strong>
            </li>
          </ul>
          <p>
            One final monthly payment will be processed on the next billing date to satisfy the
            30-day notice period. Verbal cancellations are not accepted. Failure to attend classes
            does not constitute cancellation.
          </p>
        </ContractSection>

        <ContractSection title="3. Membership Freeze Policy">
          <p>
            Members in good standing may request to freeze their membership for a temporary period
            (e.g., summer break, travel, medical leave):
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Request must be submitted in writing at least 7 days before the freeze start date</li>
            <li>Minimum: 1 month · Maximum: 3 consecutive months per calendar year</li>
            <li>No monthly fees are charged during an approved freeze period</li>
            <li>Membership term is extended by the length of the freeze</li>
          </ul>
          <p>MyDojo reserves the right to approve or deny freeze requests at its sole discretion.</p>
        </ContractSection>

        <ContractSection title="4. Assumption of Risk">
          <p>
            I understand that participation in martial arts, kickboxing, and fitness training involves
            inherent risks including:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Physical contact with participants, instructors, and equipment</li>
            <li>Sprains, strains, fractures, bruises, and other bodily injuries</li>
            <li>Cardiovascular stress and exertion</li>
            <li>Slips, trips, and falls on training surfaces</li>
            <li>Impact from punching bags, pads, and training equipment</li>
          </ul>
          <p>
            I voluntarily assume all risks associated with my or my child's participation in MyDojo
            programs, whether known or unknown.
          </p>
        </ContractSection>

        <ContractSection title="5. Release of Liability">
          <p>
            In consideration for being permitted to participate, I hereby release, waive, and
            discharge MyDojo Martial Arts &amp; Fitness, its owners, directors, officers, employees,
            instructors, and agents from any and all liability, claims, demands, and causes of action
            arising out of or related to any loss, damage, or injury — including death — that may be
            sustained by me or my child while participating in MyDojo activities or while on the
            premises.
          </p>
          <p>
            I agree to indemnify and hold harmless the Released Parties from any loss, liability,
            damage, or costs, including court costs and attorney's fees.
          </p>
        </ContractSection>

        <ContractSection title="6. Medical Authorization">
          <p>
            I certify that I (or my child) am in good physical condition and do not suffer from any
            known disability or condition that would prevent participation in martial arts or fitness
            activities. I acknowledge that MyDojo recommends consulting a physician before beginning
            any exercise program.
          </p>
          <p>
            In the event of a medical emergency, I authorize MyDojo staff to secure emergency medical
            treatment for me or my child, and I agree to be financially responsible for any costs
            incurred. I understand I should carry my own health insurance.
          </p>
        </ContractSection>

        <ContractSection title="7. Photo &amp; Media Consent">
          <p>
            I grant MyDojo Martial Arts &amp; Fitness permission to photograph and/or video record me
            or my child during classes, events, and activities. These images and recordings may be
            used for promotional, educational, and marketing purposes including social media, websites,
            and print materials.
          </p>
          <p>
            I waive any right to compensation or approval of the final product. If you do not consent
            to photography, please notify the front desk in writing.
          </p>
        </ContractSection>

        <ContractSection title="8. Code of Conduct">
          <p>
            Members and participants are expected to demonstrate respect, discipline, and
            sportsmanship at all times. MyDojo reserves the right to suspend or terminate membership
            without refund for conduct that is disruptive, disrespectful, or dangerous to other
            members, staff, or the facility.
          </p>
        </ContractSection>

        <ContractSection title="9. Governing Law">
          <p>
            This Agreement shall be governed by the laws of the Commonwealth of Massachusetts. Any
            disputes arising from this Agreement shall be resolved in the courts of Massachusetts.
            If any provision of this Agreement is found to be unenforceable, the remaining provisions
            shall remain in full force and effect.
          </p>
        </ContractSection>
      </div>

      {/* ── "I've read everything" button ── */}
      {!showSignature && (
        <Button
          type="button"
          onClick={() => { setAllSectionsRead(true); setShowSignature(true); }}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg"
          style={{ minHeight: 56 }}
        >
          I've Read the Agreement — Continue to Sign
        </Button>
      )}

      {/* ── Signature section ── */}
      {showSignature && (
        <div className="space-y-5 border-t pt-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <PenLine className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">Sign the Agreement</p>
              <p className="text-gray-500 text-sm">Type your full name exactly as shown below</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sign as</p>
            <p className="text-xl font-bold text-gray-900">{customerName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sig-name" className="text-base font-semibold text-gray-900">
              Your Full Name
            </Label>
            <Input
              id="sig-name"
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={`Type "${customerName}"`}
              autoComplete="name"
              autoCapitalize="words"
              className="text-lg h-14 border-2 focus:border-primary"
            />
            {typedName.length > 0 && !nameMatches && (
              <p className="text-red-500 text-sm">
                Name doesn't match. Please type exactly: <strong>{customerName}</strong>
              </p>
            )}
            {nameMatches && (
              <p className="text-green-600 text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Name confirmed
              </p>
            )}
          </div>

          {/* Checkbox */}
          <div
            className={`flex items-start gap-4 rounded-xl p-4 cursor-pointer border-2 ${
              accepted
                ? 'bg-green-50 border-green-400'
                : nameMatches
                ? 'bg-primary/5 border-primary animate-pulse'
                : 'bg-gray-50 border-gray-200'
            }`}
            onClick={() => setAccepted((a) => !a)}
            style={{ minHeight: 64 }}
          >
            <Checkbox
              id="agree-check"
              checked={accepted}
              onCheckedChange={(v) => setAccepted(!!v)}
              className="mt-0.5 w-6 h-6 shrink-0"
            />
            <label htmlFor="agree-check" className={`text-base leading-snug cursor-pointer select-none font-semibold ${
              accepted ? 'text-green-800' : nameMatches ? 'text-primary' : 'text-gray-700'
            }`}>
              {accepted ? '✓ ' : ''}I have read, understood, and agree to all terms of this Enrollment Agreement, Liability
              Waiver, and Photo Consent.
            </label>
          </div>

          {/* Proceed button */}
          <Button
            type="button"
            onClick={handleProceed}
            disabled={!canProceed}
            className="w-full font-bold text-lg bg-primary hover:bg-primary/90 text-white disabled:opacity-40"
            style={{ minHeight: 60 }}
          >
            {canProceed ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Sign &amp; Continue to Payment
              </>
            ) : (
              "Complete all fields above to continue"
            )}
          </Button>

          <p className="text-center text-xs text-gray-400">
            By proceeding you are signing this agreement electronically. Your signature is legally
            binding.
          </p>
        </div>
      )}
    </div>
  );
}
